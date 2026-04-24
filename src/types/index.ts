export interface UserProfile {
  email: string;
  phone: string;
  toko: string;
  defaultCategory: string;
  categories: Category[];
}

export interface Category {
  name: string;
  role: 'bank_out' | 'bank_in' | 'cash_in' | 'none';
}

export interface Balances {
  bank: number;
  kas: number;
  admin: number;
  acc: number;
  tarik: number;
  depo: number;
  sales: number;
}

export interface HistoryItem {
  id?: string;
  tgl: string;
  kat: string;
  ket: string;
  amt: number;
  fee?: number;
}

export interface Kasbon {
  id?: string;
  nama: string;
  nominal: number;
  tgl: string;
}

export interface Kontak {
  id?: string;
  nama: string;
  wa: string;
  catatan: string;
  createdAt: string;
}
