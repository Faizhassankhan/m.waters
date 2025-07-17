
export interface Delivery {
  id: string; // uuid from supabase
  date: string; // YYYY-MM-DD
  bottles: number;
  month: string; // Dynamically added on client
}

export interface MonthlyStatus {
  month: number; // 0-11
  year: number;
  status: 'paid' | 'not_paid_yet';
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
  monthlyStatuses: MonthlyStatus[];
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
  recipientNumber: string;
  createdAt: string; // timestamp with time zone
  month: string;
  deliveries?: Delivery[]; // Joined from deliveries table
}
