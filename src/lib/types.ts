
export interface Delivery {
  id: string; // uuid from supabase
  date: string; // YYYY-MM-DD
  bottles: number;
  month: string; // Dynamically added on client
}

export interface UserData {
  id: string; // uuid from supabase
  name: string;
  bottlePrice: number;
  canShareReport: boolean;
  deliveries: Delivery[];
}

export interface AddUserDataPayload {
    name: string;
    date: string; // YYYY-MM-DD
    bottles: number;
}

export interface Invoice {
  id: string; // uuid from supabase
  userId: string; // uuid from supabase
  name: string; // Joined from users table
  amount: number;
  bottlePrice?: number;
  paymentMethod: 'EasyPaisa' | 'JazzCash' | 'Bank Transfer';
  recipientNumber: string;
  createdAt: string; // timestamp with time zone
  month: string;
  deliveries?: Delivery[]; // Joined from deliveries table
}

    