import type { Capsule } from "../types";
import {
  PENDING_EXPIRY_MS,
  FORCE_IGNITION_DELAY_MS,
  LAUNCH_TIMEOUT_MS,
} from "../constants/game";

export function formatTimeRemaining(expiresAt: string | null): string {
  if (!expiresAt) return "";
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expiré";
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (hours >= 1) return `Expire dans ${hours}h${minutes > 0 ? minutes.toString().padStart(2, "0") : ""}`;
  return `Expire dans ${minutes}min`;
}

export function formatCountdown(seconds: number): string {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.floor(Math.max(0, seconds) % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function isExpired(capsule: Capsule): boolean {
  if (capsule.status !== "pending" || !capsule.expires_at) return false;
  return new Date(capsule.expires_at).getTime() < Date.now();
}

export function isLaunchTimedOut(capsule: Capsule): boolean {
  if (capsule.status !== "launch_requested" || !capsule.launch_requested_at) return false;
  return Date.now() - new Date(capsule.launch_requested_at).getTime() > LAUNCH_TIMEOUT_MS;
}

export function canForceLaunch(capsule: Capsule): boolean {
  if (capsule.status !== "launch_requested" || !capsule.launch_requested_at) return false;
  return Date.now() - new Date(capsule.launch_requested_at).getTime() > FORCE_IGNITION_DELAY_MS;
}

export function getSecondsUntilForce(capsule: Capsule): number {
  if (capsule.status !== "launch_requested" || !capsule.launch_requested_at) return 0;
  const elapsed = Date.now() - new Date(capsule.launch_requested_at).getTime();
  return Math.max(0, Math.ceil((FORCE_IGNITION_DELAY_MS - elapsed) / 1000));
}

export function getSecondsUntilFallback(capsule: Capsule): number {
  if (capsule.status !== "launch_requested" || !capsule.launch_requested_at) return 0;
  const elapsed = Date.now() - new Date(capsule.launch_requested_at).getTime();
  return Math.max(0, Math.ceil((LAUNCH_TIMEOUT_MS - elapsed) / 1000));
}

export function computeExpiresAt(): string {
  return new Date(Date.now() + PENDING_EXPIRY_MS).toISOString();
}
