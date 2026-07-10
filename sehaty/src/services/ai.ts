/**
 * AI service seam. Everything the app asks of the model goes through here.
 *
 * Live mode: talks to the sehaty-proxy on the VPS (see /proxy in the repo) —
 * the proxy holds the real MiniMax key; the app only knows the proxy URL and
 * a shared token. Configure via:
 *
 *   EXPO_PUBLIC_AI_BASE_URL=https://ai.yourdomain.com
 *   EXPO_PUBLIC_AI_TOKEN=<APP_TOKEN from the proxy .env>
 *
 * Without those (or if a live call fails — offline, proxy down) every
 * function falls back to the deterministic design-accurate mocks, so the
 * app keeps working end-to-end.
 */
import type { FoodItem, MealType } from '@/data/types';
import { buildContextCard } from '@/db';

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

/** Non-meal actions the model may extract from a chat turn (build prompt §6). */
export type ChatAction =
  | { type: 'water_log'; amount_ml: number }
  | { type: 'mood_log'; score: number; note?: string }
  | { type: 'sleep_log'; hours: number }
  | { type: 'weight_log'; weight_kg: number }
  | { type: 'medication_log'; name: string; dosage?: string; med_type?: string };

export interface AssistantReply {
  text: string;
  meal?: MealAnalysis;
  /** Extracted non-meal actions for the screen to dispatch to the store. */
  actions?: ChatAction[];
}

export const aiConfig = {
  baseUrl: process.env.EXPO_PUBLIC_AI_BASE_URL,
  token: process.env.EXPO_PUBLIC_AI_TOKEN,
};

const isLive = () => Boolean(aiConfig.baseUrl && aiConfig.token);

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

let seq = 0;
const genId = (p: string) => `${p}-${Date.now()}-${seq++}`;

// ─────────────────────────────────────────────────────────────────────────────
// Proxy transport
// ─────────────────────────────────────────────────────────────────────────────

async function callProxy<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const context_card = await buildContextCard().catch(() => null);
  const res = await fetch(`${aiConfig.baseUrl!.replace(/\/+$/, '')}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${aiConfig.token}`,
    },
    body: JSON.stringify({ ...body, context_card }),
  });
  if (!res.ok) throw new Error(`proxy ${path} → HTTP ${res.status}`);
  return (await res.json()) as T;
}

/** Read a local image (file:// or content://) as base64 for the vision endpoints. */
async function imageToBase64(uri: string): Promise<string | null> {
  if (!/^(file|content):/.test(uri)) return null; // mock/placeholder URIs
  const FileSystem = await import('expo-file-system/legacy');
  return FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
}

// Wire shapes returned by the proxy (see proxy/lib/prompts.js contracts).
interface ProxyMeal {
  meal_type?: string;
  items?: { name: string; emoji?: string; grams?: number; kcal?: number; flagged?: boolean }[];
  total_calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  note?: string | null;
}
interface ProxyChat {
  actions: ({ type: string } & Record<string, unknown>)[];
  chat_reply: string;
}

const MEAL_TYPES: MealType[] = ['فطار', 'غدا', 'عشا', 'سناك'];

function mapProxyMeal(m: ProxyMeal, fallbackType: MealType): MealAnalysis {
  const items: FoodItem[] = (m.items ?? []).map((i) => ({
    id: genId('f'),
    name: i.name,
    emoji: i.emoji ?? '🍽',
    grams: i.grams,
    kcal: Math.round(i.kcal ?? 0),
    flagged: i.flagged || undefined,
  }));
  return {
    mealType: MEAL_TYPES.includes(m.meal_type as MealType) ? (m.meal_type as MealType) : fallbackType,
    items,
    kcal: Math.round(m.total_calories ?? items.reduce((s, i) => s + i.kcal, 0)),
    protein: Math.round(m.protein_g ?? 0),
    carb: Math.round(m.carbs_g ?? 0),
    fat: Math.round(m.fat_g ?? 0),
    note: m.note ?? undefined,
  };
}

function splitActions(raw: ProxyChat['actions']): { meal?: MealAnalysis; rest: ChatAction[] } {
  let meal: MealAnalysis | undefined;
  const rest: ChatAction[] = [];
  for (const a of raw ?? []) {
    if (a.type === 'meal_log' && !meal) meal = mapProxyMeal(a as ProxyMeal, 'غدا');
    else if (['water_log', 'mood_log', 'sleep_log', 'weight_log', 'medication_log'].includes(a.type)) {
      rest.push(a as unknown as ChatAction);
    }
  }
  return { meal, rest };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API used by the screens
// ─────────────────────────────────────────────────────────────────────────────

/** Analyze a free-text meal description ("نص فرخة مشوية مع رز وسلطة..."). */
export async function analyzeMealText(text: string, mealType: MealType = 'غدا'): Promise<MealAnalysis> {
  if (isLive()) {
    try {
      const out = await callProxy<ProxyChat>('/api/ai/chat', {
        message: `سجّل الوجبة دي (${mealType}): ${text}`,
      });
      const { meal } = splitActions(out.actions);
      if (meal) return meal;
    } catch (e) {
      console.warn('[ai] live meal-text failed, using mock:', e);
    }
  }
  return mockMealText(text, mealType);
}

/** Analyze a meal photo via the proxy's vision endpoint. */
export async function analyzeMealImage(uri: string, mealType: MealType = 'غدا'): Promise<MealAnalysis> {
  if (isLive()) {
    try {
      const image_base64 = await imageToBase64(uri);
      if (image_base64) {
        const out = await callProxy<ProxyMeal>('/api/ai/vision/meal', { image_base64 });
        return mapProxyMeal(out, mealType);
      }
    } catch (e) {
      console.warn('[ai] live meal-image failed, using mock:', e);
    }
  }
  await wait(1800);
  const items: FoodItem[] = [
    { id: genId('f'), name: 'رز أبيض', emoji: '🍚', grams: 180, kcal: 234 },
    { id: genId('f'), name: 'فراخ مشوية', emoji: '🍗', grams: 150, kcal: 248 },
    { id: genId('f'), name: 'سلطة خضرا', emoji: '🥗', grams: 120, kcal: 48 },
  ];
  return { mealType, items, kcal: items.reduce((s, i) => s + i.kcal, 0), protein: 42, carb: 58, fat: 14 };
}

/**
 * Chat turn. `history` is the recent visible transcript (mapped to
 * {role, content}); `imageUri` is attached to the request when it's a real
 * local file.
 */
export async function sendChat(
  userText: string,
  hasImage = false,
  history: { role: 'user' | 'assistant'; content: string }[] = [],
  imageUri?: string,
): Promise<AssistantReply> {
  if (isLive()) {
    try {
      const image_base64 = hasImage && imageUri ? await imageToBase64(imageUri) : null;
      const out = await callProxy<ProxyChat>('/api/ai/chat', {
        message: userText,
        history,
        ...(image_base64 ? { image_base64 } : {}),
      });
      const { meal, rest } = splitActions(out.actions);
      return { text: out.chat_reply, meal, actions: rest };
    } catch (e) {
      console.warn('[ai] live chat failed, using mock:', e);
    }
  }

  await wait(900);
  const looksLikeMeal = /(اكل|أكل|فرخة|فراخ|رز|سلطة|عصير|بيتزا|وجبة|فطار|غدا|عشا)/.test(userText) || hasImage;
  if (looksLikeMeal) {
    const meal = await mockMealText(userText || 'وجبة من صورة', 'غدا');
    return { text: 'تمام، سجّلتلك الوجبة 👇', meal };
  }
  return { text: 'تمام، خد بالك تشرب مياه كفاية النهاردة وتنام بدري.' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic mocks (offline / unconfigured fallback)
// ─────────────────────────────────────────────────────────────────────────────

async function mockMealText(text: string, mealType: MealType): Promise<MealAnalysis> {
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

  const kcal = items.reduce((s, i) => s + i.kcal, 0);
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
