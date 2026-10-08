export interface UserProfile {
  id: string;
  pseudo: string;
  avatar_url: string;
  solde_global: number;
}

export type CapsuleStatus = "pending" | "active" | "pending_launch" | "resolved";

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
}

export interface CapsuleTicket {
  id: string;
  from_user: string;
  to_user: string;
  motif: string;
  status: "pending" | "active" | "paid";
  created_at: string;
}
