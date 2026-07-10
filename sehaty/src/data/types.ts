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
