export interface UserProfile {
  id: string;
  pseudo: string;
  avatar_url: string;
  solde_global: number;
}

export interface CapsuleTicket {
  id: string;
  from_user: string;
  to_user: string;
  motif: string;
  status: 'pending' | 'active' | 'paid';
  created_at: string;
}
