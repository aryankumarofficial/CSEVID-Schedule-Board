import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import { useTimetable, TIME_SLOTS, Lecture } from "@/context/TimetableContext";

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function getProgressPercent(start: string, end: string, nowMinutes: number) {
  const s = timeToMinutes(start);
  const e = timeToMinutes(end);
  const pct = ((nowMinutes - s) / (e - s)) * 100;
  return Math.max(0, Math.min(100, pct));
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function formatCurrentTime(date: Date) {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function formatDate(date: Date) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function LiveDot() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.liveDot, animStyle]} />;
}

function ProgressBar({ percent, color }: { percent: number; color: string }) {
  const clampedPct = Math.max(0, Math.min(100, percent));
  return (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          { width: `${clampedPct}%` as any, backgroundColor: color },
        ]}
      />
    </View>
  );
}

interface LectureCardProps {
  lecture: Lecture & { day: string };
  label: string;
  isOngoing: boolean;
  nowMinutes: number;
  delay?: number;
}

function LectureCard({
  lecture,
  label,
  isOngoing,
  nowMinutes,
  delay = 0,
}: LectureCardProps) {
  const colorIndex = lecture.colorIndex ?? 0;
  const subjectColor =
    Colors.subjectColors[colorIndex % Colors.subjectColors.length];
  const progress = isOngoing
    ? getProgressPercent(lecture.startTime, lecture.endTime, nowMinutes)
    : 0;

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <LinearGradient
        colors={
          isOngoing
            ? [Colors.cardBg, Colors.backgroundLight]
            : [Colors.backgroundMid, Colors.backgroundMid]
        }
        style={[styles.lectureCard, isOngoing && styles.lectureCardOngoing]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.labelPill,
              {
                backgroundColor: isOngoing
                  ? subjectColor + "33"
                  : Colors.backgroundLight,
              },
            ]}
          >
            {isOngoing && <LiveDot />}
            <Text
              style={[
                styles.labelText,
                { color: isOngoing ? subjectColor : Colors.textMuted },
              ]}
            >
              {label}
            </Text>
          </View>
          <Text style={[styles.timeText, { color: Colors.textMuted }]}>
            {formatTime(lecture.startTime)} – {formatTime(lecture.endTime)}
          </Text>
        </View>

        <View style={styles.cardBody}>
          <View style={[styles.colorBar, { backgroundColor: subjectColor }]} />
          <View style={styles.cardInfo}>
            <Text style={styles.subjectCode}>{lecture.subjectCode}</Text>
            <Text style={styles.subjectName} numberOfLines={1}>
              {lecture.subject}
            </Text>
            <View style={styles.cardMeta}>
              {!!lecture.teacher && (
                <View style={styles.metaChip}>
                  <Ionicons
                    name="person-outline"
                    size={11}
                    color={Colors.textMuted}
                  />
                  <Text style={styles.metaText}>{lecture.teacher}</Text>
                </View>
              )}
              {!!lecture.venue && (
                <View style={styles.metaChip}>
                  <Ionicons
                    name="location-outline"
                    size={11}
                    color={Colors.textMuted}
                  />
                  <Text style={styles.metaText}>{lecture.venue}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {isOngoing && (
          <View style={styles.progressSection}>
            <ProgressBar percent={progress} color={subjectColor} />
            <Text style={[styles.progressLabel, { color: Colors.textMuted }]}>
              {Math.round(progress)}% complete
            </Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

function TodayLectureRow({
  slot,
  lecture,
  nowMinutes,
}: {
  slot: (typeof TIME_SLOTS)[0];
  lecture: Lecture | null;
  nowMinutes: number;
}) {
  if (slot.period === -1) {
    return (
      <View style={styles.lunchRow}>
        <Ionicons name="restaurant-outline" size={13} color={Colors.gold} />
        <Text style={styles.lunchText}>
          Lunch  {formatTime("13:20")} – {formatTime("14:00")}
        </Text>
      </View>
    );
  }

  const isPast = nowMinutes > timeToMinutes(slot.end);
  const isNow =
    nowMinutes >= timeToMinutes(slot.start) &&
    nowMinutes < timeToMinutes(slot.end);
  const colorIndex = lecture?.colorIndex ?? 0;
  const color = lecture
    ? Colors.subjectColors[colorIndex % Colors.subjectColors.length]
    : Colors.border;

  return (
    <View style={[styles.todayRow, isPast && styles.todayRowPast]}>
      <View style={styles.todayTimeCol}>
        <Text style={[styles.todayPeriod, { color: isNow ? color : Colors.textMuted }]}>
          P{slot.period}
        </Text>
        <Text style={[styles.todayTime, { color: Colors.textMuted }]}>
          {formatTime(slot.start)}
        </Text>
      </View>

      <View
        style={[
          styles.todayDotCol,
          { borderColor: color, backgroundColor: isNow ? color : Colors.backgroundLight },
        ]}
      />

      {lecture ? (
        <View
          style={[
            styles.todaySubjectCard,
            {
              borderLeftColor: color,
              backgroundColor: isNow ? color + "20" : Colors.backgroundMid,
            },
          ]}
        >
          <Text style={[styles.todaySubjectCode, { color: isNow ? color : Colors.textPrimary }]}>
            {lecture.subjectCode}
          </Text>
          <Text style={styles.todaySubjectName} numberOfLines={1}>
            {lecture.subject}
          </Text>
          {!!lecture.venue && (
            <Text style={styles.todayVenue}>{lecture.venue}</Text>
          )}
        </View>
      ) : (
        <View
          style={[
            styles.todaySubjectCard,
            { borderLeftColor: Colors.border, backgroundColor: Colors.backgroundMid, opacity: 0.4 },
          ]}
        >
          <Text style={[styles.todaySubjectCode, { color: Colors.textMuted }]}>
            —
          </Text>
          <Text style={styles.todaySubjectName}>Free Period</Text>
        </View>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { getCurrentAndNextLecture, getTodayLectures } = useTimetable();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const { current, next, todayDay } = getCurrentAndNextLecture();
  const todayLectures = getTodayLectures();

  const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()];
  const isSunday = dayName === "Sunday";

  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + webTopPad + 16,
          paddingBottom: insets.bottom + webBottomPad + 100,
          paddingHorizontal: 20,
        }}
      >
        <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>CSEVID</Text>
            <Text style={styles.dateText}>{formatDate(now)}</Text>
          </View>
          <View style={styles.clockBadge}>
            <Ionicons name="time-outline" size={14} color={Colors.primary} />
            <Text style={styles.clockText}>{formatCurrentTime(now)}</Text>
          </View>
        </Animated.View>

        {isSunday ? (
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={styles.sundayCard}
          >
            <Ionicons name="sunny-outline" size={40} color={Colors.gold} />
            <Text style={styles.sundayTitle}>Enjoy your Sunday!</Text>
            <Text style={styles.sundaySubtitle}>
              No classes today. Rest up for the week ahead.
            </Text>
          </Animated.View>
        ) : (
          <>
            {current && (
              <LectureCard
                lecture={current}
                label="Ongoing"
                isOngoing
                nowMinutes={nowMinutes}
                delay={100}
              />
            )}
            {next && (
              <LectureCard
                lecture={next}
                label={next.day === todayDay ? "Up Next" : `Next (${next.day})`}
                isOngoing={false}
                nowMinutes={nowMinutes}
                delay={200}
              />
            )}
            {!current && !next && (
              <Animated.View
                entering={FadeInDown.delay(100).springify()}
                style={styles.noClassCard}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={36}
                  color={Colors.success}
                />
                <Text style={styles.noClassTitle}>All done for today!</Text>
                <Text style={styles.noClassSub}>
                  No more lectures remaining.
                </Text>
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown.delay(300).springify()}>
              <Text style={styles.sectionTitle}>Today's Schedule</Text>
              <View style={styles.todaySchedule}>
                {todayLectures.map(({ slot, lecture }) => (
                  <TodayLectureRow
                    key={slot.period}
                    slot={slot}
                    lecture={lecture}
                    nowMinutes={nowMinutes}
                  />
                ))}
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  greeting: {
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  dateText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  clockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.backgroundMid,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clockText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.primary,
  },
  lectureCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  lectureCardOngoing: {
    borderColor: Colors.primary + "44",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  labelPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  labelText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  timeText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
  },
  cardBody: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  colorBar: {
    width: 4,
    height: 52,
    borderRadius: 2,
  },
  cardInfo: {
    flex: 1,
  },
  subjectCode: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: Colors.textPrimary,
    lineHeight: 26,
  },
  subjectName: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 2,
  },
  cardMeta: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  progressSection: {
    marginTop: 14,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  progressLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    marginTop: 4,
  },
  noClassCard: {
    backgroundColor: Colors.backgroundMid,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noClassTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 17,
    color: Colors.textPrimary,
  },
  noClassSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
  },
  sundayCard: {
    backgroundColor: Colors.backgroundMid,
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    gap: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.gold + "33",
  },
  sundayTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: Colors.textPrimary,
  },
  sundaySubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 17,
    color: Colors.textPrimary,
    marginBottom: 12,
    marginTop: 8,
  },
  todaySchedule: {
    gap: 6,
  },
  todayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 60,
  },
  todayRowPast: {
    opacity: 0.45,
  },
  todayTimeCol: {
    width: 46,
    alignItems: "center",
  },
  todayPeriod: {
    fontFamily: "Poppins_700Bold",
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  todayTime: {
    fontFamily: "Poppins_400Regular",
    fontSize: 9,
    marginTop: 2,
    textAlign: "center",
  },
  todayDotCol: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  todaySubjectCard: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderLeftWidth: 3,
  },
  todaySubjectCode: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    color: Colors.textPrimary,
  },
  todaySubjectName: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  todayVenue: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  lunchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginLeft: 56,
    backgroundColor: Colors.gold + "15",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gold + "30",
  },
  lunchText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: Colors.gold,
  },
});
