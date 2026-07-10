/**
 * Data-access layer over expo-sqlite.
 *
 * The store hydrates once from `loadSnapshot()` at launch and write-throughs
 * every mutation. Daily-loop reads are scoped to today's local date, so
 * yesterday's meals/water naturally drop off the dashboard at midnight.
 *
 * On web (where expo-sqlite needs a wasm setup we don't ship) every function
 * degrades to a no-op and the app runs in-memory, same as before persistence.
 */
import { Platform } from 'react-native';

import { defaultProfile, seedChat, seedMeals, seedWater } from '@/data/mock';
import type { ChatMessage, Meal, MoodLevel, UserProfile, WaterEntry } from '@/data/types';

import { CREATE_INDEXES, CREATE_TABLES, SCHEMA_VERSION } from './schema';

const DB_NAME = 'sehaty.db';
const isNative = Platform.OS !== 'web';

type SQLiteDatabase = import('expo-sqlite').SQLiteDatabase;

let dbPromise: Promise<SQLiteDatabase> | null = null;

function getDb(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const SQLite = await import('expo-sqlite');
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await migrate(db);
      return db;
    })();
  }
  return dbPromise;
}

async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  if (current >= SCHEMA_VERSION) return;

  await db.withTransactionAsync(async () => {
    for (const sql of CREATE_TABLES) await db.execAsync(sql);
    for (const sql of CREATE_INDEXES) await db.execAsync(sql);
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  });

  if (current === 0) await seedFirstRun(db);
}

/**
 * First run only: plant the design's demo day so the dashboard isn't empty
 * on the trial APK. Rows carry today's date, so they age out at midnight
 * and real logging takes over.
 */
async function seedFirstRun(db: SQLiteDatabase): Promise<void> {
  const date = todayDate();
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    for (const m of seedMeals) {
      await db.runAsync(
        `INSERT OR IGNORE INTO meal_logs (id, ts, date, logged_at, meal_type, source, items_json, total_calories, protein_g, carbs_g, fat_g)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        m.id, now, date, m.loggedAt, m.type, m.source, JSON.stringify(m.items), m.kcal, m.protein, m.carb, m.fat,
      );
    }
    for (const w of seedWater) {
      await db.runAsync(
        `INSERT OR IGNORE INTO water_logs (id, ts, date, logged_at, amount_ml, emoji) VALUES (?, ?, ?, ?, ?, ?)`,
        w.id, now, date, w.loggedAt, w.ml, w.emoji,
      );
    }
    await db.runAsync(
      `INSERT OR IGNORE INTO mood_logs (id, ts, date, score) VALUES (?, ?, ?, ?)`,
      'seed-mood', now, date, 4,
    );
    for (let i = 0; i < seedChat.length; i++) {
      const c = seedChat[i];
      await db.runAsync(
        `INSERT OR IGNORE INTO chat_messages (id, ts, role, content, attached_image_path, extracted_actions_json)
         VALUES (?, ?, ?, ?, ?, ?)`,
        c.id, now + i, c.role, c.text ?? null, c.imageUri ?? null,
        c.card ? JSON.stringify(c.card) : null,
      );
    }
  });
}

function todayDate(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Snapshot load (store hydration)
// ─────────────────────────────────────────────────────────────────────────────

export interface DbSnapshot {
  profile: UserProfile | null;
  onboarded: boolean;
  meals: Meal[];
  water: WaterEntry[];
  mood: MoodLevel | null;
  chat: ChatMessage[];
}

export async function loadSnapshot(): Promise<DbSnapshot | null> {
  if (!isNative) return null;
  const db = await getDb();
  const date = todayDate();

  const profileRow = await db.getFirstAsync<any>('SELECT * FROM user_profile WHERE id = 1');
  const onboardedRow = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM app_meta WHERE key = 'onboarded'`,
  );
  const mealRows = await db.getAllAsync<any>(
    'SELECT * FROM meal_logs WHERE date = ? ORDER BY ts DESC', date,
  );
  const waterRows = await db.getAllAsync<any>(
    'SELECT * FROM water_logs WHERE date = ? ORDER BY ts DESC', date,
  );
  const moodRow = await db.getFirstAsync<{ score: number }>(
    'SELECT score FROM mood_logs WHERE date = ? ORDER BY ts DESC LIMIT 1', date,
  );
  const chatRows = await db.getAllAsync<any>(
    'SELECT * FROM chat_messages ORDER BY ts ASC LIMIT 200',
  );

  return {
    profile: profileRow
      ? {
          name: profileRow.name,
          age: profileRow.age ?? defaultProfile.age,
          sex: profileRow.gender === 'أنثى' ? 'أنثى' : 'ذكر',
          heightCm: profileRow.height_cm ?? defaultProfile.heightCm,
          weightKg: profileRow.weight_kg ?? defaultProfile.weightKg,
          activity: profileRow.job_activity_level ?? defaultProfile.activity,
          goals: JSON.parse(profileRow.goals_json ?? '[]'),
          calorieTarget: profileRow.calorie_target ?? defaultProfile.calorieTarget,
          waterTargetMl: profileRow.water_target_ml ?? defaultProfile.waterTargetMl,
          sleepTargetHours: profileRow.sleep_target_hours ?? defaultProfile.sleepTargetHours,
        }
      : null,
    onboarded: onboardedRow?.value === '1',
    meals: mealRows.map((r) => ({
      id: r.id,
      type: r.meal_type,
      source: r.source,
      loggedAt: r.logged_at,
      kcal: r.total_calories,
      protein: r.protein_g,
      carb: r.carbs_g,
      fat: r.fat_g,
      items: JSON.parse(r.items_json ?? '[]'),
    })),
    water: waterRows.map((r) => ({
      id: r.id, ml: r.amount_ml, emoji: r.emoji ?? '💧', loggedAt: r.logged_at,
    })),
    mood: (moodRow?.score as MoodLevel | undefined) ?? null,
    chat: chatRows.map((r) => ({
      id: r.id,
      role: r.role,
      text: r.content ?? undefined,
      imageUri: r.attached_image_path ?? undefined,
      card: r.extracted_actions_json ? JSON.parse(r.extracted_actions_json) : undefined,
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Write-through mutations (fire-and-forget from the store)
// ─────────────────────────────────────────────────────────────────────────────

function persist(op: (db: SQLiteDatabase) => Promise<unknown>): void {
  if (!isNative) return;
  getDb()
    .then(op)
    .catch((e) => console.warn('[db] write failed:', e));
}

export function saveProfile(p: UserProfile, onboarded: boolean): void {
  persist(async (db) => {
    await db.runAsync(
      `INSERT INTO user_profile (id, name, age, gender, height_cm, weight_kg, job_activity_level, goals_json, calorie_target, water_target_ml, sleep_target_hours)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name, age = excluded.age, gender = excluded.gender,
         height_cm = excluded.height_cm, weight_kg = excluded.weight_kg,
         job_activity_level = excluded.job_activity_level, goals_json = excluded.goals_json,
         calorie_target = excluded.calorie_target, water_target_ml = excluded.water_target_ml,
         sleep_target_hours = excluded.sleep_target_hours`,
      p.name, p.age, p.sex, p.heightCm, p.weightKg, p.activity,
      JSON.stringify(p.goals), p.calorieTarget, p.waterTargetMl, p.sleepTargetHours,
    );
    await db.runAsync(
      `INSERT INTO app_meta (key, value) VALUES ('onboarded', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      onboarded ? '1' : '0',
    );
  });
}

export function insertMeal(m: Meal): void {
  persist((db) =>
    db.runAsync(
      `INSERT INTO meal_logs (id, ts, date, logged_at, meal_type, source, items_json, total_calories, protein_g, carbs_g, fat_g, photo_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      m.id, Date.now(), todayDate(), m.loggedAt, m.type, m.source,
      JSON.stringify(m.items), m.kcal, m.protein, m.carb, m.fat, null,
    ),
  );
}

export function insertWater(w: WaterEntry): void {
  persist((db) =>
    db.runAsync(
      `INSERT INTO water_logs (id, ts, date, logged_at, amount_ml, emoji) VALUES (?, ?, ?, ?, ?, ?)`,
      w.id, Date.now(), todayDate(), w.loggedAt, w.ml, w.emoji,
    ),
  );
}

export function insertMood(id: string, score: MoodLevel, note?: string): void {
  persist((db) =>
    db.runAsync(
      `INSERT INTO mood_logs (id, ts, date, score, note) VALUES (?, ?, ?, ?, ?)`,
      id, Date.now(), todayDate(), score, note ?? null,
    ),
  );
}

export function insertChatMessage(msg: ChatMessage): void {
  persist((db) =>
    db.runAsync(
      `INSERT INTO chat_messages (id, ts, role, content, attached_image_path, extracted_actions_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      msg.id, Date.now(), msg.role, msg.text ?? null, msg.imageUri ?? null,
      msg.card ? JSON.stringify(msg.card) : null,
    ),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers for tables whose screens land in later phases. Kept minimal on
// purpose — the schema exists now; richer queries come with their screens.
// ─────────────────────────────────────────────────────────────────────────────

export function upsertDailyLog(date: string, patch: { weightKg?: number; energyLevel?: number; moodScore?: number }): void {
  persist((db) =>
    db.runAsync(
      `INSERT INTO daily_logs (id, date, weight_kg, energy_level, mood_score) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(date) DO UPDATE SET
         weight_kg = COALESCE(excluded.weight_kg, daily_logs.weight_kg),
         energy_level = COALESCE(excluded.energy_level, daily_logs.energy_level),
         mood_score = COALESCE(excluded.mood_score, daily_logs.mood_score)`,
      `dl-${date}`, date, patch.weightKg ?? null, patch.energyLevel ?? null, patch.moodScore ?? null,
    ),
  );
}

export function saveWeeklySummary(weekStartDate: string, summaryJson: object): void {
  persist((db) =>
    db.runAsync(
      `INSERT INTO weekly_memory_summary (id, week_start_date, summary_json) VALUES (?, ?, ?)
       ON CONFLICT(week_start_date) DO UPDATE SET summary_json = excluded.summary_json`,
      `wm-${weekStartDate}`, weekStartDate, JSON.stringify(summaryJson),
    ),
  );
}

/** Latest weekly memory summary + last-7-days raw rows → the AI "context card". */
export async function buildContextCard(): Promise<object | null> {
  if (!isNative) return null;
  const db = await getDb();
  const memory = await db.getFirstAsync<{ summary_json: string }>(
    'SELECT summary_json FROM weekly_memory_summary ORDER BY week_start_date DESC LIMIT 1',
  );
  const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const meals = await db.getAllAsync<any>(
    'SELECT date, meal_type, total_calories, protein_g, carbs_g, fat_g FROM meal_logs WHERE ts >= ?', since,
  );
  const water = await db.getAllAsync<any>(
    'SELECT date, SUM(amount_ml) AS total_ml FROM water_logs WHERE ts >= ? GROUP BY date', since,
  );
  const mood = await db.getAllAsync<any>(
    'SELECT date, score FROM mood_logs WHERE ts >= ?', since,
  );
  const sleep = await db.getAllAsync<any>(
    'SELECT date, hours, quality_score FROM sleep_logs WHERE date >= date(?, "unixepoch")', Math.floor(since / 1000),
  );
  const profile = await db.getFirstAsync<any>('SELECT * FROM user_profile WHERE id = 1');
  return {
    profile,
    weekly_memory: memory ? JSON.parse(memory.summary_json) : null,
    last_7_days: { meals, water, mood, sleep },
  };
}
