import type { Capsule } from "../types";

export function calculateKarma(capsules: Capsule[], userId: string): number {
  let karma = 0;
  for (const c of capsules) {
    if (c.status !== "active") continue;
    if (c.creditor_id === userId) karma += 1;
    if (c.debtor_id === userId) karma -= 1;
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
    if (c.creditor_id === userId) altitude += 1;
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
