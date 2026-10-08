export const COLORS = {
  space: {
    deep: "#0D0D11",
    surface: "#1A1A24",
    card: "#22222E",
    border: "#2E2E3A",
  },
  neon: {
    green: "#00FF66",
    greenDark: "#00CC52",
    greenDim: "#009940",
    red: "#FF3B30",
    redDark: "#CC2F26",
    yellow: "#FFD60A",
    cyan: "#00F0FF",
    orange: "#FF6B1A",
    orangeDark: "#CC5515",
  },
  earth: {
    blue: "#1B4D8C",
    dark: "#0A2A4A",
    green: "#2A7F3E",
  },
  cartoon: {
    bg: "#f8f9fa",
    white: "#ffffff",
    green: "#4ade80",
    red: "#f87171",
    orange: "#f97316",
    yellow: "#fbbf24",
    cyan: "#06b6d4",
    grey: "#9ca3af",
    amber: "#92400e",
    steel: "#0891b2",
    black: "#000000",
  },
} as const;

export const HARD_SHADOW_LG = "shadow-[4px_6px_0px_0px_rgba(0,0,0,1)]";
export const HARD_SHADOW_MD = "shadow-[2px_4px_0px_0px_rgba(0,0,0,1)]";
export const HARD_SHADOW_SM = "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";

export const STATUS_LABELS = {
  pending: "EN ATTENTE",
  active: "CARBURANT",
  pending_launch: "DÉCOLLAGE...",
  resolved: "DÉCOLLÉ",
} as const;

export const STATUS_COLORS = {
  pending: COLORS.neon.yellow,
  active: COLORS.neon.green,
  pending_launch: COLORS.neon.orange,
  resolved: COLORS.neon.cyan,
} as const;

export const DRINK_TYPES = [
  "Get 27",
  "Pinte",
  "Demousseur",
  "Shot",
  "Verre de vin",
  "Café",
] as const;
