export interface UserProfile {
  id: string;
  pseudo: string;
  avatar_url: string;
  solde_global: number;
}

export type CapsuleStatus =
  | "pending"
  | "active"
  | "launch_requested"
  | "resolved"
  | "rejected"
  | "expired";

export type CapsuleResolution = "validated" | "forced" | null;

export interface Capsule {
  id: string;
  creditor_id: string;
  debtor_id: string;
  drink_type: string;
  amount: number;
  reason: string;
  status: CapsuleStatus;
  created_at: string;
  resolved_at: string | null;
  expires_at: string | null;
  launch_requested_at: string | null;
  resolution: CapsuleResolution;
}
