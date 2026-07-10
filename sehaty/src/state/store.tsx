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
import {
  defaultEmergencyCard, defaultProfile, defaultSettings, seedChat, seedEquipment, seedMeals,
  seedMeds, seedSleep, seedWater, seedWorkoutPlan,
} from '@/data/mock';
import type {
  AppSettings, ChatMessage, EmergencyCard, GymEquipment, Meal, MedIntake, Medication,
  MoodLevel, SleepEntry, UserProfile, WaterEntry, WorkoutDay,
} from '@/data/types';
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
  meds: Medication[];
  todayIntakes: MedIntake[];
  sleepWeek: SleepEntry[];
  equipment: GymEquipment[];
  workoutPlan: WorkoutDay[];
  emergencyCard: EmergencyCard;
  settings: AppSettings;
  // derived
  caloriesConsumed: number;
  waterConsumedMl: number;
  /** Last night's sleep entry (most recent), if any. */
  lastSleep: SleepEntry | null;
  // actions
  completeOnboarding: (patch: Partial<UserProfile>) => void;
  addMeal: (meal: Omit<Meal, 'id'>) => void;
  addWater: (ml: number, emoji: string) => void;
  setMood: (mood: MoodLevel) => void;
  addChatMessage: (msg: Omit<ChatMessage, 'id'>) => void;
  setDraftMeal: (draft: MealAnalysis | null) => void;
  addMedication: (med: Omit<Medication, 'id'>) => void;
  setMedActive: (id: string, active: boolean) => void;
  confirmDose: (med: Medication) => void;
  logSleep: (patch: Omit<SleepEntry, 'id' | 'date' | 'source'>) => void;
  addEquipment: (eq: Omit<GymEquipment, 'id'>) => GymEquipment;
  upsertWorkoutDay: (day: WorkoutDay) => void;
  saveEmergencyCard: (card: EmergencyCard) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
}

const AppContext = createContext<AppState | null>(null);

function nowHHMM(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function todayLocalDate(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
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
  const [meds, setMeds] = useState<Medication[]>(seedMeds);
  const [todayIntakes, setTodayIntakes] = useState<MedIntake[]>([]);
  const [sleepWeek, setSleepWeek] = useState<SleepEntry[]>(seedSleep);
  const [equipment, setEquipment] = useState<GymEquipment[]>(seedEquipment);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutDay[]>(seedWorkoutPlan);
  const [emergencyCard, setEmergencyCard] = useState<EmergencyCard>(defaultEmergencyCard);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

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
        if (snap.meds.length) setMeds(snap.meds);
        setTodayIntakes(snap.todayIntakes);
        if (snap.sleepWeek.length) setSleepWeek(snap.sleepWeek);
        if (snap.equipment.length) setEquipment(snap.equipment);
        if (snap.workoutPlan.length) setWorkoutPlan(snap.workoutPlan);
        if (snap.emergencyCard) setEmergencyCard(snap.emergencyCard);
        if (snap.settings) setSettings(snap.settings);
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

  const addMedication = useCallback((med: Omit<Medication, 'id'>) => {
    const full: Medication = { ...med, id: nextId() };
    db.upsertMedication(full);
    setMeds((prev) => [full, ...prev]);
  }, []);

  const setMedActive = useCallback((id: string, active: boolean) => {
    setMeds((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const next = { ...m, active, endDate: active ? undefined : todayLocalDate() };
        db.upsertMedication(next);
        return next;
      }),
    );
  }, []);

  const confirmDose = useCallback((med: Medication) => {
    const intake: MedIntake = {
      id: nextId(), medId: med.id, medName: med.name, date: todayLocalDate(), at: nowHHMM(),
    };
    db.insertMedIntake(intake);
    setTodayIntakes((prev) => [...prev, intake]);
  }, []);

  const logSleep = useCallback((patch: Omit<SleepEntry, 'id' | 'date' | 'source'>) => {
    const date = todayLocalDate();
    const entry: SleepEntry = { ...patch, id: `sl-${date}`, date, source: 'manual' };
    db.upsertSleep(entry);
    setSleepWeek((prev) => [entry, ...prev.filter((s) => s.date !== date)]);
  }, []);

  const addEquipment = useCallback((eq: Omit<GymEquipment, 'id'>) => {
    const full: GymEquipment = { ...eq, id: nextId() };
    db.upsertEquipment(full);
    setEquipment((prev) => [full, ...prev]);
    return full;
  }, []);

  const upsertWorkoutDay = useCallback((day: WorkoutDay) => {
    db.upsertWorkoutDay(day);
    setWorkoutPlan((prev) => {
      const rest = prev.filter((d) => d.dayOfWeek !== day.dayOfWeek);
      return [...rest, day].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    });
  }, []);

  const saveEmergencyCard = useCallback((card: EmergencyCard) => {
    db.saveEmergencyCard(card);
    setEmergencyCard(card);
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      db.saveSettings(next);
      return next;
    });
  }, []);

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfile((p) => {
      const next = { ...p, ...patch };
      db.saveProfile(next, true);
      return next;
    });
  }, []);

  const caloriesConsumed = useMemo(
    () => meals.reduce((sum, m) => sum + m.kcal, 0),
    [meals],
  );
  const lastSleep = useMemo(
    () => (sleepWeek.length ? [...sleepWeek].sort((a, b) => b.date.localeCompare(a.date))[0] : null),
    [sleepWeek],
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
      meds,
      todayIntakes,
      sleepWeek,
      equipment,
      workoutPlan,
      emergencyCard,
      settings,
      caloriesConsumed,
      waterConsumedMl,
      lastSleep,
      completeOnboarding,
      addMeal,
      addWater,
      setMood,
      addChatMessage,
      setDraftMeal,
      addMedication,
      setMedActive,
      confirmDose,
      logSleep,
      addEquipment,
      upsertWorkoutDay,
      saveEmergencyCard,
      updateSettings,
      updateProfile,
    }),
    [
      profile, onboarded, meals, water, mood, chat, draftMeal, caloriesConsumed, waterConsumedMl,
      meds, todayIntakes, sleepWeek, equipment, workoutPlan, emergencyCard, settings, lastSleep,
      completeOnboarding, addMeal, addWater, setMood, addChatMessage,
      addMedication, setMedActive, confirmDose, logSleep, addEquipment, upsertWorkoutDay,
      saveEmergencyCard, updateSettings, updateProfile,
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
