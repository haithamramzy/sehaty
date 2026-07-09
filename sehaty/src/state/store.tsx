/**
 * App store (React context) wiring the daily loop: logging a meal / water /
 * mood updates the Home dashboard live.
 *
 * Persistence: hydrates once from SQLite at launch (see src/db), then
 * write-throughs every mutation. In-memory state stays the source of truth
 * for rendering; the DB makes it survive restarts. On web the DB layer
 * no-ops and the store runs on the design's seed data, as before.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';

import * as db from '@/db';
import { defaultProfile, seedChat, seedMeals, seedWater } from '@/data/mock';
import type { ChatMessage, Meal, MoodLevel, UserProfile, WaterEntry } from '@/data/types';
import type { MealAnalysis } from '@/services/ai';

let idCounter = 1000;
const nextId = () => `id-${Date.now().toString(36)}-${++idCounter}`;

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
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [onboarded, setOnboarded] = useState(false);
  const [meals, setMeals] = useState<Meal[]>(seedMeals);
  const [water, setWater] = useState<WaterEntry[]>(seedWater);
  const [mood, setMoodState] = useState<MoodLevel | null>(4);
  const [chat, setChat] = useState<ChatMessage[]>(seedChat);
  const [draftMeal, setDraftMeal] = useState<MealAnalysis | null>(null);

  useEffect(() => {
    let cancelled = false;
    db.loadSnapshot()
      .then((snap) => {
        if (cancelled || !snap) return;
        if (snap.profile) setProfile(snap.profile);
        setOnboarded(snap.onboarded);
        setMeals(snap.meals);
        setWater(snap.water);
        setMoodState(snap.mood);
        setChat(snap.chat);
      })
      .catch((e) => console.warn('[db] hydrate failed, running in-memory:', e))
      .finally(() => {
        if (!cancelled) setHydrated(true);
        SplashScreen.hideAsync().catch(() => {});
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const completeOnboarding = useCallback((patch: Partial<UserProfile>) => {
    setProfile((p) => {
      const next = { ...p, ...patch };
      db.saveProfile(next, true);
      return next;
    });
    setOnboarded(true);
  }, []);

  const addMeal = useCallback((meal: Omit<Meal, 'id'>) => {
    const full: Meal = { ...meal, id: nextId() };
    db.insertMeal(full);
    setMeals((prev) => [full, ...prev]);
  }, []);

  const addWater = useCallback((ml: number, emoji: string) => {
    const entry: WaterEntry = { id: nextId(), ml, emoji, loggedAt: nowHHMM() };
    db.insertWater(entry);
    setWater((prev) => [entry, ...prev]);
  }, []);

  const setMood = useCallback((m: MoodLevel) => {
    db.insertMood(nextId(), m);
    setMoodState(m);
  }, []);

  const addChatMessage = useCallback((msg: Omit<ChatMessage, 'id'>) => {
    const full: ChatMessage = { ...msg, id: nextId() };
    db.insertChatMessage(full);
    setChat((prev) => [...prev, full]);
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

  // Hold first paint until the DB snapshot lands so the index redirect sees
  // the persisted `onboarded` flag instead of flashing onboarding.
  if (!hydrated) return null;

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within <AppProvider>');
  return ctx;
}
