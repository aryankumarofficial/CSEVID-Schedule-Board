import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useTimetable, DAYS, TIME_SLOTS, Lecture } from "@/context/TimetableContext";

const GEMINI_API_KEY_STORAGE = "@csevid_gemini_key";
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const PERIODS = TIME_SLOTS.filter((s) => s.period !== -1);

function subjectColorIndex(code: string): number {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % Colors.subjectColors.length;
}

type Step = "key" | "pick" | "loading" | "preview" | "error";

interface ParsedLecture {
  period: number;
  subjectCode: string;
  subject: string;
  teacher: string;
  venue: string;
}

type ParsedTimetable = {
  [day: string]: ParsedLecture[];
};

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function ScanModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { updateLecture } = useTimetable();

  const [step, setStep] = useState<Step>("key");
  const [apiKey, setApiKey] = useState("");
  const [savedKey, setSavedKey] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedTimetable | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const webBottomPad = Platform.OS === "web" ? 34 : 0;
  const bottomPad = insets.bottom + webBottomPad + 16;

  useEffect(() => {
    if (visible) {
      AsyncStorage.getItem(GEMINI_API_KEY_STORAGE).then((k) => {
        if (k) {
          setSavedKey(k);
          setApiKey(k);
          setStep("pick");
        } else {
          setStep("key");
        }
      });
    }
  }, [visible]);

  function handleClose() {
    setStep(savedKey ? "pick" : "key");
    setImageUri(null);
    setImageBase64(null);
    setParsed(null);
    setErrorMsg("");
    onClose();
  }

  async function saveKey() {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      Alert.alert("API Key Required", "Please paste your Gemini API key.");
      return;
    }
    await AsyncStorage.setItem(GEMINI_API_KEY_STORAGE, trimmed);
    setSavedKey(trimmed);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStep("pick");
  }

  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
      await analyzeImage(result.assets[0].base64 ?? "");
    }
  }

  async function pickFromCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow camera access.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
      await analyzeImage(result.assets[0].base64 ?? "");
    }
  }

  async function analyzeImage(base64: string) {
    if (!base64) {
      setErrorMsg("Could not read image data. Please try again.");
      setStep("error");
      return;
    }
    setStep("loading");
    try {
      const prompt = `You are parsing a university class timetable image for CSEVID (CSE 6th Semester Section D).

Extract ALL lectures visible in the image and return ONLY a JSON object with this exact structure:
{
  "Monday": [
    { "period": 1, "subjectCode": "CS601", "subject": "Machine Learning", "teacher": "NR", "venue": "Room 101" }
  ],
  "Tuesday": [...],
  "Wednesday": [...],
  "Thursday": [...],
  "Friday": [...],
  "Saturday": [...]
}

Rules:
- period is a number from 1 to 7
- Period time slots: P1=10:00-10:50, P2=10:50-11:40, P3=11:40-12:30, P4=12:30-13:20, P5=14:00-14:50, P6=14:50-15:40, P7=15:40-16:40
- If a cell is empty or free, do NOT include it in the array
- Include only days that are visible in the image
- teacher and venue can be empty strings if not visible
- Return ONLY the raw JSON, no markdown, no explanation`;

      const response = await fetch(`${GEMINI_URL}?key=${savedKey || apiKey.trim()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: base64,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096,
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const msg =
          (errData as any)?.error?.message ?? `HTTP ${response.status}`;
        throw new Error(msg);
      }

      const data = await response.json();
      const rawText: string =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in Gemini response.");

      const result: ParsedTimetable = JSON.parse(jsonMatch[0]);

      const totalLectures = Object.values(result).reduce(
        (acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0),
        0
      );
      if (totalLectures === 0)
        throw new Error(
          "No lectures detected. Make sure the image shows a clear timetable grid."
        );

      setParsed(result);
      setStep("preview");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Unknown error. Please try again.");
      setStep("error");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  function applyTimetable() {
    if (!parsed) return;
    DAYS.forEach((day) => {
      const dayLectures = parsed[day] ?? [];
      PERIODS.forEach((slot) => {
        const found = dayLectures.find((l) => l.period === slot.period);
        if (found) {
          const lecture: Lecture = {
            id: `${day.toLowerCase().slice(0, 3)}-${slot.period}-${Date.now() + Math.random()}`,
            subjectCode: found.subjectCode || "—",
            subject: found.subject || found.subjectCode || "Unknown",
            teacher: found.teacher || "",
            venue: found.venue || "",
            period: slot.period,
            startTime: slot.start,
            endTime: slot.end,
            colorIndex: subjectColorIndex(found.subjectCode || found.subject || ""),
          };
          updateLecture(day, slot.period, lecture);
        }
      });
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Timetable Updated!",
      "Your scanned timetable has been applied. Tap any period to fine-tune details.",
      [{ text: "Done", onPress: handleClose }]
    );
  }

  function totalDetected() {
    if (!parsed) return 0;
    return Object.values(parsed).reduce(
      (acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0),
      0
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            { paddingBottom: bottomPad },
            step === "preview" && { maxHeight: "95%" },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="scan-outline" size={20} color={Colors.primary} />
              <Text style={styles.title}>Scan Timetable</Text>
            </View>
            <Pressable onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </Pressable>
          </View>

          {step === "key" && (
            <View style={styles.body}>
              <View style={styles.infoBox}>
                <Ionicons
                  name="key-outline"
                  size={32}
                  color={Colors.primary}
                  style={{ marginBottom: 12 }}
                />
                <Text style={styles.infoTitle}>Gemini API Key</Text>
                <Text style={styles.infoText}>
                  This feature uses Google's free Gemini Vision AI to read your
                  timetable image. Get a free API key from{" "}
                  <Text style={{ color: Colors.primary }}>
                    aistudio.google.com
                  </Text>
                  {" "}and paste it below. Your key is stored only on this device.
                </Text>
              </View>
              <TextInput
                style={styles.keyInput}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="AIza..."
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
              <Pressable onPress={saveKey} style={styles.primaryBtn}>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Save & Continue</Text>
              </Pressable>
            </View>
          )}

          {step === "pick" && (
            <View style={styles.body}>
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={styles.previewThumb}
                  contentFit="contain"
                />
              ) : (
                <View style={styles.infoBox}>
                  <Ionicons
                    name="image-outline"
                    size={40}
                    color={Colors.primary}
                    style={{ marginBottom: 12 }}
                  />
                  <Text style={styles.infoTitle}>Choose Your Timetable</Text>
                  <Text style={styles.infoText}>
                    Take a photo or select a screenshot/image of your timetable.
                    Works best with clear, well-lit photos or PDF screenshots.
                  </Text>
                </View>
              )}
              <View style={styles.pickRow}>
                <Pressable
                  onPress={pickFromCamera}
                  style={[styles.pickBtn, { flex: 1 }]}
                >
                  <Ionicons name="camera-outline" size={22} color={Colors.primary} />
                  <Text style={styles.pickBtnText}>Camera</Text>
                </Pressable>
                <Pressable
                  onPress={pickFromGallery}
                  style={[styles.pickBtn, { flex: 1 }]}
                >
                  <Ionicons name="images-outline" size={22} color={Colors.primary} />
                  <Text style={styles.pickBtnText}>Gallery</Text>
                </Pressable>
              </View>
              <Pressable
                onPress={() => {
                  setSavedKey("");
                  setApiKey("");
                  AsyncStorage.removeItem(GEMINI_API_KEY_STORAGE);
                  setStep("key");
                }}
                style={styles.changeKeyBtn}
              >
                <Text style={styles.changeKeyText}>Change API Key</Text>
              </Pressable>
            </View>
          )}

          {step === "loading" && (
            <View style={styles.body}>
              {imageUri && (
                <Image
                  source={{ uri: imageUri }}
                  style={styles.previewThumb}
                  contentFit="contain"
                />
              )}
              <ActivityIndicator
                size="large"
                color={Colors.primary}
                style={{ marginTop: 24 }}
              />
              <Text style={styles.loadingText}>
                Analyzing your timetable...
              </Text>
              <Text style={styles.loadingSubText}>
                Gemini AI is reading the schedule
              </Text>
            </View>
          )}

          {step === "preview" && parsed && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
            >
              <View style={styles.previewHeader}>
                <View style={styles.successBadge}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                  <Text style={styles.successText}>
                    {totalDetected()} lectures detected
                  </Text>
                </View>
                <Text style={styles.previewHint}>
                  Review below, then tap Apply.
                </Text>
              </View>

              {DAYS.map((day) => {
                const lectures = parsed[day] ?? [];
                if (lectures.length === 0) return null;
                return (
                  <View key={day} style={styles.previewDay}>
                    <Text style={styles.previewDayName}>{day}</Text>
                    {lectures.map((l) => {
                      const color =
                        Colors.subjectColors[
                          subjectColorIndex(l.subjectCode || l.subject) %
                            Colors.subjectColors.length
                        ];
                      return (
                        <View
                          key={l.period}
                          style={[
                            styles.previewLecture,
                            { borderLeftColor: color, backgroundColor: color + "18" },
                          ]}
                        >
                          <Text style={[styles.previewCode, { color }]}>
                            P{l.period}  {l.subjectCode}
                          </Text>
                          <Text style={styles.previewName}>{l.subject}</Text>
                          {(!!l.teacher || !!l.venue) && (
                            <Text style={styles.previewMeta}>
                              {[l.teacher, l.venue].filter(Boolean).join("  ·  ")}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                );
              })}

              <Pressable onPress={applyTimetable} style={styles.applyBtn}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.applyBtnText}>Apply to Timetable</Text>
              </Pressable>
              <Pressable
                onPress={() => setStep("pick")}
                style={styles.retryBtn}
              >
                <Text style={styles.retryBtnText}>Scan a Different Image</Text>
              </Pressable>
            </ScrollView>
          )}

          {step === "error" && (
            <View style={styles.body}>
              <Ionicons
                name="alert-circle-outline"
                size={48}
                color={Colors.danger}
                style={{ marginBottom: 12 }}
              />
              <Text style={styles.errorTitle}>Scan Failed</Text>
              <Text style={styles.errorText}>{errorMsg}</Text>
              <Pressable onPress={() => setStep("pick")} style={styles.primaryBtn}>
                <Ionicons name="refresh-outline" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Try Again</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.backgroundMid,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: Colors.border,
    maxHeight: "85%",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.backgroundLight,
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    alignItems: "center",
    gap: 16,
  },
  infoBox: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  infoTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  infoText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  keyInput: {
    width: "100%",
    backgroundColor: Colors.backgroundLight,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  primaryBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
  },
  primaryBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  pickRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  pickBtn: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 20,
    borderRadius: 16,
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
  },
  previewThumb: {
    width: "100%",
    height: 160,
    borderRadius: 14,
    backgroundColor: Colors.backgroundLight,
  },
  changeKeyBtn: {
    paddingVertical: 8,
  },
  changeKeyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    textDecorationLine: "underline",
  },
  loadingText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: Colors.textPrimary,
    marginTop: 12,
  },
  loadingSubText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
  },
  previewHeader: {
    paddingTop: 4,
    paddingBottom: 16,
    gap: 6,
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  successText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: Colors.textPrimary,
  },
  previewHint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
  },
  previewDay: {
    marginBottom: 16,
    gap: 6,
  },
  previewDayName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  previewLecture: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderLeftWidth: 3,
    gap: 2,
  },
  previewCode: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
  },
  previewName: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  previewMeta: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
    opacity: 0.7,
  },
  applyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.success,
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 8,
  },
  applyBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  retryBtn: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 4,
  },
  retryBtnText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
    textDecorationLine: "underline",
  },
  errorTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 8,
  },
});
