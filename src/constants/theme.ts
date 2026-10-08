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
  },
} as const;

export const STATUS_LABELS = {
  pending: "EN ATTENTE",
  active: "EN ORBITE",
  paid: "DÉCAPSULÉ",
} as const;

export const STATUS_COLORS = {
  pending: COLORS.neon.yellow,
  active: COLORS.neon.green,
  paid: COLORS.neon.red,
} as const;
