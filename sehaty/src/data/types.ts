/** Shared domain types for the صحّتي daily loop. */

export type MealType = 'فطار' | 'غدا' | 'عشا' | 'سناك';

export type MacroKind = 'protein' | 'carb' | 'fat';

/** A single food item detected/entered within a meal. */
export interface FoodItem {
  id: string;
  name: string;
  emoji: string;
  grams?: number;
  kcal: number;
  /** true when the AI flags it (e.g. high-sugar drink) — rendered in warning color. */
  flagged?: boolean;
}

export interface Meal {
  id: string;
  type: MealType;
  items: FoodItem[];
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
  loggedAt: string; // "13:20"
  source: 'photo' | 'text' | 'chat';
}

export interface WaterEntry {
  id: string;
  ml: number;
  emoji: string;
  loggedAt: string;
}

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export interface UserProfile {
  name: string;
  age: number;
  sex: 'ذكر' | 'أنثى';
  heightCm: number;
  weightKg: number;
  activity: string;
  goals: string[];
  calorieTarget: number;
  waterTargetMl: number;
  sleepTargetHours: number;
}

/** A chat turn. `card` renders the inline "تم التسجيل" confirmation. */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  imageUri?: string | 'placeholder';
  card?: Meal;
}

// ─── Sleep ───────────────────────────────────────────────────────────────────

export interface SleepEntry {
  id: string;
  date: string; // YYYY-MM-DD (the morning after the night)
  hours: number;
  /** 1–5, same scale as mood. */
  quality: number | null;
  lastCoffeeTime?: string; // "20:30"
  lastCigaretteTime?: string;
  source: 'manual' | 'health';
}

// ─── Medications ─────────────────────────────────────────────────────────────

export type MedicationKind = 'دواء' | 'مكمل';

export interface Medication {
  id: string;
  name: string;
  /** Free-text dose, e.g. "1000 وحدة" */
  dosage?: string;
  kind: MedicationKind;
  /** Display timing, e.g. "مع الغدا · 14:00" */
  timing?: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
  note?: string;
}

/** One confirmed intake ("أكدت الجرعة"). */
export interface MedIntake {
  id: string;
  medId: string;
  medName: string;
  date: string;
  at: string; // "14:05"
}

// ─── Medical records ─────────────────────────────────────────────────────────

export type MedicalRecordType = 'تحليل دم' | 'أشعة' | 'روشتة' | 'زيارة دكتور' | 'فحص دوري';
export type MedicalRecordStatus = 'طبيعي' | 'تحتاج انتباه';

export interface LabResult {
  name: string;
  value: string;
  normalRange: string;
  flag?: 'مرتفع طفيف' | 'مرتفع' | 'منخفض';
}

export interface MedicalRecord {
  id: string;
  date: string;
  type: MedicalRecordType;
  title: string;
  center?: string;
  status: MedicalRecordStatus;
  results?: LabResult[];
  notes?: string;
  photoUri?: string;
}

// ─── Gym ─────────────────────────────────────────────────────────────────────

export interface GymEquipment {
  id: string;
  name: string;
  targetMuscles: string[];
  usageSteps: string[];
  photoUri?: string;
}

export interface WorkoutExercise {
  name: string;
  sets?: number;
  reps?: string; // "12-15"
  equipmentId?: string;
}

export interface WorkoutDay {
  /** 0 = الأحد … 6 = السبت (JS getDay()). */
  dayOfWeek: number;
  exercises: WorkoutExercise[];
}

// ─── Calendar / day summaries ────────────────────────────────────────────────

export type DayStatus = 'good' | 'mid' | 'empty';

export interface DaySummary {
  date: string;
  status: DayStatus;
  kcal: number;
  kcalTarget: number;
  waterMl: number;
  mood: number | null;
  sleepHours: number | null;
  medsTaken: MedIntake[];
}

// ─── Settings / emergency ────────────────────────────────────────────────────

export interface EmergencyCard {
  fullName: string;
  bloodType: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  allergies: string[];
  currentMeds: string[];
}

export interface AppSettings {
  notificationsEnabled: boolean;
  medRemindersEnabled: boolean;
  /** Google Health / Health Connect link state. */
  healthConnected: boolean;
}
