
export interface Delivery {
  id: string; // uuid from supabase
  date: string; // YYYY-MM-DD
  bottles: number;
  month: string; // Dynamically added on client
}

// This interface now represents the 'users' table which holds all customer info.
export interface UserProfile {
  id: string; // uuid from supabase, links to auth.users
  name: string;
  email?: string; // This is now optional as it's fetched from auth.users
  bottlePrice: number;
  canShareReport: boolean;
  deliveries: Delivery[];
  invoices?: Invoice[]; // Now includes invoices for customer dashboard
}

export interface AddUserDataPayload {
    name: string; // This is the user's name
    date: string; // YYYY-MM-DD
    bottles: number;
}

export interface Invoice {
  id: string; // uuid from supabase
  userId: string; // uuid from supabase, references users table
  name: string; // Name of the user
  amount: number;
  bottlePrice?: number;
  paymentMethod: 'EasyPaisa' | 'JazzCash' | 'Bank Transfer';
  paymentStatus?: 'paid' | 'not_paid_yet';
  recipientNumber: string;
  createdAt: string; // timestamp with time zone
  month: string;
  deliveries?: Delivery[]; // Joined from deliveries table
}

    