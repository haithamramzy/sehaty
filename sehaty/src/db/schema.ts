/**
 * SQLite schema — the full build-prompt schema, created up front even for
 * features whose screens aren't built yet (medical, gym, workouts, travel,
 * weekly memory), so later phases only add queries, never migrations-from-zero.
 *
 * JSON-ish columns are TEXT holding serialized JSON (items_json, goals_json…).
 * Dates: `date` columns are local 'YYYY-MM-DD'; `ts` columns are epoch millis.
 */

export const SCHEMA_VERSION = 1;

export const CREATE_TABLES: string[] = [
  `CREATE TABLE IF NOT EXISTS user_profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    height_cm REAL,
    weight_kg REAL,
    job_activity_level TEXT,
    smoker INTEGER DEFAULT 0,
    coffee_per_day INTEGER DEFAULT 0,
    goals_json TEXT DEFAULT '[]',
    chronic_conditions_json TEXT DEFAULT '[]',
    allergies_json TEXT DEFAULT '[]',
    calorie_target INTEGER,
    water_target_ml INTEGER,
    sleep_target_hours REAL
  )`,

  `CREATE TABLE IF NOT EXISTS daily_logs (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    weight_kg REAL,
    energy_level INTEGER,
    mood_score INTEGER
  )`,

  `CREATE TABLE IF NOT EXISTS meal_logs (
    id TEXT PRIMARY KEY,
    ts INTEGER NOT NULL,
    date TEXT NOT NULL,
    logged_at TEXT NOT NULL,
    meal_type TEXT NOT NULL,
    source TEXT NOT NULL,
    items_json TEXT NOT NULL DEFAULT '[]',
    total_calories INTEGER NOT NULL DEFAULT 0,
    protein_g REAL DEFAULT 0,
    carbs_g REAL DEFAULT 0,
    fat_g REAL DEFAULT 0,
    photo_path TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS water_logs (
    id TEXT PRIMARY KEY,
    ts INTEGER NOT NULL,
    date TEXT NOT NULL,
    logged_at TEXT NOT NULL,
    amount_ml INTEGER NOT NULL,
    emoji TEXT DEFAULT '💧'
  )`,

  `CREATE TABLE IF NOT EXISTS sleep_logs (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    hours REAL,
    quality_score INTEGER,
    last_coffee_time TEXT,
    last_cigarette_time TEXT,
    source TEXT NOT NULL DEFAULT 'manual'
  )`,

  `CREATE TABLE IF NOT EXISTS mood_logs (
    id TEXT PRIMARY KEY,
    ts INTEGER NOT NULL,
    date TEXT NOT NULL,
    score INTEGER NOT NULL,
    note TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS medication_logs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    dosage TEXT,
    type TEXT,
    start_date TEXT,
    end_date TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    source TEXT NOT NULL DEFAULT 'manual',
    photo_path TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS medical_records (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    type TEXT NOT NULL,
    extracted_data_json TEXT,
    photo_path TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS gym_equipment (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    target_muscles TEXT,
    usage_instructions TEXT,
    photo_path TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS workout_plans (
    id TEXT PRIMARY KEY,
    day_of_week INTEGER NOT NULL,
    exercises_json TEXT NOT NULL DEFAULT '[]'
  )`,

  `CREATE TABLE IF NOT EXISTS travel_logs (
    id TEXT PRIMARY KEY,
    ts INTEGER NOT NULL,
    note TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    ts INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT,
    attached_image_path TEXT,
    extracted_actions_json TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS weekly_memory_summary (
    id TEXT PRIMARY KEY,
    week_start_date TEXT NOT NULL UNIQUE,
    summary_json TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY,
    value TEXT
  )`,
];

export const CREATE_INDEXES: string[] = [
  `CREATE INDEX IF NOT EXISTS idx_meal_logs_date ON meal_logs(date)`,
  `CREATE INDEX IF NOT EXISTS idx_water_logs_date ON water_logs(date)`,
  `CREATE INDEX IF NOT EXISTS idx_mood_logs_date ON mood_logs(date)`,
  `CREATE INDEX IF NOT EXISTS idx_sleep_logs_date ON sleep_logs(date)`,
  `CREATE INDEX IF NOT EXISTS idx_chat_messages_ts ON chat_messages(ts)`,
  `CREATE INDEX IF NOT EXISTS idx_medical_records_date ON medical_records(date)`,
];
