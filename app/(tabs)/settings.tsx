import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import {
  useTimetable,
  DAYS,
  TIME_SLOTS,
  Lecture,
} from "@/context/TimetableContext";
import * as Haptics from "expo-haptics";

const DAY_ABBREV: Record<string, string> = {
  Monday: "MON",
  Tuesday: "TUE",
  Wednesday: "WED",
  Thursday: "THU",
  Friday: "FRI",
  Saturday: "SAT",
};

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

interface EditModalProps {
  visible: boolean;
  day: string;
  period: number;
  startTime: string;
  endTime: string;
  existing: Lecture | null;
  onSave: (lecture: Lecture | null) => void;
  onClose: () => void;
}

const COLOR_OPTIONS = Colors.subjectColors;

function EditModal({ visible, day, period, startTime, endTime, existing, onSave, onClose }: EditModalProps) {
  const insets = useSafeAreaInsets();
  const [subjectCode, setSubjectCode] = useState(existing?.subjectCode ?? "");
  const [subject, setSubject] = useState(existing?.subject ?? "");
  const [teacher, setTeacher] = useState(existing?.teacher ?? "");
  const [venue, setVenue] = useState(existing?.venue ?? "");
  const [colorIndex, setColorIndex] = useState(existing?.colorIndex ?? 0);

  const handleSave = () => {
    if (!subjectCode.trim() && !subject.trim()) {
      onSave(null);
      return;
    }
    onSave({
      id: existing?.id ?? `${day.toLowerCase().slice(0, 3)}-${period}-${Date.now()}`,
      subjectCode: subjectCode.trim(),
      subject: subject.trim(),
      teacher: teacher.trim(),
      venue: venue.trim(),
      period,
      startTime,
      endTime,
      colorIndex,
    });
  };

  const handleClear = () => {
    Alert.alert("Clear Lecture", "Remove this lecture from the timetable?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onSave(null);
        },
      },
    ]);
  };

  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={editStyles.overlay}>
        <View style={[editStyles.sheet, { paddingBottom: insets.bottom + webBottomPad + 16 }]}>
          <View style={editStyles.handle} />
          <View style={editStyles.sheetHeader}>
            <Text style={editStyles.sheetTitle}>
              {day} · Period {period}
            </Text>
            <Text style={editStyles.sheetSubtitle}>{formatTime(startTime)} – {formatTime(endTime)}</Text>
            <Pressable onPress={onClose} style={editStyles.closeBtn} hitSlop={10}>
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={editStyles.form}>
              <View style={editStyles.row}>
                <View style={[editStyles.field, { flex: 1 }]}>
                  <Text style={editStyles.fieldLabel}>Subject Code</Text>
                  <TextInput
                    style={editStyles.input}
                    value={subjectCode}
                    onChangeText={setSubjectCode}
                    placeholder="e.g. CS601"
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <View style={editStyles.field}>
                <Text style={editStyles.fieldLabel}>Subject Name</Text>
                <TextInput
                  style={editStyles.input}
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="e.g. Machine Learning"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={editStyles.row}>
                <View style={[editStyles.field, { flex: 1 }]}>
                  <Text style={editStyles.fieldLabel}>Teacher</Text>
                  <TextInput
                    style={editStyles.input}
                    value={teacher}
                    onChangeText={setTeacher}
                    placeholder="e.g. NR"
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="characters"
                  />
                </View>
                <View style={[editStyles.field, { flex: 1 }]}>
                  <Text style={editStyles.fieldLabel}>Venue</Text>
                  <TextInput
                    style={editStyles.input}
                    value={venue}
                    onChangeText={setVenue}
                    placeholder="e.g. HP LAB"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>

              <View style={editStyles.field}>
                <Text style={editStyles.fieldLabel}>Subject Color</Text>
                <View style={editStyles.colorRow}>
                  {COLOR_OPTIONS.map((color, idx) => (
                    <Pressable
                      key={color}
                      onPress={() => {
                        setColorIndex(idx);
                        Haptics.selectionAsync();
                      }}
                      style={[
                        editStyles.colorDot,
                        { backgroundColor: color },
                        colorIndex === idx && editStyles.colorDotSelected,
                      ]}
                    >
                      {colorIndex === idx && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={editStyles.actions}>
            {existing && (
              <Pressable onPress={handleClear} style={editStyles.clearBtn}>
                <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                <Text style={[editStyles.clearBtnText, { color: Colors.danger }]}>Clear</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleSave();
              }}
              style={editStyles.saveBtn}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={editStyles.saveBtnText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface EditState {
  day: string;
  period: number;
  startTime: string;
  endTime: string;
  existing: Lecture | null;
}

function DaySection({ day, selectedDay }: { day: string; selectedDay: string }) {
  const { getLecturesForDay, updateLecture } = useTimetable();
  const [editState, setEditState] = useState<EditState | null>(null);
  const slots = getLecturesForDay(day);

  const handleEdit = useCallback((period: number, startTime: string, endTime: string, lecture: Lecture | null) => {
    Haptics.selectionAsync();
    setEditState({ day, period, startTime, endTime, existing: lecture });
  }, [day]);

  if (day !== selectedDay) return null;

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.daySection}>
      {slots.map(({ slot, lecture }) => {
        if (slot.period === -1) {
          return (
            <View key="lunch" style={styles.lunchRow}>
              <Ionicons name="restaurant-outline" size={12} color={Colors.gold} />
              <Text style={styles.lunchLabel}>Lunch Break · {formatTime(slot.start)} – {formatTime(slot.end)}</Text>
            </View>
          );
        }
        const color = lecture
          ? Colors.subjectColors[lecture.colorIndex % Colors.subjectColors.length]
          : Colors.border;

        return (
          <Pressable
            key={slot.period}
            onPress={() => handleEdit(slot.period, slot.start, slot.end, lecture)}
            style={({ pressed }) => [styles.periodItem, pressed && styles.periodItemPressed]}
          >
            <View style={styles.periodLeft}>
              <Text style={[styles.periodNum, { color: Colors.textMuted }]}>P{slot.period}</Text>
              <Text style={[styles.periodTime, { color: Colors.textMuted }]}>
                {formatTime(slot.start)}
              </Text>
            </View>
            <View style={[styles.periodCard, { borderLeftColor: color, backgroundColor: lecture ? color + "18" : Colors.backgroundMid }]}>
              {lecture ? (
                <>
                  <View style={styles.periodCardTop}>
                    <Text style={[styles.periodCode, { color }]}>{lecture.subjectCode}</Text>
                    <Ionicons name="pencil-outline" size={13} color={Colors.textMuted} />
                  </View>
                  <Text style={styles.periodName} numberOfLines={1}>{lecture.subject}</Text>
                  <View style={styles.periodMeta}>
                    {lecture.teacher ? (
                      <Text style={styles.periodMetaText}>{lecture.teacher}</Text>
                    ) : null}
                    {lecture.venue ? (
                      <Text style={styles.periodMetaText}>· {lecture.venue}</Text>
                    ) : null}
                  </View>
                </>
              ) : (
                <View style={styles.periodEmpty}>
                  <Ionicons name="add-circle-outline" size={16} color={Colors.textMuted} />
                  <Text style={styles.periodEmptyText}>Tap to add lecture</Text>
                </View>
              )}
            </View>
          </Pressable>
        );
      })}

      {editState && (
        <EditModal
          visible
          day={editState.day}
          period={editState.period}
          startTime={editState.startTime}
          endTime={editState.endTime}
          existing={editState.existing}
          onSave={(lec) => {
            updateLecture(editState.day, editState.period, lec);
            setEditState(null);
          }}
          onClose={() => setEditState(null)}
        />
      )}
    </Animated.View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { resetToDefault } = useTimetable();
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);

  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  const handleReset = () => {
    Alert.alert(
      "Reset Timetable",
      "This will restore the default CSEVID timetable. All your changes will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            resetToDefault();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopPad, paddingBottom: webBottomPad }]}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>Manage</Text>
          <Text style={styles.screenSubtitle}>Edit your timetable</Text>
        </View>
        <Pressable onPress={handleReset} style={styles.resetBtn} hitSlop={8}>
          <Ionicons name="refresh-outline" size={16} color={Colors.danger} />
          <Text style={styles.resetBtnText}>Reset</Text>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayTabs}
        >
          {DAYS.map((day) => {
            const isSelected = day === selectedDay;
            return (
              <Pressable
                key={day}
                onPress={() => {
                  setSelectedDay(day);
                  Haptics.selectionAsync();
                }}
                style={[
                  styles.dayTab,
                  isSelected && styles.dayTabSelected,
                ]}
              >
                <Text style={[styles.dayTabText, isSelected && styles.dayTabTextSelected]}>
                  {DAY_ABBREV[day]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 100,
        }}
      >
        <Text style={styles.dayTitle}>{selectedDay}</Text>
        {DAYS.map((day) => (
          <DaySection key={day} day={day} selectedDay={selectedDay} />
        ))}

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.accent} />
          <Text style={styles.infoText}>
            Tap any period to edit it. You can change subject, teacher, venue, and color. Tap "Clear" to remove a lecture.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.danger + "20",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.danger + "40",
  },
  resetBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.danger,
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
  },
  dayTabSelected: {
    backgroundColor: Colors.primary,
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
  dayTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 17,
    color: Colors.textPrimary,
    marginBottom: 14,
    marginTop: 4,
  },
  daySection: {
    gap: 8,
  },
  periodItem: {
    flexDirection: "row",
    gap: 12,
    alignItems: "stretch",
  },
  periodItemPressed: {
    opacity: 0.75,
  },
  periodLeft: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  periodNum: {
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  periodTime: {
    fontFamily: "Poppins_400Regular",
    fontSize: 9,
    marginTop: 2,
  },
  periodCard: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderLeftWidth: 3,
    marginBottom: 4,
  },
  periodCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  periodCode: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
  },
  periodName: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  periodMeta: {
    flexDirection: "row",
    gap: 6,
  },
  periodMetaText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
  },
  periodEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  periodEmptyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
  },
  lunchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginLeft: 56,
    backgroundColor: Colors.gold + "15",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gold + "30",
    marginBottom: 4,
  },
  lunchLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: Colors.gold,
  },
  infoCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: Colors.accent + "15",
    borderRadius: 14,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.accent + "30",
    alignItems: "flex-start",
  },
  infoText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    flex: 1,
    lineHeight: 18,
  },
});

const editStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.backgroundMid,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: "90%",
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeader: {
    marginBottom: 20,
  },
  sheetTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: Colors.textPrimary,
    paddingRight: 40,
  },
  sheetSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.backgroundLight,
    borderRadius: 18,
  },
  form: {
    gap: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  colorRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  colorDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  colorDotSelected: {
    borderWidth: 2,
    borderColor: "#fff",
    transform: [{ scale: 1.15 }],
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.danger + "20",
    borderWidth: 1,
    borderColor: Colors.danger + "40",
  },
  clearBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
  saveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.primary,
  },
  saveBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
});
