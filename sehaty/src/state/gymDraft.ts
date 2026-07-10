/**
 * In-flight gym-equipment analysis handed from /gym/analyzing to /gym/result.
 * Module-level holder (same role draftMeal plays in the store for the meal
 * flow) — kept outside store.tsx so the gym flow stays self-contained.
 */
import type { GymEquipment } from '@/data/types';

export type GymDraft = Omit<GymEquipment, 'id'>;

let draft: GymDraft | null = null;

export function setGymDraft(d: GymDraft | null): void {
  draft = d;
}

export function getGymDraft(): GymDraft | null {
  return draft;
}
