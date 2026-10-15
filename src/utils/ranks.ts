export interface OrbitalRank {
  name: string;
  emoji: string;
  color: string;
  minAltitude: number;
  nextAltitude: number | null;
}

export const ORBITAL_RANKS: OrbitalRank[] = [
  { name: "Sur Terre", emoji: "🌍", color: "#00F0FF", minAltitude: 0, nextAltitude: 1 },
  { name: "Décollage", emoji: "🚀", color: "#00FF66", minAltitude: 1, nextAltitude: 3 },
  { name: "Orbite basse", emoji: "🛰️", color: "#4ade80", minAltitude: 3, nextAltitude: 6 },
  { name: "Orbite haute", emoji: "🌟", color: "#FFD60A", minAltitude: 6, nextAltitude: 10 },
  { name: "Station spatiale", emoji: "🔭", color: "#FF6B1A", minAltitude: 10, nextAltitude: 15 },
  { name: "Voyage lunaire", emoji: "🌙", color: "#fbbf24", minAltitude: 15, nextAltitude: 20 },
  { name: "Exploration martienne", emoji: "🔴", color: "#FF3B30", minAltitude: 20, nextAltitude: null },
];

export function getRank(altitude: number): OrbitalRank {
  let rank = ORBITAL_RANKS[0];
  for (const r of ORBITAL_RANKS) {
    if (altitude >= r.minAltitude) {
      rank = r;
    }
  }
  return rank;
}

export function getNextRank(altitude: number): OrbitalRank | null {
  for (const r of ORBITAL_RANKS) {
    if (r.minAltitude > altitude) {
      return r;
    }
  }
  return null;
}

export function getProgressToNext(altitude: number): number {
  const current = getRank(altitude);
  const next = getNextRank(altitude);
  if (!next || !current.nextAltitude) return 100;
  const range = current.nextAltitude - current.minAltitude;
  const progress = altitude - current.minAltitude;
  return Math.min(100, (progress / range) * 100);
}
