/**
 * Lightweight in-memory app store (React context) that wires the daily loop:
 * logging a meal / water / mood updates the Home dashboard live.
 * No persistence yet — swap this provider's internals for AsyncStorage later.
 */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { defaultProfile, seedChat, seedMeals, seedWater } from '@/data/mock';
import type { ChatMessage, Meal, MoodLevel, UserProfile, WaterEntry } from '@/data/types';
import type { MealAnalysis } from '@/services/ai';

let idCounter = 1000;
const nextId = () => `id-${++idCounter}`;

interface AppState {
  profile: UserProfile;
  onboarded: boolean;
  meals: Meal[];
  water: WaterEntry[];
  mood: MoodLevel | null;
  chat: ChatMessage[];
  /** In-flight meal analysis handed from the analyzing screen to the result screen. */
  draftMeal: MealAnalysis | null;
  // derived
  caloriesConsumed: number;
  waterConsumedMl: number;
  // actions
  completeOnboarding: (patch: Partial<UserProfile>) => void;
  addMeal: (meal: Omit<Meal, 'id'>) => void;
  addWater: (ml: number, emoji: string) => void;
  setMood: (mood: MoodLevel) => void;
  addChatMessage: (msg: Omit<ChatMessage, 'id'>) => void;
  setDraftMeal: (draft: MealAnalysis | null) => void;
}

const AppContext = createContext<AppState | null>(null);

function nowHHMM(): string {
  // Fixed clock keeps the design's 9:41 vibe deterministic across the demo.
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [onboarded, setOnboarded] = useState(false);
  const [meals, setMeals] = useState<Meal[]>(seedMeals);
  const [water, setWater] = useState<WaterEntry[]>(seedWater);
  const [mood, setMoodState] = useState<MoodLevel | null>(4);
  const [chat, setChat] = useState<ChatMessage[]>(seedChat);
  const [draftMeal, setDraftMeal] = useState<MealAnalysis | null>(null);

  const completeOnboarding = useCallback((patch: Partial<UserProfile>) => {
    setProfile((p) => ({ ...p, ...patch }));
    setOnboarded(true);
  }, []);

  const addMeal = useCallback((meal: Omit<Meal, 'id'>) => {
    setMeals((prev) => [{ ...meal, id: nextId() }, ...prev]);
  }, []);

  const addWater = useCallback((ml: number, emoji: string) => {
    setWater((prev) => [{ id: nextId(), ml, emoji, loggedAt: nowHHMM() }, ...prev]);
  }, []);

  const setMood = useCallback((m: MoodLevel) => setMoodState(m), []);

  const addChatMessage = useCallback((msg: Omit<ChatMessage, 'id'>) => {
    setChat((prev) => [...prev, { ...msg, id: nextId() }]);
  }, []);

  const caloriesConsumed = useMemo(
    () => meals.reduce((sum, m) => sum + m.kcal, 0),
    [meals],
  );
  const waterConsumedMl = useMemo(
    () => water.reduce((sum, w) => sum + w.ml, 0),
    [water],
  );

  const value = useMemo<AppState>(
    () => ({
      profile,
      onboarded,
      meals,
      water,
      mood,
      chat,
      draftMeal,
      caloriesConsumed,
      waterConsumedMl,
      completeOnboarding,
      addMeal,
      addWater,
      setMood,
      addChatMessage,
      setDraftMeal,
    }),
    [
      profile, onboarded, meals, water, mood, chat, draftMeal, caloriesConsumed, waterConsumedMl,
      completeOnboarding, addMeal, addWater, setMood, addChatMessage,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within <AppProvider>');
  return ctx;
}
