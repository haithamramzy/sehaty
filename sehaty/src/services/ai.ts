/**
 * AI service seam. Everything the app asks of "Claude/MiniMax" goes through here.
 *
 * Right now these are deterministic MOCKS that return design-accurate data.
 * To wire a real backend later, implement `callModel()` against your provider
 * (Anthropic Claude Messages API, or MiniMax) and delete the mock branches —
 * the screen code never changes because it only depends on the exported shapes.
 */
import type { FoodItem, MealType } from '@/data/types';

export interface MealAnalysis {
  mealType: MealType;
  items: FoodItem[];
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
  /** Short, single-sentence coaching note in the app's voice. */
  note?: string;
}

export interface AiConfig {
  /** e.g. 'https://api.anthropic.com/v1/messages' or a MiniMax endpoint. */
  endpoint?: string;
  apiKey?: string;
  model?: string;
}

/** Populate from env / secure store when a real backend is connected. */
export const aiConfig: AiConfig = {
  endpoint: process.env.EXPO_PUBLIC_AI_ENDPOINT,
  apiKey: process.env.EXPO_PUBLIC_AI_KEY,
  model: process.env.EXPO_PUBLIC_AI_MODEL ?? 'claude-sonnet-5',
};

const isLive = () => Boolean(aiConfig.endpoint && aiConfig.apiKey);

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

let seq = 0;
const genId = (p: string) => `${p}-${Date.now()}-${seq++}`;

function sum(items: FoodItem[]): Pick<MealAnalysis, 'kcal'> {
  return { kcal: items.reduce((s, i) => s + i.kcal, 0) };
}

/**
 * Analyze a free-text meal description ("نص فرخة مشوية مع رز وسلطة...").
 * Mock: matches a few common Arabic foods; falls back to a generic estimate.
 */
export async function analyzeMealText(text: string, mealType: MealType = 'غدا'): Promise<MealAnalysis> {
  if (isLive()) return callModel({ kind: 'meal-text', text, mealType });
  await wait(1400);

  const t = text.toLowerCase();
  const items: FoodItem[] = [];
  const match = (kw: string[], item: Omit<FoodItem, 'id'>) => {
    if (kw.some((k) => t.includes(k))) items.push({ ...item, id: genId('f') });
  };
  match(['فرخة', 'فراخ', 'دجاج'], { name: 'فراخ مشوية', emoji: '🍗', grams: 150, kcal: 248 });
  match(['رز', 'أرز'], { name: 'رز أبيض', emoji: '🍚', grams: 180, kcal: 234 });
  match(['سلطة', 'خضرا'], { name: 'سلطة خضرا', emoji: '🥗', grams: 120, kcal: 48 });
  match(['عصير', 'مانجو'], { name: 'عصير مانجو', emoji: '🥤', kcal: 180, flagged: true });
  match(['بيتزا'], { name: 'بيتزا', emoji: '🍕', grams: 200, kcal: 540 });
  match(['بيض', 'عجّة', 'عجه'], { name: 'بيض', emoji: '🥚', grams: 100, kcal: 155 });

  if (items.length === 0) {
    items.push({ id: genId('f'), name: 'وجبة مختلطة', emoji: '🍽', kcal: 450 });
  }

  const kcal = sum(items).kcal;
  const flaggedNote = items.some((i) => i.flagged)
    ? 'فيه صنف عالي السعرات — فكّر تقلّله في الوجبة الجاية.'
    : undefined;

  return {
    mealType,
    items,
    kcal,
    protein: Math.round(kcal * 0.32 / 4),
    carb: Math.round(kcal * 0.44 / 4),
    fat: Math.round(kcal * 0.24 / 9),
    note: flaggedNote,
  };
}

/** Analyze a meal photo. Mock returns the design's 3-item plate. */
export async function analyzeMealImage(_uri: string, mealType: MealType = 'غدا'): Promise<MealAnalysis> {
  if (isLive()) return callModel({ kind: 'meal-image', uri: _uri, mealType });
  await wait(1800);
  const items: FoodItem[] = [
    { id: genId('f'), name: 'رز أبيض', emoji: '🍚', grams: 180, kcal: 234 },
    { id: genId('f'), name: 'فراخ مشوية', emoji: '🍗', grams: 150, kcal: 248 },
    { id: genId('f'), name: 'سلطة خضرا', emoji: '🥗', grams: 120, kcal: 48 },
  ];
  const kcal = sum(items).kcal;
  return { mealType, items, kcal, protein: 42, carb: 58, fat: 14 };
}

export interface AssistantReply {
  text: string;
  meal?: MealAnalysis;
}

/** Chat turn. Mock detects a meal description and returns an inline logged card. */
export async function sendChat(userText: string, hasImage = false): Promise<AssistantReply> {
  if (isLive()) return callModel({ kind: 'chat', text: userText, hasImage }) as Promise<AssistantReply>;
  await wait(900);

  const looksLikeMeal = /(اكل|أكل|فرخة|فراخ|رز|سلطة|عصير|بيتزا|وجبة|فطار|غدا|عشا)/.test(userText) || hasImage;
  if (looksLikeMeal) {
    const meal = await analyzeMealText(userText || 'وجبة من صورة');
    return { text: 'تمام، سجّلتلك الوجبة 👇', meal };
  }
  return { text: 'تمام، خد بالك تشرب مياه كفاية النهاردة وتنام بدري.' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Real backend entry point (unused until aiConfig is populated).
// ─────────────────────────────────────────────────────────────────────────────

type ModelRequest =
  | { kind: 'meal-text'; text: string; mealType: MealType }
  | { kind: 'meal-image'; uri: string; mealType: MealType }
  | { kind: 'chat'; text: string; hasImage: boolean };

/**
 * Single choke point for the live provider. Sketch of an Anthropic Claude call:
 *
 *   const res = await fetch(aiConfig.endpoint!, {
 *     method: 'POST',
 *     headers: {
 *       'content-type': 'application/json',
 *       'x-api-key': aiConfig.apiKey!,
 *       'anthropic-version': '2023-06-01',
 *     },
 *     body: JSON.stringify({ model: aiConfig.model, max_tokens: 1024, tools: [...], messages: [...] }),
 *   });
 *   // parse tool_use output into MealAnalysis / AssistantReply
 *
 * Kept as a throwing stub so mocks are used until credentials exist.
 */
async function callModel(_req: ModelRequest): Promise<never> {
  throw new Error('Live AI backend not configured. Populate aiConfig (EXPO_PUBLIC_AI_*).');
}
