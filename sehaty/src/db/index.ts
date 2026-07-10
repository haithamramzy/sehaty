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

import {
  defaultProfile, seedChat, seedEquipment, seedMedicalRecords, seedMeds, seedMeals,
  seedSleep, seedWater, seedWorkoutPlan,
} from '@/data/mock';
import type {
  AppSettings, ChatMessage, DaySummary, EmergencyCard, GymEquipment, Meal, MedIntake,
  MedicalRecord, MedicalRecordType, Medication, MoodLevel, SleepEntry, UserProfile,
  WaterEntry, WorkoutDay,
} from '@/data/types';

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
    for (const m of seedMeds) {
      await db.runAsync(
        `INSERT OR IGNORE INTO medication_logs (id, name, dosage, type, start_date, end_date, active, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'manual')`,
        m.id, m.name, [m.dosage ?? '', m.timing ?? ''].join('|'), m.kind,
        m.startDate ?? null, m.endDate ?? null, m.active ? 1 : 0,
      );
    }
    for (const s of seedSleep) {
      await db.runAsync(
        `INSERT OR IGNORE INTO sleep_logs (id, date, hours, quality_score, last_coffee_time, last_cigarette_time, source)
         VALUES (?, ?, ?, ?, ?, ?, 'manual')`,
        s.id, s.date, s.hours, s.quality, s.lastCoffeeTime ?? null, s.lastCigaretteTime ?? null,
      );
    }
    for (const rec of seedMedicalRecords) {
      await db.runAsync(
        `INSERT OR IGNORE INTO medical_records (id, date, type, extracted_data_json, photo_path) VALUES (?, ?, ?, ?, ?)`,
        rec.id, rec.date, rec.type,
        JSON.stringify({ title: rec.title, center: rec.center, status: rec.status, results: rec.results, notes: rec.notes }),
        null,
      );
    }
    for (const eq of seedEquipment) {
      await db.runAsync(
        `INSERT OR IGNORE INTO gym_equipment (id, name, target_muscles, usage_instructions, photo_path) VALUES (?, ?, ?, ?, ?)`,
        eq.id, eq.name, JSON.stringify(eq.targetMuscles), JSON.stringify(eq.usageSteps), null,
      );
    }
    for (const day of seedWorkoutPlan) {
      await db.runAsync(
        `INSERT OR IGNORE INTO workout_plans (id, day_of_week, exercises_json) VALUES (?, ?, ?)`,
        `wp-${day.dayOfWeek}`, day.dayOfWeek, JSON.stringify(day.exercises),
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
  meds: Medication[];
  todayIntakes: MedIntake[];
  sleepWeek: SleepEntry[];
  equipment: GymEquipment[];
  workoutPlan: WorkoutDay[];
  emergencyCard: EmergencyCard | null;
  settings: AppSettings | null;
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
  const medRows = await db.getAllAsync<any>('SELECT * FROM medication_logs ORDER BY active DESC, name');
  const intakeRows = await db.getAllAsync<any>('SELECT * FROM med_intake_logs WHERE date = ? ORDER BY ts', date);
  const sleepRows = await db.getAllAsync<any>('SELECT * FROM sleep_logs ORDER BY date DESC LIMIT 7');
  const equipmentRows = await db.getAllAsync<any>('SELECT * FROM gym_equipment ORDER BY name');
  const planRows = await db.getAllAsync<any>('SELECT * FROM workout_plans ORDER BY day_of_week');
  const emergencyRow = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM app_meta WHERE key = 'emergency_card'`,
  );
  const settingsRow = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM app_meta WHERE key = 'app_settings'`,
  );

  return {
    meds: medRows.map(mapMed),
    todayIntakes: intakeRows.map((r) => ({ id: r.id, medId: r.med_id, medName: r.med_name, date: r.date, at: r.at })),
    sleepWeek: sleepRows.map(mapSleep),
    equipment: equipmentRows.map((r) => ({
      id: r.id,
      name: r.name,
      targetMuscles: JSON.parse(r.target_muscles ?? '[]'),
      usageSteps: JSON.parse(r.usage_instructions ?? '[]'),
      photoUri: r.photo_path ?? undefined,
    })),
    workoutPlan: planRows.map((r) => ({ dayOfWeek: r.day_of_week, exercises: JSON.parse(r.exercises_json ?? '[]') })),
    emergencyCard: emergencyRow ? JSON.parse(emergencyRow.value) : null,
    settings: settingsRow ? JSON.parse(settingsRow.value) : null,
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

// ─────────────────────────────────────────────────────────────────────────────
// Sleep
// ─────────────────────────────────────────────────────────────────────────────

function mapSleep(r: any): SleepEntry {
  return {
    id: r.id,
    date: r.date,
    hours: r.hours ?? 0,
    quality: r.quality_score ?? null,
    lastCoffeeTime: r.last_coffee_time ?? undefined,
    lastCigaretteTime: r.last_cigarette_time ?? undefined,
    source: r.source === 'health' ? 'health' : 'manual',
  };
}

export function upsertSleep(entry: SleepEntry): void {
  persist((db) =>
    db.runAsync(
      `INSERT INTO sleep_logs (id, date, hours, quality_score, last_coffee_time, last_cigarette_time, source)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         hours = excluded.hours, quality_score = excluded.quality_score,
         last_coffee_time = excluded.last_coffee_time,
         last_cigarette_time = excluded.last_cigarette_time, source = excluded.source`,
      entry.id, entry.date, entry.hours, entry.quality, entry.lastCoffeeTime ?? null,
      entry.lastCigaretteTime ?? null, entry.source,
    ),
  );
}

export async function getSleepLastDays(days = 7): Promise<SleepEntry[]> {
  if (!isNative) return [];
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM sleep_logs ORDER BY date DESC LIMIT ?', days,
  );
  return rows.map(mapSleep);
}

// ─────────────────────────────────────────────────────────────────────────────
// Medications + intakes
// ─────────────────────────────────────────────────────────────────────────────

function mapMed(r: any): Medication {
  const [dosage, timing] = String(r.dosage ?? '').split('|');
  return {
    id: r.id,
    name: r.name,
    dosage: dosage || undefined,
    kind: r.type === 'مكمل' ? 'مكمل' : 'دواء',
    timing: timing || undefined,
    startDate: r.start_date ?? undefined,
    endDate: r.end_date ?? undefined,
    active: !!r.active,
    note: undefined,
  };
}

export function upsertMedication(m: Medication): void {
  persist((db) =>
    db.runAsync(
      `INSERT INTO medication_logs (id, name, dosage, type, start_date, end_date, active, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'manual')
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name, dosage = excluded.dosage, type = excluded.type,
         start_date = excluded.start_date, end_date = excluded.end_date, active = excluded.active`,
      m.id, m.name, [m.dosage ?? '', m.timing ?? ''].join('|'), m.kind,
      m.startDate ?? null, m.endDate ?? null, m.active ? 1 : 0,
    ),
  );
}

export async function listMedications(): Promise<Medication[]> {
  if (!isNative) return [];
  const db = await getDb();
  const rows = await db.getAllAsync<any>('SELECT * FROM medication_logs ORDER BY active DESC, name');
  return rows.map(mapMed);
}

export function insertMedIntake(intake: MedIntake): void {
  persist((db) =>
    db.runAsync(
      `INSERT INTO med_intake_logs (id, med_id, med_name, ts, date, at) VALUES (?, ?, ?, ?, ?, ?)`,
      intake.id, intake.medId, intake.medName, Date.now(), intake.date, intake.at,
    ),
  );
}

export async function getIntakesForDate(date: string): Promise<MedIntake[]> {
  if (!isNative) return [];
  const db = await getDb();
  const rows = await db.getAllAsync<any>('SELECT * FROM med_intake_logs WHERE date = ? ORDER BY ts', date);
  return rows.map((r) => ({ id: r.id, medId: r.med_id, medName: r.med_name, date: r.date, at: r.at }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Medical records
// ─────────────────────────────────────────────────────────────────────────────

function mapRecord(r: any): MedicalRecord {
  const extra = r.extracted_data_json ? JSON.parse(r.extracted_data_json) : {};
  return {
    id: r.id,
    date: r.date,
    type: r.type,
    title: extra.title ?? r.type,
    center: extra.center ?? undefined,
    status: extra.status === 'تحتاج انتباه' ? 'تحتاج انتباه' : 'طبيعي',
    results: extra.results ?? undefined,
    notes: extra.notes ?? undefined,
    photoUri: r.photo_path ?? undefined,
  };
}

export function upsertMedicalRecord(rec: MedicalRecord): void {
  const extra = JSON.stringify({
    title: rec.title, center: rec.center, status: rec.status,
    results: rec.results, notes: rec.notes,
  });
  persist((db) =>
    db.runAsync(
      `INSERT INTO medical_records (id, date, type, extracted_data_json, photo_path)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         date = excluded.date, type = excluded.type,
         extracted_data_json = excluded.extracted_data_json, photo_path = excluded.photo_path`,
      rec.id, rec.date, rec.type, extra, rec.photoUri ?? null,
    ),
  );
}

export async function listMedicalRecords(filter?: {
  sinceDate?: string;
  type?: MedicalRecordType;
  needsAttention?: boolean;
}): Promise<MedicalRecord[]> {
  if (!isNative) return [];
  const db = await getDb();
  const where: string[] = [];
  const params: any[] = [];
  if (filter?.sinceDate) { where.push('date >= ?'); params.push(filter.sinceDate); }
  if (filter?.type) { where.push('type = ?'); params.push(filter.type); }
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM medical_records ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY date DESC`,
    ...params,
  );
  let records = rows.map(mapRecord);
  if (filter?.needsAttention !== undefined) {
    records = records.filter((r) => (r.status === 'تحتاج انتباه') === filter.needsAttention);
  }
  return records;
}

// ─────────────────────────────────────────────────────────────────────────────
// Gym equipment + workout plan
// ─────────────────────────────────────────────────────────────────────────────

export function upsertEquipment(eq: GymEquipment): void {
  persist((db) =>
    db.runAsync(
      `INSERT INTO gym_equipment (id, name, target_muscles, usage_instructions, photo_path)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name, target_muscles = excluded.target_muscles,
         usage_instructions = excluded.usage_instructions, photo_path = excluded.photo_path`,
      eq.id, eq.name, JSON.stringify(eq.targetMuscles), JSON.stringify(eq.usageSteps), eq.photoUri ?? null,
    ),
  );
}

export async function listEquipment(): Promise<GymEquipment[]> {
  if (!isNative) return [];
  const db = await getDb();
  const rows = await db.getAllAsync<any>('SELECT * FROM gym_equipment ORDER BY name');
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    targetMuscles: JSON.parse(r.target_muscles ?? '[]'),
    usageSteps: JSON.parse(r.usage_instructions ?? '[]'),
    photoUri: r.photo_path ?? undefined,
  }));
}

export function upsertWorkoutDay(day: WorkoutDay): void {
  persist((db) =>
    db.runAsync(
      `INSERT INTO workout_plans (id, day_of_week, exercises_json) VALUES (?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET exercises_json = excluded.exercises_json`,
      `wp-${day.dayOfWeek}`, day.dayOfWeek, JSON.stringify(day.exercises),
    ),
  );
}

export async function getWorkoutPlan(): Promise<WorkoutDay[]> {
  if (!isNative) return [];
  const db = await getDb();
  const rows = await db.getAllAsync<any>('SELECT * FROM workout_plans ORDER BY day_of_week');
  return rows.map((r) => ({ dayOfWeek: r.day_of_week, exercises: JSON.parse(r.exercises_json ?? '[]') }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Calendar day summaries
// ─────────────────────────────────────────────────────────────────────────────

/** Aggregate per-day stats for a month ('YYYY-MM'). Keyed by date. */
export async function getMonthSummaries(monthPrefix: string, kcalTarget: number): Promise<Record<string, DaySummary>> {
  if (!isNative) return {};
  const db = await getDb();
  const like = `${monthPrefix}%`;
  const meals = await db.getAllAsync<any>(
    'SELECT date, SUM(total_calories) AS kcal FROM meal_logs WHERE date LIKE ? GROUP BY date', like,
  );
  const water = await db.getAllAsync<any>(
    'SELECT date, SUM(amount_ml) AS ml FROM water_logs WHERE date LIKE ? GROUP BY date', like,
  );
  const moods = await db.getAllAsync<any>(
    'SELECT date, AVG(score) AS score FROM mood_logs WHERE date LIKE ? GROUP BY date', like,
  );
  const sleeps = await db.getAllAsync<any>(
    'SELECT date, hours FROM sleep_logs WHERE date LIKE ?', like,
  );
  const intakes = await db.getAllAsync<any>(
    'SELECT * FROM med_intake_logs WHERE date LIKE ? ORDER BY ts', like,
  );

  const out: Record<string, DaySummary> = {};
  const ensure = (date: string): DaySummary =>
    (out[date] ??= {
      date, status: 'empty', kcal: 0, kcalTarget, waterMl: 0, mood: null, sleepHours: null, medsTaken: [],
    });

  for (const m of meals) ensure(m.date).kcal = Math.round(m.kcal ?? 0);
  for (const w of water) ensure(w.date).waterMl = Math.round(w.ml ?? 0);
  for (const mo of moods) ensure(mo.date).mood = Math.round((mo.score ?? 0) * 10) / 10;
  for (const s of sleeps) ensure(s.date).sleepHours = s.hours ?? null;
  for (const i of intakes) ensure(i.date).medsTaken.push({ id: i.id, medId: i.med_id, medName: i.med_name, date: i.date, at: i.at });

  for (const d of Object.values(out)) {
    const signals = [
      d.kcal > 0 && d.kcal <= d.kcalTarget * 1.05,
      d.waterMl >= 2000,
      (d.mood ?? 0) >= 4,
      (d.sleepHours ?? 0) >= 6.5,
    ].filter(Boolean).length;
    const hasData = d.kcal > 0 || d.waterMl > 0 || d.mood !== null || d.sleepHours !== null || d.medsTaken.length > 0;
    d.status = !hasData ? 'empty' : signals >= 2 ? 'good' : 'mid';
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings / emergency card (app_meta JSON blobs)
// ─────────────────────────────────────────────────────────────────────────────

async function getMeta<T>(key: string): Promise<T | null> {
  if (!isNative) return null;
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', key);
  return row ? (JSON.parse(row.value) as T) : null;
}

function setMeta(key: string, value: unknown): void {
  persist((db) =>
    db.runAsync(
      `INSERT INTO app_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      key, JSON.stringify(value),
    ),
  );
}

export const getEmergencyCard = () => getMeta<EmergencyCard>('emergency_card');
export const saveEmergencyCard = (c: EmergencyCard) => setMeta('emergency_card', c);
export const getSettings = () => getMeta<AppSettings>('app_settings');
export const saveSettings = (s: AppSettings) => setMeta('app_settings', s);

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
