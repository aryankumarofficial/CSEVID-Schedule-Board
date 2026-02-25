import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const TIME_SLOTS = [
  { period: 1, start: "10:00", end: "10:50", label: "Period 1" },
  { period: 2, start: "10:50", end: "11:40", label: "Period 2" },
  { period: 3, start: "11:40", end: "12:30", label: "Period 3" },
  { period: 4, start: "12:30", end: "13:20", label: "Period 4" },
  { period: -1, start: "13:20", end: "14:00", label: "Lunch Break" },
  { period: 5, start: "14:00", end: "14:50", label: "Period 5" },
  { period: 6, start: "14:50", end: "15:40", label: "Period 6" },
  { period: 7, start: "15:40", end: "16:40", label: "Period 7" },
];

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface Lecture {
  id: string;
  subject: string;
  subjectCode: string;
  teacher: string;
  venue: string;
  period: number;
  startTime: string;
  endTime: string;
  colorIndex: number;
}

export type DayTimetable = {
  [period: number]: Lecture | null;
};

export type FullTimetable = {
  [day: string]: DayTimetable;
};

const DEFAULT_TIMETABLE: FullTimetable = {
  Monday: {
    1: {
      id: "mon-1",
      subject: "Skill Development",
      subjectCode: "SD",
      teacher: "MR",
      venue: "HP LAB",
      period: 1,
      startTime: "10:00",
      endTime: "10:50",
      colorIndex: 4,
    },
    2: null,
    3: {
      id: "mon-3",
      subject: "Campus Recruitment Training",
      subjectCode: "CRT",
      teacher: "AP / VA",
      venue: "CSE Seminar Hall",
      period: 3,
      startTime: "11:40",
      endTime: "12:30",
      colorIndex: 5,
    },
    4: {
      id: "mon-4",
      subject: "Campus Recruitment Training",
      subjectCode: "CRT",
      teacher: "AP / VA",
      venue: "CSE Seminar Hall",
      period: 4,
      startTime: "12:30",
      endTime: "13:20",
      colorIndex: 5,
    },
    5: {
      id: "mon-5",
      subject: "Machine Learning",
      subjectCode: "CS601",
      teacher: "NR",
      venue: "Classroom",
      period: 5,
      startTime: "14:00",
      endTime: "14:50",
      colorIndex: 0,
    },
    6: {
      id: "mon-6",
      subject: "Project Management",
      subjectCode: "CS604",
      teacher: "PM / PK",
      venue: "Classroom",
      period: 6,
      startTime: "14:50",
      endTime: "15:40",
      colorIndex: 3,
    },
    7: {
      id: "mon-7",
      subject: "Compiler Design",
      subjectCode: "CS603",
      teacher: "SV",
      venue: "Classroom",
      period: 7,
      startTime: "15:40",
      endTime: "16:40",
      colorIndex: 2,
    },
  },
  Tuesday: {
    1: {
      id: "tue-1",
      subject: "Machine Learning",
      subjectCode: "CS601",
      teacher: "NR",
      venue: "Classroom",
      period: 1,
      startTime: "10:00",
      endTime: "10:50",
      colorIndex: 0,
    },
    2: {
      id: "tue-2",
      subject: "Computer Networks",
      subjectCode: "CS602",
      teacher: "IAK",
      venue: "Classroom",
      period: 2,
      startTime: "10:50",
      endTime: "11:40",
      colorIndex: 1,
    },
    3: {
      id: "tue-3",
      subject: "Campus Recruitment Training",
      subjectCode: "CRT",
      teacher: "AP / VA",
      venue: "CSE Seminar Hall",
      period: 3,
      startTime: "11:40",
      endTime: "12:30",
      colorIndex: 5,
    },
    4: {
      id: "tue-4",
      subject: "Campus Recruitment Training",
      subjectCode: "CRT",
      teacher: "AP / VA",
      venue: "CSE Seminar Hall",
      period: 4,
      startTime: "12:30",
      endTime: "13:20",
      colorIndex: 5,
    },
    5: {
      id: "tue-5",
      subject: "MP-II Lab",
      subjectCode: "CS608",
      teacher: "MR",
      venue: "HP LAB",
      period: 5,
      startTime: "14:00",
      endTime: "14:50",
      colorIndex: 6,
    },
    6: {
      id: "tue-6",
      subject: "MP-II Lab",
      subjectCode: "CS608",
      teacher: "MR",
      venue: "HP LAB",
      period: 6,
      startTime: "14:50",
      endTime: "15:40",
      colorIndex: 6,
    },
    7: null,
  },
  Wednesday: {
    1: {
      id: "wed-1",
      subject: "Skill Development",
      subjectCode: "SD",
      teacher: "MR",
      venue: "HP LAB",
      period: 1,
      startTime: "10:00",
      endTime: "10:50",
      colorIndex: 4,
    },
    2: null,
    3: {
      id: "wed-3",
      subject: "Campus Recruitment Training",
      subjectCode: "CRT",
      teacher: "AP / VA",
      venue: "CSE Seminar Hall",
      period: 3,
      startTime: "11:40",
      endTime: "12:30",
      colorIndex: 5,
    },
    4: {
      id: "wed-4",
      subject: "Campus Recruitment Training",
      subjectCode: "CRT",
      teacher: "AP / VA",
      venue: "CSE Seminar Hall",
      period: 4,
      startTime: "12:30",
      endTime: "13:20",
      colorIndex: 5,
    },
    5: {
      id: "wed-5",
      subject: "Project Management",
      subjectCode: "CS604",
      teacher: "PM / PK",
      venue: "Classroom",
      period: 5,
      startTime: "14:00",
      endTime: "14:50",
      colorIndex: 3,
    },
    6: {
      id: "wed-6",
      subject: "Compiler Design",
      subjectCode: "CS603",
      teacher: "SV",
      venue: "Classroom",
      period: 6,
      startTime: "14:50",
      endTime: "15:40",
      colorIndex: 2,
    },
    7: {
      id: "wed-7",
      subject: "Computer Networks",
      subjectCode: "CS602",
      teacher: "IAK",
      venue: "Classroom",
      period: 7,
      startTime: "15:40",
      endTime: "16:40",
      colorIndex: 1,
    },
  },
  Thursday: {
    1: {
      id: "thu-1",
      subject: "Compiler Design",
      subjectCode: "CS603",
      teacher: "SV",
      venue: "Classroom",
      period: 1,
      startTime: "10:00",
      endTime: "10:50",
      colorIndex: 2,
    },
    2: {
      id: "thu-2",
      subject: "Machine Learning",
      subjectCode: "CS601",
      teacher: "NR",
      venue: "Classroom",
      period: 2,
      startTime: "10:50",
      endTime: "11:40",
      colorIndex: 0,
    },
    3: {
      id: "thu-3",
      subject: "DA Lab / CN Lab",
      subjectCode: "CS605/CS602",
      teacher: "VC / IAK",
      venue: "Lab",
      period: 3,
      startTime: "11:40",
      endTime: "12:30",
      colorIndex: 7,
    },
    4: {
      id: "thu-4",
      subject: "DA Lab / CN Lab",
      subjectCode: "CS605/CS602",
      teacher: "VC / IAK",
      venue: "Lab",
      period: 4,
      startTime: "12:30",
      endTime: "13:20",
      colorIndex: 7,
    },
    5: {
      id: "thu-5",
      subject: "Computer Networks",
      subjectCode: "CS602",
      teacher: "IAK",
      venue: "Classroom",
      period: 5,
      startTime: "14:00",
      endTime: "14:50",
      colorIndex: 1,
    },
    6: {
      id: "thu-6",
      subject: "Project Management",
      subjectCode: "CS604",
      teacher: "PM / PK",
      venue: "Classroom",
      period: 6,
      startTime: "14:50",
      endTime: "15:40",
      colorIndex: 3,
    },
    7: {
      id: "thu-7",
      subject: "Library",
      subjectCode: "LIB",
      teacher: "",
      venue: "Library",
      period: 7,
      startTime: "15:40",
      endTime: "16:40",
      colorIndex: 4,
    },
  },
  Friday: {
    1: {
      id: "fri-1",
      subject: "CN Lab / ML Lab",
      subjectCode: "CS602/CS601",
      teacher: "IAK / NR",
      venue: "Lab (Del-2)",
      period: 1,
      startTime: "10:00",
      endTime: "10:50",
      colorIndex: 1,
    },
    2: {
      id: "fri-2",
      subject: "CN Lab / ML Lab",
      subjectCode: "CS602/CS601",
      teacher: "IAK / NR",
      venue: "Lab (Del-2)",
      period: 2,
      startTime: "10:50",
      endTime: "11:40",
      colorIndex: 1,
    },
    3: {
      id: "fri-3",
      subject: "Project Management",
      subjectCode: "CS604",
      teacher: "PM / PK",
      venue: "Classroom",
      period: 3,
      startTime: "11:40",
      endTime: "12:30",
      colorIndex: 3,
    },
    4: {
      id: "fri-4",
      subject: "Compiler Design",
      subjectCode: "CS603",
      teacher: "SV",
      venue: "Classroom",
      period: 4,
      startTime: "12:30",
      endTime: "13:20",
      colorIndex: 2,
    },
    5: {
      id: "fri-5",
      subject: "Machine Learning",
      subjectCode: "CS601",
      teacher: "NR",
      venue: "Classroom",
      period: 5,
      startTime: "14:00",
      endTime: "14:50",
      colorIndex: 0,
    },
    6: {
      id: "fri-6",
      subject: "Compiler Design",
      subjectCode: "CS603",
      teacher: "SV",
      venue: "Classroom",
      period: 6,
      startTime: "14:50",
      endTime: "15:40",
      colorIndex: 2,
    },
    7: {
      id: "fri-7",
      subject: "Computer Networks",
      subjectCode: "CS602",
      teacher: "IAK",
      venue: "Classroom",
      period: 7,
      startTime: "15:40",
      endTime: "16:40",
      colorIndex: 1,
    },
  },
  Saturday: {
    1: {
      id: "sat-1",
      subject: "Machine Learning",
      subjectCode: "CS601",
      teacher: "NR",
      venue: "Classroom",
      period: 1,
      startTime: "10:00",
      endTime: "10:50",
      colorIndex: 0,
    },
    2: {
      id: "sat-2",
      subject: "Computer Networks",
      subjectCode: "CS602",
      teacher: "IAK",
      venue: "Classroom",
      period: 2,
      startTime: "10:50",
      endTime: "11:40",
      colorIndex: 1,
    },
    3: {
      id: "sat-3",
      subject: "ML Lab / DA Lab",
      subjectCode: "CS601/CS605",
      teacher: "NR / VC",
      venue: "Lab (Del-2)",
      period: 3,
      startTime: "11:40",
      endTime: "12:30",
      colorIndex: 0,
    },
    4: {
      id: "sat-4",
      subject: "ML Lab / DA Lab",
      subjectCode: "CS601/CS605",
      teacher: "NR / VC",
      venue: "Lab (Del-2)",
      period: 4,
      startTime: "12:30",
      endTime: "13:20",
      colorIndex: 0,
    },
    5: {
      id: "sat-5",
      subject: "Compiler Design",
      subjectCode: "CS603",
      teacher: "SV",
      venue: "Classroom",
      period: 5,
      startTime: "14:00",
      endTime: "14:50",
      colorIndex: 2,
    },
    6: {
      id: "sat-6",
      subject: "Project Management",
      subjectCode: "CS604",
      teacher: "PM / PK",
      venue: "Classroom",
      period: 6,
      startTime: "14:50",
      endTime: "15:40",
      colorIndex: 3,
    },
    7: {
      id: "sat-7",
      subject: "Machine Learning",
      subjectCode: "CS601",
      teacher: "NR",
      venue: "Classroom",
      period: 7,
      startTime: "15:40",
      endTime: "16:40",
      colorIndex: 0,
    },
  },
};

const STORAGE_KEY = "@csevid_timetable";

interface TimetableContextValue {
  timetable: FullTimetable;
  updateLecture: (day: string, period: number, lecture: Lecture | null) => void;
  getLecturesForDay: (day: string) => Array<{ slot: (typeof TIME_SLOTS)[0]; lecture: Lecture | null }>;
  getCurrentAndNextLecture: () => {
    current: (Lecture & { day: string }) | null;
    next: (Lecture & { day: string }) | null;
    todayDay: string;
  };
  getTodayLectures: () => Array<{ slot: (typeof TIME_SLOTS)[0]; lecture: Lecture | null }>;
  isLoaded: boolean;
  resetToDefault: () => void;
}

const TimetableContext = createContext<TimetableContextValue | null>(null);

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function getDayName(date: Date): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[date.getDay()];
}

export function TimetableProvider({ children }: { children: ReactNode }) {
  const [timetable, setTimetable] = useState<FullTimetable>(DEFAULT_TIMETABLE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        try {
          setTimetable(JSON.parse(stored));
        } catch {
          setTimetable(DEFAULT_TIMETABLE);
        }
      }
      setIsLoaded(true);
    });
  }, []);

  const saveTimetable = useCallback(async (data: FullTimetable) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  const updateLecture = useCallback(
    (day: string, period: number, lecture: Lecture | null) => {
      setTimetable((prev) => {
        const updated = {
          ...prev,
          [day]: { ...prev[day], [period]: lecture },
        };
        saveTimetable(updated);
        return updated;
      });
    },
    [saveTimetable]
  );

  const getLecturesForDay = useCallback(
    (day: string) => {
      return TIME_SLOTS.map((slot) => ({
        slot,
        lecture: slot.period === -1 ? null : (timetable[day]?.[slot.period] ?? null),
      }));
    },
    [timetable]
  );

  const getCurrentAndNextLecture = useCallback(() => {
    const now = new Date();
    const dayName = getDayName(now);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let current: (Lecture & { day: string }) | null = null;
    let next: (Lecture & { day: string }) | null = null;

    if (dayName === "Sunday") {
      return { current: null, next: null, todayDay: dayName };
    }

    const daySchedule = timetable[dayName];
    if (!daySchedule) return { current: null, next: null, todayDay: dayName };

    const slots = TIME_SLOTS.filter((s) => s.period !== -1);
    for (const slot of slots) {
      const lecture = daySchedule[slot.period];
      if (!lecture) continue;
      const start = timeToMinutes(slot.start);
      const end = timeToMinutes(slot.end);
      if (currentMinutes >= start && currentMinutes < end) {
        current = { ...lecture, day: dayName };
      } else if (currentMinutes < start && !next) {
        next = { ...lecture, day: dayName };
      }
    }

    if (!next && !current) {
      for (const day of DAYS) {
        if (day === dayName) continue;
        const schedule = timetable[day];
        if (!schedule) continue;
        for (const slot of slots) {
          const lecture = schedule[slot.period];
          if (lecture && !next) {
            next = { ...lecture, day };
            break;
          }
        }
        if (next) break;
      }
    }

    return { current, next, todayDay: dayName };
  }, [timetable]);

  const getTodayLectures = useCallback(() => {
    const now = new Date();
    const dayName = getDayName(now);
    if (dayName === "Sunday") return [];
    return getLecturesForDay(dayName);
  }, [getLecturesForDay]);

  const resetToDefault = useCallback(async () => {
    setTimetable(DEFAULT_TIMETABLE);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TIMETABLE));
  }, []);

  const value = useMemo(
    () => ({
      timetable,
      updateLecture,
      getLecturesForDay,
      getCurrentAndNextLecture,
      getTodayLectures,
      isLoaded,
      resetToDefault,
    }),
    [timetable, updateLecture, getLecturesForDay, getCurrentAndNextLecture, getTodayLectures, isLoaded, resetToDefault]
  );

  return <TimetableContext.Provider value={value}>{children}</TimetableContext.Provider>;
}

export function useTimetable() {
  const ctx = useContext(TimetableContext);
  if (!ctx) throw new Error("useTimetable must be used within TimetableProvider");
  return ctx;
}
