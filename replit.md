# CSEVID Timetable App

## Overview
A mobile timetable app for CSEVID (CSE 6th Semester Section D) students. Shows the current and next lecture in real-time, today's full schedule, the complete weekly timetable, and allows full editing of any lecture slot.

## Architecture
- **Framework**: Expo (React Native) with Expo Router file-based routing
- **State**: React Context + AsyncStorage (no backend needed for timetable data)
- **Fonts**: Poppins (Google Fonts via @expo-google-fonts/poppins)
- **Backend**: Minimal Express server (serves landing page only)

## Key Files
- `context/TimetableContext.tsx` — All timetable data, default CSEVID schedule, AsyncStorage persistence
- `app/(tabs)/index.tsx` — Home screen: ongoing lecture, next lecture with progress bar, today's day plan
- `app/(tabs)/timetable.tsx` — Full weekly timetable, day-by-day view
- `app/(tabs)/settings.tsx` — Editable timetable: tap any period to edit subject, teacher, venue, color
- `constants/colors.ts` — Deep navy blue theme with electric blue accents

## Design
- Deep navy blue color scheme (#0A1628) inspired by educational/productivity apps
- 3-tab navigation: Home, Timetable, Manage (NativeTabs with liquid glass on iOS 26+)
- Cards with subject color coding (8 distinct colors)
- Real-time clock that refreshes every 30s, live progress bar for ongoing lecture
- Animated entry screens with react-native-reanimated

## Time Slots
| Period | Time |
|--------|------|
| 1 | 10:00 – 10:50 |
| 2 | 10:50 – 11:40 |
| 3 | 11:40 – 12:30 |
| 4 | 12:30 – 13:20 |
| Lunch | 13:20 – 14:00 |
| 5 | 14:00 – 14:50 |
| 6 | 14:50 – 15:40 |
| 7 | 15:40 – 16:40 |

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
- **Start Frontend**: `npm run expo:dev` — Expo dev server on port 8081
- **Start Backend**: `npm run server:dev` — Express server on port 5000

## Notes
- Timetable is pre-populated with CSEVID schedule (editable in-app)
- All data stored in AsyncStorage (device local storage)
- The PDF only showed CSEVIA, CSEVIB, and partial CSEVIC — CSEVID data is modelled from these patterns
