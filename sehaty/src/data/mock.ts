/**
 * Realistic sample data lifted from the design (هيثم's day, 9 يوليو).
 * Used to seed the in-memory store so every screen shows real-looking content.
 */
import type { ChatMessage, Meal, UserProfile, WaterEntry } from './types';

export const defaultProfile: UserProfile = {
  name: 'هيثم',
  age: 29,
  sex: 'ذكر',
  heightCm: 178,
  weightKg: 82,
  activity: 'مكتبي + جيم',
  goals: ['تنشيف', 'تحسين النوم'],
  calorieTarget: 2600,
  waterTargetMl: 2500,
  sleepTargetHours: 6.5,
};

export const seedWater: WaterEntry[] = [
  { id: 'w1', ml: 500, emoji: '💧', loggedAt: '09:10' },
  { id: 'w2', ml: 250, emoji: '🥃', loggedAt: '11:45' },
  { id: 'w3', ml: 500, emoji: '💧', loggedAt: '13:20' },
  { id: 'w4', ml: 350, emoji: '💧', loggedAt: '14:30' },
];

export const seedMeals: Meal[] = [
  {
    id: 'm1',
    type: 'غدا',
    source: 'photo',
    loggedAt: '13:40',
    kcal: 530,
    protein: 42,
    carb: 58,
    fat: 14,
    items: [
      { id: 'i1', name: 'رز أبيض', emoji: '🍚', grams: 180, kcal: 234 },
      { id: 'i2', name: 'فراخ مشوية', emoji: '🍗', grams: 150, kcal: 248 },
      { id: 'i3', name: 'سلطة خضرا', emoji: '🥗', grams: 120, kcal: 48 },
    ],
  },
];

/** Quick-add water presets shown on the water screen. */
export const waterPresets = [
  { id: 'cup', label: 'كوب', ml: 250, emoji: '🥃' },
  { id: 'big', label: 'كوباية كبيرة', ml: 400, emoji: '🍶' },
  { id: 'bottle', label: 'زجاجة كاملة', ml: 500, emoji: '💧' },
];

/** Suggestions surfaced under the manual meal textarea. */
export const mealSuggestions = [
  { emoji: '🥗', label: 'سلطة قيصر' },
  { emoji: '🍕', label: 'بيتزا مارجريتا' },
  { emoji: '🥚', label: 'عجّة' },
];

export const seedChat: ChatMessage[] = [
  { id: 'c1', role: 'assistant', text: 'صباح الخير هيثم. عملت إيه في الغدا اليوم؟' },
  { id: 'c2', role: 'user', imageUri: 'placeholder', text: 'هي دي وجبة الغدا' },
  {
    id: 'c3',
    role: 'user',
    text: 'أكلت نص فرخة مشوية مع رز وسلطة، وحوالي كوباية عصير',
  },
  {
    id: 'c4',
    role: 'assistant',
    text: 'تمام، سجّلتلك الوجبة 👇',
    card: {
      id: 'm-chat',
      type: 'غدا',
      source: 'chat',
      loggedAt: '13:42',
      kcal: 720,
      protein: 52,
      carb: 70,
      fat: 20,
      items: [
        { id: 'ci1', name: 'نص فرخة', emoji: '🍗', kcal: 280 },
        { id: 'ci2', name: 'رز أبيض', emoji: '🍚', kcal: 220 },
        { id: 'ci3', name: 'سلطة', emoji: '🥗', kcal: 40 },
        { id: 'ci4', name: 'عصير مانجو', emoji: '🥤', kcal: 180, flagged: true },
      ],
    },
  },
  {
    id: 'c5',
    role: 'assistant',
    text: 'العصير حسبته سعرات إضافية عالية. لو ممكن استبدله بمياه في الوجبة الجاية.',
  },
];

/** Static content for the weekly reports screen. */
export const weeklyReport = {
  range: '3 – 9 يوليو',
  summaryHighlights: { onTargetDays: 5, sleepDeficitMin: 45 },
  kpis: [
    { key: 'cal', label: 'متوسط السعرات', value: '2,340', color: '#CEFD82', path: 'M0,22 L15,18 L30,20 L45,10 L60,14 L75,6 L100,10' },
    { key: 'sleep', label: 'متوسط النوم', value: '5:45', trend: '↓', color: '#B8A6FF', path: 'M0,10 L15,14 L30,8 L45,16 L60,20 L75,14 L100,18' },
    { key: 'water', label: 'مياه', value: '2.1', unit: ' L/يوم', color: '#7DD3FC', path: 'M0,18 L15,14 L30,10 L45,14 L60,8 L75,10 L100,6' },
    { key: 'mood', label: 'مزاج', value: '7.2', emoji: '😊', color: '#CEFD82', path: 'M0,16 L15,12 L30,8 L45,10 L60,14 L75,8 L100,6' },
  ],
  weight: { current: '81.4', delta: '↓ 0.6', target: '78', path: 'M0,20 L45,22 L90,18 L135,25 L180,20 L225,28 L280,32 L310,38' },
  recommendation: {
    title: 'نم قبل الساعة 12 بالليل',
    body: 'لو حققت ده 5 أيام هيتحسن مزاجك ووزنك تلقائيًا.',
  },
};

export const onboardingGoals = [
  { emoji: '🔥', label: 'تنشيف' },
  { emoji: '💪', label: 'بناء كتلة' },
  { emoji: '⬆️', label: 'زيادة الوزن' },
  { emoji: '😴', label: 'تحسين النوم' },
  { emoji: '⚖️', label: 'ثبات الوزن' },
  { emoji: '🚭', label: 'تقليل التدخين' },
  { emoji: '🧠', label: 'صحة نفسية' },
];

export const activityLevels = [
  { emoji: '💻', title: 'مكتبي', sub: 'جالس أغلب اليوم' },
  { emoji: '🚶', title: 'مكتبي + جيم', sub: '3-5 مرات أسبوعيًا' },
  { emoji: '🏃', title: 'نشط', sub: 'تمرين يومي' },
  { emoji: '🏗', title: 'شغل بدني', sub: 'جسمي طول اليوم' },
];
