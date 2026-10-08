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
} as const;

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
