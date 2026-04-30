export interface UserProfile {
  email: string;
  phone: string;
  toko: string;
  defaultCategory: string;
  categories: Category[];
}

export interface Category {
  id: string;
  name: string;
  logicType: 'BANK_OUT' | 'BANK_IN' | 'LABA_ACC' | 'LABA_ADMIN' | 'NONE';
  role?: string; // Keep for backward compatibility if needed, but we'll use logicType
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
  katId?: string;
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
