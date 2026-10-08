import type { Capsule } from "../types";

export function calculateKarma(capsules: Capsule[], userId: string): number {
  let karma = 0;
  for (const c of capsules) {
    if (c.status !== "active") continue;
    if (c.creditor_id === userId) karma += c.amount;
    if (c.debtor_id === userId) karma -= c.amount;
  }
  return karma;
}

export function calculateKarmaForAll(
  capsules: Capsule[],
  userIds: string[]
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const id of userIds) {
    result[id] = calculateKarma(capsules, id);
  }
  return result;
}

export function calculateAltitude(capsules: Capsule[], userId: string): number {
  let altitude = 0;
  for (const c of capsules) {
    if (c.status !== "resolved") continue;
    if (c.creditor_id === userId) altitude += c.amount;
  }
  return altitude;
}

export function calculateAltitudeForAll(
  capsules: Capsule[],
  userIds: string[]
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const id of userIds) {
    result[id] = calculateAltitude(capsules, id);
  }
  return result;
}
