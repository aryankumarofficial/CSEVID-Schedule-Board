# CSEVID Timetable App

## Overview
A mobile timetable app for CSEVID (CSE 6th Semester Section D) students. Shows the current and next lecture in real-time, today's full schedule, the complete weekly timetable, and allows full editing of any lecture slot. Includes AI-powered timetable scanning from photos.

## Architecture
- **Framework**: Expo SDK 54 (React Native) with Expo Router file-based routing
- **State**: React Context + AsyncStorage (all timetable data stored locally on device)
- **Fonts**: Poppins (Google Fonts via @expo-google-fonts/poppins)
- **Backend**: Minimal Express server (serves landing page only — not used by the mobile app)
- **AI Scan**: Google Gemini 2.0 Flash Vision API called directly from the client (no backend relay)

## Key Files
- `context/TimetableContext.tsx` — All timetable data, default CSEVID schedule, AsyncStorage persistence, real-time current/next lecture logic
- `app/(tabs)/index.tsx` — Home screen: live ongoing lecture card with progress bar, next lecture, today's day plan
- `app/(tabs)/timetable.tsx` — Weekly timetable with day-tab picker (Mon–Sat), period cards with teacher/venue
- `app/(tabs)/settings.tsx` — Manage screen: tap-to-edit any period, Scan button, Reset to defaults
- `app/(tabs)/_layout.tsx` — Tab navigation: NativeTabs with liquid glass on iOS 26+, Ionicons-based classic Tabs elsewhere
- `components/ScanModal.tsx` — Full AI scan flow: API key setup, image picker, Gemini Vision call, preview, apply
- `constants/colors.ts` — Deep navy blue theme (#0A1628) with electric blue accents and 8 subject colors

## Design
- Deep navy blue color scheme (#0A1628) inspired by educational/productivity apps
- 3-tab navigation: Home, Timetable, Manage
- NativeTabs with liquid glass on iOS 26+; blurred classic Tabs on older iOS; Ionicons on Android/Web
- Cards with subject color coding (8 distinct colors auto-assigned by subject code hash)
- Real-time clock refreshes every 30s, live animated progress bar for ongoing lecture
- Animated screen entry with react-native-reanimated (FadeIn, FadeInDown, spring)

## Time Slots
| Period | Time |
|--------|------|
| P1 | 10:00 – 10:50 |
| P2 | 10:50 – 11:40 |
| P3 | 11:40 – 12:30 |
| P4 | 12:30 – 13:20 |
| Lunch | 13:20 – 14:00 |
| P5 | 14:00 – 14:50 |
| P6 | 14:50 – 15:40 |
| P7 | 15:40 – 16:40 |

## Subjects (6th Semester)
- CS601: Machine Learning (NR)
- CS602: Computer Networks (IAK)
- CS603: Compiler Design (SV)
- CS604: Project Management (PM/PK)
- CS605: Data Analytics Lab (VC)
- CS608: MP-II Lab (MR)
- CRT: Campus Recruitment Training (AP/VA)
- SD: Skill Development (MR)

## Workflows
- **Start Frontend**: `npm run expo:dev` — Expo dev server on port 8081 (HMR enabled)
- **Start Backend**: `npm run server:dev` — Express server on port 5000 (landing page only)

## Critical Android / New Architecture Rules
- NEVER use `toLocaleDateString` / `toLocaleTimeString` with locale strings like `en-IN` — throws on Android devices without that locale. Use manual date/time formatters.
- NEVER use `position: "absolute"` with `height: "100%"` or `top: "50%"` inside flex containers — causes layout engine crashes in the New Architecture.
- ALWAYS guard `colorIndex` reads with `?? 0` — AsyncStorage-restored objects may have missing fields.
- Do NOT use `useBottomTabBarHeight()` with NativeTabs — it throws. Use `useSafeAreaInsets()` and add explicit `paddingBottom` to ScrollView content.
- Do NOT use the `uuid` package — use `Date.now().toString() + Math.random().toString(36).substr(2, 9)` instead.
- Always use `!!value` or explicit truthiness checks before rendering conditional content.

## AI Scan Feature
- Users tap Scan in the Manage tab, enter a free Gemini API key (stored in AsyncStorage), pick a photo or screenshot of their timetable
- Image is base64-encoded and sent directly to `gemini-2.0-flash` via `https://generativelanguage.googleapis.com/v1beta/...`
- Gemini returns structured JSON; the app previews detected lectures before applying them via `updateLecture(day, period, lecture)`
- Colors are auto-assigned using a hash of the subject code

## Next-Lecture Logic
- Searches today's remaining periods for the next upcoming lecture
- If all today's periods have passed, searches forward from tomorrow (using `DAYS.indexOf(today) + 1` with modulo wrap) — NOT from Monday
- Sunday returns no current/next lecture
