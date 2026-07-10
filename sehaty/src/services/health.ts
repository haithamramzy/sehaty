/**
 * Google Health (Health Connect) seam.
 *
 * The app is designed to pull steps + sleep from Android's Health Connect.
 * Shipping that needs the native module `react-native-health-connect` plus
 * the HEALTH_CONNECT permissions in app.json — both land in the "ربط
 * Google Health" phase. Until then this module is the single place the UI
 * talks to, so wiring the real thing later touches nothing else:
 *
 *   1. npx expo install react-native-health-connect
 *   2. app.json → android.permissions: ["android.permission.health.READ_STEPS",
 *      "android.permission.health.READ_SLEEP"]
 *   3. Replace the bodies below with real client calls (initialize(),
 *      requestPermission(), readRecords('Steps'|'SleepSession', …)).
 *
 * Everything returns the design's sample values when not connected, so all
 * screens keep working end-to-end.
 */

export interface HealthSnapshot {
  stepsToday: number;
  stepsTarget: number;
  /** Hours slept last night, if the platform recorded it. */
  sleepHoursLastNight: number | null;
  connected: boolean;
}

/** Whether Health Connect is available on this device (Android 14+ built-in). */
export async function isHealthAvailable(): Promise<boolean> {
  // Real impl: getSdkStatus() === SdkAvailabilityStatus.SDK_AVAILABLE
  return false;
}

/** Ask the user to grant steps + sleep read permissions. */
export async function connectHealth(): Promise<boolean> {
  // Real impl: initialize() + requestPermission([...]) — returns granted set.
  return false;
}

/** Today's numbers. Falls back to the design's sample data when unlinked. */
export async function readHealthSnapshot(): Promise<HealthSnapshot> {
  // Real impl: readRecords('Steps', {timeRangeFilter: today}) etc.
  return {
    stepsToday: 4120,
    stepsTarget: 8000,
    sleepHoursLastNight: null,
    connected: false,
  };
}
