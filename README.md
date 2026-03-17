# CSEVID Timetable

A mobile timetable app for **CSE 6th Semester Section D** students, built with Expo React Native. Shows your current and next lecture in real-time, the full day schedule, the weekly timetable, and lets you edit every slot — including scanning a photo of your PDF timetable using AI.

---

## Features

- **Live lecture tracking** — pulsing dot and progress bar on the ongoing lecture; auto-detects current and next class
- **Today's schedule** — full day view with past/current/future visual states
- **Weekly timetable** — day-tab picker with color-coded period cards
- **Full in-app editing** — tap any period to change subject, code, teacher, venue, and color
- **AI timetable scan** — photograph or screenshot your timetable PDF; Gemini Vision parses it automatically
- **Next-lecture intelligence** — when today's classes are over, shows the correct next day's first lecture (not Monday blindly)
- **Offline-first** — all data stored locally with AsyncStorage, no account or internet required for normal use
- **iOS 26 liquid glass** — native tab bar with liquid glass effect on iOS 26+; blurred tab bar on older iOS

---

## Screens

| Tab | Description |
|-----|-------------|
| **Home** | Real-time current lecture card with live progress bar, next lecture card, today's full timeline |
| **Timetable** | Day-tab weekly view; swipe between Mon–Sat to see all periods |
| **Manage** | Tap-to-edit any period; Scan button to import via AI; Reset to defaults |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 54 + Expo Router (file-based routing) |
| Language | TypeScript |
| UI | React Native + StyleSheet |
| Animations | react-native-reanimated |
| State | React Context + AsyncStorage |
| Fonts | Poppins via @expo-google-fonts |
| Icons | @expo/vector-icons (Ionicons) |
| AI Scan | Google Gemini 2.0 Flash Vision API |
| Tab bar (iOS 26+) | expo-router/unstable-native-tabs + expo-glass-effect |
| Tab bar (others) | expo-router Tabs + expo-blur |

---

## Project Structure

```
app/
  _layout.tsx          Root layout — font loading, SplashScreen, providers
  (tabs)/
    _layout.tsx        Tab bar configuration (NativeTabs or classic Tabs)
    index.tsx          Home screen
    timetable.tsx      Weekly timetable screen
    settings.tsx       Manage / edit screen

components/
  ErrorBoundary.tsx    App-level crash boundary
  ScanModal.tsx        AI timetable scan modal (Gemini Vision)

constants/
  colors.ts            Deep navy theme tokens + subject color palette

context/
  TimetableContext.tsx Full timetable state, AsyncStorage, real-time lecture logic

server/
  index.ts             Minimal Express server (landing page only)
  templates/
    landing-page.html  Static landing page served at port 5000
```

---

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

---

## Default Subjects (6th Semester)

| Code | Subject | Teacher |
|------|---------|---------|
| CS601 | Machine Learning | NR |
| CS602 | Computer Networks | IAK |
| CS603 | Compiler Design | SV |
| CS604 | Project Management | PM/PK |
| CS605 | Data Analytics Lab | VC |
| CS608 | MP-II Lab | MR |
| CRT | Campus Recruitment Training | AP/VA |
| SD | Skill Development | MR |

> All subjects are editable. Tap any period card in the Manage tab to update.

---

## AI Timetable Scan

The Scan feature lets you import a timetable from a photo without typing anything manually.

**Setup (one time):**
1. Go to **Manage** tab → tap **Scan**
2. Get a free API key from [aistudio.google.com](https://aistudio.google.com)
3. Paste the key — it is stored only on your device

**Usage:**
1. Tap **Scan** → choose Camera or Gallery
2. Photo or screenshot of your timetable grid
3. Review the detected lectures
4. Tap **Apply** — done

Works best with clear, well-lit photos or PDF screenshots.

---

## Running Locally

```bash
# Install dependencies
npm install

# Start the Expo dev server
npm run expo:dev

# Start the Express backend (landing page)
npm run server:dev
```

Scan the QR code in the Expo Go app on your phone, or press `w` to open the web preview.

---

## Development Notes

- Do not use `toLocaleDateString` / `toLocaleTimeString` with locale strings like `en-IN` — many Android devices don't have regional locales installed and will throw at runtime. Use manual formatters instead.
- Avoid `position: "absolute"` with `height: "100%"` / `top: "50%"` inside flex containers — causes layout crashes in React Native's New Architecture.
- Always guard `colorIndex` reads with `?? 0` since AsyncStorage values may have missing fields.
- `useBottomTabBarHeight()` is incompatible with NativeTabs — use `useSafeAreaInsets()` and add explicit bottom padding instead.
- UUID generation: do not use the `uuid` package (requires `crypto.getRandomValues` which crashes on iOS/Android). Use `Date.now().toString() + Math.random().toString(36).substr(2, 9)` instead.
