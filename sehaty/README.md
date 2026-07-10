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
  state/store.tsx          # app store: hydrates from SQLite, write-through on mutations
  db/                      # SQLite layer: full 14-table schema + data access
  data/                    # domain types + realistic seed data from the design
  services/                # ai.ts (proxy client + mock fallback), camera.ts
```

### Component library (`src/components`)

`Txt`, `Icon`, `Card`, `Button` (primary / secondary / ai), `ProgressRing`, `LineChart`,
`AiInsight`, `Sheet`, `Screen`, `TopBar`/`IconButton`, `TabBar`, `MockPlate`,
`OnboardScaffold` — matching the design's documented component set.

## Design tokens

`src/theme/tokens.ts` is the single source of truth (colors, radii, spacing, fonts,
shadows). The color-distribution rule from the brief is honored: ~72% dark background,
~16% text, ~8% primary green (`#CEFD82` = "your data"), ~4% purple (`#6D4AFF` = "the AI").

## AI: the proxy client + mock fallback

Screens never call a model directly — they go through **`src/services/ai.ts`**
(`analyzeMealText`, `analyzeMealImage`, `sendChat`). It talks to the **sehaty-proxy**
(the `/proxy` project at the repo root, deployed on the VPS — that's where the real
MiniMax key lives). Configure the app with:

```
EXPO_PUBLIC_AI_BASE_URL=https://ai.yourdomain.com
EXPO_PUBLIC_AI_TOKEN=<APP_TOKEN from the proxy .env>
```

Unset — or on any live-call failure (offline, proxy down) — every function falls back
to deterministic design-accurate mocks, so the app always works. Each live request
carries a "context card" (latest weekly memory summary + last-7-days raw rows) built
by `src/db/buildContextCard()`.

**`src/services/camera.ts`** — `captureImage(source)` is still a mock returning a
placeholder; swap in `expo-image-picker` / `expo-camera` and the meal + chat flows
keep working (real `file://` URIs are already read as base64 for the vision endpoints).

## State & persistence

`src/state/store.tsx` hydrates once from SQLite at launch (`src/db`, via `expo-sqlite`)
and write-throughs every mutation; in-memory state stays the render source of truth.
The schema in `src/db/schema.ts` is the **full** build-prompt schema (14 tables) —
including tables whose screens come in later phases (medical, gym, workouts, travel,
weekly memory) — so future phases add queries, not migrations. Daily-loop reads are
scoped to today's local date; a first-run seed plants the design's demo day, which
naturally ages out at midnight. On web the DB layer no-ops and the app runs in-memory.

## Notes

- The `index.tsx` entry routes to onboarding on first run; completing onboarding persists
  the flag (`app_meta.onboarded`), so restarts land straight on the tabs.
- `EXPO_PUBLIC_*` names are intentional: Expo only inlines env vars with that prefix into the
  client bundle. Only the proxy URL + shared token ship in the app — never the MiniMax key.
