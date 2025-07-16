
export interface Delivery {
  id: string; // uuid from supabase
  date: string; // YYYY-MM-DD
  bottles: number;
  month: string; // Dynamically added on client
}

export interface DataProfile {
  id: string; // uuid from supabase
  name: string;
  bottlePrice: number;
  canShareReport: boolean;
  linked_user_id: string | null; // uuid of the auth user
  deliveries: Delivery[];
}

export interface RegisteredUser {
    id: string; // uuid from supabase auth.users
    email: string;
}

export interface AddUserDataPayload {
    name: string; // This is the profile name
    date: string; // YYYY-MM-DD
    bottles: number;
}

export interface Invoice {
  id: string; // uuid from supabase
  profileId: string; // uuid from supabase
  name: string; // Name of the data profile
  amount: number;
  bottlePrice?: number;
  paymentMethod: 'EasyPaisa' | 'JazzCash' | 'Bank Transfer';
  recipientNumber: string;
  createdAt: string; // timestamp with time zone
  month: string;
  deliveries?: Delivery[]; // Joined from deliveries table
}
