# صحّتي — Personal Health OS

A dark-mode, RTL Arabic **personal health app** built in Expo / React Native, implemented
from the Claude Design handoff (`../project/صحتي.dc.html`). This is a single-user advisor
app: log meals, water, sleep, mood and get AI coaching grounded in your own data.

> Scope of this build: the **core daily loop**, wired end-to-end — Onboarding → Home
> dashboard → quick-log (FAB) → meal logging (photo / write / analyze / result) → water →
> AI chat → weekly reports. The remaining designed screens (medical records, meds, workout
> plan, calendar/compare, PDF export, settings) are intentionally not built yet.

## Stack

- **Expo SDK 57**, React Native 0.86, TypeScript
- **Expo Router** (file-based navigation, `src/app`)
- **react-native-svg** — progress rings, line charts, mood faces, icons
- **expo-linear-gradient** + **expo-blur** — gradients and the glassmorphic tab bar
- **@expo-google-fonts** — Cairo (Arabic), Inter (Latin), JetBrains Mono (numbers)
- RTL forced app-wide via `I18nManager`

## Running it

```bash
cd sehaty
npm install
npx expo start        # then press "a" for Android, or scan the QR with Expo Go
# or: npm run android
```

Build a real APK with EAS: `npx eas build -p android --profile preview`.

Typecheck / bundle checks used during development:

```bash
npx tsc --noEmit
npx expo export --platform android --output-dir /tmp/sehaty-export   # validates the whole module graph
```

## Project structure

```
src/
  app/                     # Expo Router routes
    _layout.tsx            # fonts, RTL, dark theme, root stack + AppProvider
    index.tsx              # first-run → onboarding, else → tabs
    onboarding/            # welcome · basic-info · activity · goals
    (tabs)/                # index (home) · chat · reports  (+ custom TabBar/FAB)
    meal/                  # method · camera · write · analyzing · result
    water.tsx  mood.tsx  quick-log.tsx
  components/              # reusable library (see below)
  theme/tokens.ts          # design tokens ported 1:1 from the design
  state/store.tsx          # in-memory app store (the daily loop shares state here)
  data/                    # domain types + realistic seed data from the design
  services/                # ai.ts, camera.ts  ← the "wire real AI later" seams
```

### Component library (`src/components`)

`Txt`, `Icon`, `Card`, `Button` (primary / secondary / ai), `ProgressRing`, `LineChart`,
`AiInsight`, `Sheet`, `Screen`, `TopBar`/`IconButton`, `TabBar`, `MockPlate`,
`OnboardScaffold` — matching the design's documented component set.

## Design tokens

`src/theme/tokens.ts` is the single source of truth (colors, radii, spacing, fonts,
shadows). The color-distribution rule from the brief is honored: ~72% dark background,
~16% text, ~8% primary green (`#CEFD82` = "your data"), ~4% purple (`#6D4AFF` = "the AI").

## AI + camera seams (plugging in a real backend later)

Screens never call a model or the camera directly — they go through:

- **`src/services/ai.ts`** — `analyzeMealText`, `analyzeMealImage`, `sendChat`. Today these
  are deterministic mocks returning design-accurate data. Populate `aiConfig`
  (`EXPO_PUBLIC_AI_ENDPOINT` / `EXPO_PUBLIC_AI_KEY` / `EXPO_PUBLIC_AI_MODEL`) and implement
  `callModel()` against Claude (Anthropic Messages API) or MiniMax — the screens don't change.
- **`src/services/camera.ts`** — `captureImage(source)`. Mock returns a placeholder; swap in
  `expo-image-picker` / `expo-camera` and the meal + chat flows keep working.

## State & persistence

`src/state/store.tsx` is an in-memory React context. Logging a meal / water / mood updates
the Home dashboard live. There is **no persistence yet** — replace the provider internals
with AsyncStorage (or SQLite) to make data survive restarts.

## Notes

- The `index.tsx` entry routes to onboarding on first run; completing onboarding flips an
  in-memory flag and lands on the tabs. (With persistence added, gate this on stored state.)
- `EXPO_PUBLIC_*` names are intentional: Expo only inlines env vars with that prefix into the
  client bundle. Keep truly secret keys behind your own proxy rather than shipping them.
