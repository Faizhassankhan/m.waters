
export interface Delivery {
  id: string; // uuid from supabase
  date: string; // YYYY-MM-DD
  bottles: number;
}

export interface MonthlyStatus {
    month: number;
    year: number;
    status: 'paid' | 'not_paid_yet';
}

export interface BillingRecord {
    id?: string;
    user_id: string;
    month: number;
    year: number;
    amount_paid: number;
    total_bill: number;
    created_at: string;
}

// This interface now represents the 'users' table which holds all customer info.
export interface UserProfile {
  id: string; // uuid from supabase, links to auth.users
  name: string;
  email?: string; // This is now optional as it's fetched from auth.users
  bottlePrice: number;
  canShareReport: boolean;
  deliveries: Delivery[];
  invoices?: Invoice[];
  monthlyStatuses: MonthlyStatus[];
  billingRecords: BillingRecord[];
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
  year: number;
  deliveries?: Delivery[]; // Joined from deliveries table
  previousBalance?: number;
}

export interface Feedback {
  id: string;
  created_at: string;
  user_id: string;
  user_name: string;
  feedback_text: string;
}

    