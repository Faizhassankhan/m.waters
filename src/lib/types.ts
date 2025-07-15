export interface Delivery {
  id: string;
  month: string;
  date: string;
  bottles: number;
}

export interface UserData {
  name: string;
  deliveries: Delivery[];
}

export interface Invoice {
  id: string;
  name: string;
  amount: number;
  paymentMethod: 'EasyPaisa' | 'JazzCash' | 'Bank Transfer';
  recipientNumber: string;
  createdAt: string;
  month: string;
  deliveries?: Delivery[];
}
