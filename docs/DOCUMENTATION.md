## DailySync — Short Product & Dev Guide

Keep this doc as the single handoff file. Export to PDF/Word as needed.

### 1) What this app does

- **Purpose**: Schedule and send reminders/messages; location-aware workflows; rich previews.
- **Core**: Add reminders with time/date/frequency, contacts, files, audio; view history; quick actions; notifications.

### 2) Tech stack

- **Expo/React Native**: `expo 53`, `react-native 0.79`, `react 19`.
- **Navigation**: `@react-navigation/*`.
- **Storage**: `expo-sqlite`, `react-native-mmkv`.
- **Location/Map**: `expo-location`, `@maplibre/maplibre-react-native`.
- **UI & Animations**: `@gorhom/bottom-sheet`, `react-native-reanimated`, `lottie-react-native`.
- **Notifications**: `@notifee/react-native`.
- **Custom native module**: workspace `send-message`.

### 3) Project structure (high‑level)

- Root app code in `app/`
  - `Components/` reusable UI (bottom sheets, modals, lists)
  - `Constants/` theme, assets paths, static configs
  - `Contexts/` providers (theme, bottom sheet)
  - `Hooks/` domain hooks (permissions, location, notifications, forms)
  - `Routes/` navigation setup (tabs, stack, root)
  - `Screens/` features (AddReminder, Home, History, Setting, OnBoarding, Preview, Notification, LocationDetails)
  - `Services/` background/location services
  - `Types/` shared types
  - `Utils/` helpers (validation, formatters, db utils)
- Workspace `send-message/` contains the custom native module (Android/iOS/Web glue and example)

### 4) Setup (dev)

1. Install toolchain: Node 18+, Yarn 4 (Berry), Android Studio/Xcode as needed.
2. Install deps: `yarn`.
3. Copy env: `cp docs/ENV.example .env` and adjust.
4. Start: `yarn start`. Run platform: `yarn android` / `yarn ios` / `yarn web`.

### 5) Scripts (package.json)

- `yarn start`: Expo dev client with cache reset
- `yarn android` / `yarn ios` / `yarn web`
- `yarn lint` / `yarn format`
- `yarn test` / `yarn test:coverage`
- `yarn setup:env` (optional helper)

### 6) TypeScript & aliases

- Strict TS enabled (`tsconfig.json`).
- Aliases (baseUrl `app`): `@Components/*`, `@Constants/*`, `@Contexts/*`, `@Hooks/*`, `@Routes/*`, `@Screens/*`, `@Services/*`, `@Types/*`, `@Utils/*`.

### 7) Navigation

- Bottom tabs + native stack.
- Entry points in `app/Routes/BottomTab.tsx`, `app/Routes/Routes.tsx`, `app/Routes/RootNavigation.ts`.

### 8) Theming

- Theme config in `app/Constants/Theme.ts`.
- Provider in `app/Contexts/ThemeProvider.tsx`.

### 9) Data & state

- Persistent local data: `expo-sqlite` for structured storage; `mmkv` for fast key/value.
- Helpers: `app/Utils/databaseUtils.ts` and related utils.

### 10) Permissions

- Android in `app.json` → `expo.android.permissions`.
- iOS strings in `app.json` → `expo.ios.infoPlist`.
- Hooks: `useLocationPermission`, `useContactPermission`, `useNotificationPermission`.

### 11) Location & maps

- Hooks: `useLiveLocation`, `useAddressFromCoords`, `useLocationService`, `useLocationNotification`.
- Styles: `app/Constants/satellite-style.json`, `streets-v2-style.json`.
- **LocationService** (`app/Services/LocationService.ts`):
  - **Dynamic radius**: Uses `getStoredLocationRadius()` from `SettingsProvider` for user-configurable geofence radius (default: 100m).
  - **Tracking modes**: Attempts background tracking (works when app is closed) first, falls back to foreground tracking (app must be open) if background permissions unavailable.
  - **Immediate proximity check**: When a reminder is added, immediately checks if user is already inside the radius and triggers notification if so.
  - **Restore flow**: On app launch, calls `startRestore()` → `restoreReminder()` for each persisted reminder → `finishRestore()` which checks proximity for all active reminders.
  - **Key functions**: `addReminder()`, `removeReminder()`, `startTracking()`, `stopTracking()`, `getCurrentLocation()`, `getActiveRemindersCount()`.

### 12) Notifications

- Notifee for local notifications.
- Helpers: `app/Utils/notificationHelpers.ts`, `prepareNotificationData.ts`, `getNotificationTitle*.ts`.

### 13) Add Reminder flow

- Screen: `app/Screens/AddReminder/AddReminder.tsx`.
- Subcomponents in `app/Screens/AddReminder/Components/` (contacts, schedule, attachments, audio, etc.).
- Hooks in `app/Screens/AddReminder/hooks/` (form, recorder, date/time, document picker, schedule).

### 14) Custom native module: send-message

- Workspace: `send-message/` (Android Kotlin, iOS Swift, web shim).
- Public API: `send-message/src/index.ts`.
- Example usage in `send-message/example/`.

Small API details:

- `sendMail(recipients: string, subject: string, body: string, attachmentPaths: string)`
- `sendSms(numbers: string[], message: string, firstAttachment?: string)`
- `isAppInstalled(packageId: string): Promise<boolean>`
- `sendWhatsapp(numbers: string, message: string, attachmentPaths: string, audioPaths: string, isWhatsapp: boolean)`
- `sendTelegramMessage(username: string, message: string)`

### 15) Assets & splash

- Quick actions and icons configured via `expo-quick-actions` plugin in `app.json`.
- Boot splash via `react-native-bootsplash` with assets in `assets/bootsplash`.

### 16) Build & release (quick)

- Android debug: `yarn android`
- iOS debug: `yarn ios`
- Recommended: Expo EAS for signed builds and OTA. Add `eas.json`, then:
  - `eas build -p android` / `eas build -p ios`
  - OTA: `eas update`

### 17) Testing & quality

- Tests: Jest + Testing Library.
- Lint/format: ESLint 9 + Prettier 3 (`yarn lint`, `yarn format`).
- Husky/commitlint configured.

### 18) Environment variables

- Add variables in `.env` and load where needed (types in `app/Types/env.d.ts`).
- Example file: `docs/ENV.example`.

### 19) Permissions matrix (Android)

- INTERNET, RECORD_AUDIO, READ/WRITE_EXTERNAL_STORAGE, VIBRATE, SYSTEM_ALERT_WINDOW, ACCESS_FINE/COARSE/BACKGROUND_LOCATION.

### 20) How to change things (buyer quick guide)

- **Branding**: App name/slug/bundle in `app.json`. Icons/splash in `assets/`.
- **Colors/Theme**: `app/Constants/Theme.ts`.
- **Tabs & Routes**: `app/Routes/BottomTab.tsx`, `app/Routes/Routes.tsx`.
- **Strings**: `app/Constants/TextString.ts`.
- **Feature UI**: screens under `app/Screens/*`.
- **Map style**: replace `streets-v2-style.json` / `satellite-style.json`.
- **Notifications**: adjust in `app/Utils/*notification*` and related hooks.
- **Native module**: edit `send-message/` and bump its version.

### 21) Troubleshooting quick list

- Clear cache: `yarn start --reset-cache`.
- Android build fails: check SDK 36 in `app.json` buildProperties, reinstall pods/gradle.
- Permissions denied: verify hooks and `app.json` entries.
- Map not rendering: check MapLibre token/style URLs if used.

### 22) Legal/metadata

- Package id: `com.taskwave.dailysync` (Android).
- Versioning policy: follows `expo.runtimeVersion.policy: appVersion`.

### 23) Contacts & handoff

- Include your support email/URL here.

— End —

### A) Reminder functions (small details)

- `prepareNotificationData(notification)` in `app/Utils/prepareNotificationData.ts`:
  - Normalizes for SQL and notifications: escapes strings, JSON-serializes arrays, ensures ISO date, builds `toMailArray`.
- `updateToNextDate(notification)` in `app/Hooks/updateToNextDate.ts`:
  - Moves `date` to next Daily/Weekly/Monthly/Yearly occurrence; parses `days` for weekly.
- Notifee helpers in `app/Utils/notificationHelpers.ts`:
  - `createNotificationChannelIfNeeded()` creates channels per sound.
  - `buildTimestampTrigger(date, scheduleFrequency)` returns TIMESTAMP trigger with repeat.
  - `buildNotifeeNotification(notification, channelId)` builds platform payload (big picture if image).

### B) Screens — what they do

- `OnBoarding/Index.tsx`: first-time intro, permissions tips.
- `Home/Home.tsx`: dashboard; filter, header, quick access.
- `AddReminder/AddReminder.tsx`: create reminder; contacts, date/time, message, subject, files, audio, schedule.
  - Components: contact picker, schedule frequency, document/audio pickers, etc.
- `AddReminder/ReminderScheduled.tsx`: success/confirmation after scheduling.
- `History/History.tsx`: past and upcoming reminders; filter and list rendering.
- `Preview/ReminderPreview.tsx`: preview a reminder before saving/sending.
- `Preview/LocationPreview.tsx`: preview geofence/location selection.
- `LocationDetails/LocationDetails.tsx`: map view, address, radius; helper components.
- `Notification/Notification.tsx`: notification settings/overview.
- `Setting/Setting.tsx`: app settings; `NotificationSound`, `HowAppWorks`, `AboutApp`.
