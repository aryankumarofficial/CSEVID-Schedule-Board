import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import { useTimetable, DAYS, TIME_SLOTS, Lecture } from "@/context/TimetableContext";

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${m.toString().padStart(2, "0")}`;
}

const DAY_ABBREV: Record<string, string> = {
  Monday: "MON",
  Tuesday: "TUE",
  Wednesday: "WED",
  Thursday: "THU",
  Friday: "FRI",
  Saturday: "SAT",
};

function getDayIndex() {
  const d = new Date().getDay();
  const map: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 };
  return map[d] ?? 0;
}

function DayView({ day, bottomPad }: { day: string; bottomPad: number }) {
  const { getLecturesForDay } = useTimetable();
  const slots = getLecturesForDay(day);

  return (
    <Animated.View entering={FadeIn.duration(300)} style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingBottom: bottomPad }}
      >
        {slots.map(({ slot, lecture }) => {
          if (slot.period === -1) {
            return (
              <View key="lunch" style={styles.lunchBreakRow}>
                <Ionicons name="restaurant-outline" size={13} color={Colors.gold} />
                <Text style={styles.lunchLabel}>
                  Lunch Break  {formatTime(slot.start)} – {formatTime(slot.end)}
                </Text>
              </View>
            );
          }

          const colorIndex = lecture?.colorIndex ?? 0;
          const color = lecture
            ? Colors.subjectColors[colorIndex % Colors.subjectColors.length]
            : Colors.border;

          return (
            <View key={slot.period} style={styles.periodRow}>
              <View style={styles.periodTimeCol}>
                <Text style={[styles.periodNum, { color: Colors.textMuted }]}>
                  P{slot.period}
                </Text>
                <Text style={[styles.periodTime, { color: Colors.textMuted }]}>
                  {formatTime(slot.start)}
                </Text>
                <Text style={[styles.periodTime, { color: Colors.textMuted }]}>
                  {formatTime(slot.end)}
                </Text>
              </View>

              {lecture ? (
                <View
                  style={[
                    styles.dayLectureCard,
                    { borderLeftColor: color, backgroundColor: color + "18" },
                  ]}
                >
                  <View style={styles.dayCardTop}>
                    <Text style={[styles.daySubjectCode, { color }]}>
                      {lecture.subjectCode}
                    </Text>
                    <View style={[styles.dayBadge, { backgroundColor: color + "33" }]}>
                      <Text style={[styles.dayBadgeText, { color }]}>
                        {slot.label}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.daySubjectName}>{lecture.subject}</Text>
                  <View style={styles.dayMeta}>
                    {!!lecture.teacher && (
                      <View style={styles.dayMetaItem}>
                        <Ionicons
                          name="person-outline"
                          size={11}
                          color={Colors.textMuted}
                        />
                        <Text style={styles.dayMetaText}>{lecture.teacher}</Text>
                      </View>
                    )}
                    {!!lecture.venue && (
                      <View style={styles.dayMetaItem}>
                        <Ionicons
                          name="location-outline"
                          size={11}
                          color={Colors.textMuted}
                        />
                        <Text style={styles.dayMetaText}>{lecture.venue}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ) : (
                <View
                  style={[
                    styles.dayLectureCard,
                    {
                      borderLeftColor: Colors.border,
                      backgroundColor: Colors.backgroundMid,
                      opacity: 0.4,
                    },
                  ]}
                >
                  <Text style={[styles.daySubjectCode, { color: Colors.textMuted }]}>
                    Free
                  </Text>
                  <Text style={styles.daySubjectName}>No lecture scheduled</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

export default function TimetableScreen() {
  const insets = useSafeAreaInsets();
  const [selectedDay, setSelectedDay] = useState(() =>
    Math.min(getDayIndex(), DAYS.length - 1)
  );

  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  const bottomPad = insets.bottom + webBottomPad + 100;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + webTopPad },
      ]}
    >
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text style={styles.screenTitle}>Timetable</Text>
        <Text style={styles.screenSubtitle}>CSEVID  •  6th Semester</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayTabs}
        >
          {DAYS.map((day, idx) => {
            const isSelected = idx === selectedDay;
            const isToday = idx === getDayIndex();
            return (
              <Pressable
                key={day}
                onPress={() => setSelectedDay(idx)}
                style={[
                  styles.dayTab,
                  isSelected && styles.dayTabSelected,
                  isToday && !isSelected && styles.dayTabToday,
                ]}
              >
                <Text
                  style={[
                    styles.dayTabText,
                    isSelected && styles.dayTabTextSelected,
                  ]}
                >
                  {DAY_ABBREV[day]}
                </Text>
                {isToday && (
                  <View
                    style={[
                      styles.todayDot,
                      { backgroundColor: isSelected ? "#fff" : Colors.primary },
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      <View style={styles.dayContent}>
        <Text style={styles.dayTitle}>{DAYS[selectedDay]}</Text>
        <DayView day={DAYS[selectedDay]} bottomPad={bottomPad} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 16,
  },
  screenTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    color: Colors.textPrimary,
  },
  screenSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  dayTabs: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  dayTab: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Colors.backgroundMid,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  dayTabSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayTabToday: {
    borderColor: Colors.primary,
  },
  dayTabText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  dayTabTextSelected: {
    color: "#fff",
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
  dayContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dayTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 17,
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  periodRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "stretch",
  },
  periodTimeCol: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  periodNum: {
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  periodTime: {
    fontFamily: "Poppins_400Regular",
    fontSize: 9,
    lineHeight: 13,
  },
  dayLectureCard: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderLeftWidth: 3,
  },
  dayCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  daySubjectCode: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
  },
  dayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  dayBadgeText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 10,
  },
  daySubjectName: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  dayMeta: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  dayMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dayMetaText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
  },
  lunchBreakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: Colors.gold + "15",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gold + "30",
  },
  lunchLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: Colors.gold,
  },
});
