const NAVY = "#0A1628";
const NAVY_MID = "#0F2040";
const NAVY_LIGHT = "#1A3560";
const ELECTRIC_BLUE = "#3B82F6";
const BRIGHT_BLUE = "#60A5FA";
const ACCENT_CYAN = "#06B6D4";
const ACCENT_GOLD = "#F59E0B";
const SUCCESS = "#10B981";
const WARN = "#EF4444";
const TEXT_WHITE = "#F1F5F9";
const TEXT_MUTED = "#94A3B8";
const CARD_BG = "#1E3A5F";
const BORDER = "#2D4A7A";

export const Colors = {
  background: NAVY,
  backgroundMid: NAVY_MID,
  backgroundLight: NAVY_LIGHT,
  cardBg: CARD_BG,
  border: BORDER,
  primary: ELECTRIC_BLUE,
  primaryLight: BRIGHT_BLUE,
  accent: ACCENT_CYAN,
  gold: ACCENT_GOLD,
  success: SUCCESS,
  danger: WARN,
  textPrimary: TEXT_WHITE,
  textMuted: TEXT_MUTED,
  subjectColors: [
    "#3B82F6",
    "#06B6D4",
    "#8B5CF6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#EC4899",
    "#14B8A6",
  ],
};

export default {
  light: {
    text: TEXT_WHITE,
    background: NAVY,
    tint: ELECTRIC_BLUE,
    tabIconDefault: TEXT_MUTED,
    tabIconSelected: ELECTRIC_BLUE,
  },
};
