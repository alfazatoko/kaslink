import { auth } from '../services/firebase';
import { Balances, UserProfile, HistoryItem } from '../types';
import {
  addHistory,
  deleteHistory,
  updateHistory,
  addKasbon,
  deleteKasbon,
  addKontak,
  deleteKontak,
  upsertRekapHarian,
  deleteHistoryByUser,
  deleteKasbonByUser,
  deleteKontakByUser,
  upsertProfile
} from '../services/supabase';

export const useDataActions = (balances: Balances, profile: UserProfile | null) => {
  const syncBalances = async (newBalances: Balances) => {
    if (!auth.currentUser) return;
    const todayStr = new Date().toISOString().split('T')[0];
    await upsertRekapHarian(auth.currentUser.uid, todayStr, newBalances);
  };

  const simpanTransaksi = async (katId: string, nom: number, fee: number, ket: string) => {
    if (!auth.currentUser || !profile) return;
    
    const categories = profile.categories || [];
    const selectedCat = categories.find(c => c.id === katId);
    if (!selectedCat) throw new Error("Kategori tidak ditemukan");

    const logic = selectedCat.logicType;
    const katName = selectedCat.name;

    let newBalances = { ...balances };

    if (logic === "BANK_OUT") { 
      newBalances.bank -= nom; 
      newBalances.admin += fee; 
      newBalances.sales += nom; 
    }
    else if (logic === "BANK_IN") { 
      newBalances.bank += nom; 
      newBalances.admin += fee; 
      newBalances.tarik += nom; 
    }
    else if (logic === "LABA_ACC") { 
      newBalances.acc += nom; 
    }
    else if (logic === "LABA_ADMIN") { 
      newBalances.admin += nom; 
    }

    await addHistory(auth.currentUser.uid, { 
      tgl: new Date().toISOString(), 
      kat: katName, 
      katId: katId,
      ket: ket || katName, 
      amt: nom, 
      fee,
      balBank: newBalances.bank,
      balKas: newBalances.sales + newBalances.admin + newBalances.acc - newBalances.tarik
    });

    await syncBalances(newBalances);
  };

  const editTransaksi = async (
    oldItem: HistoryItem,
    katId: string,
    nom: number,
    fee: number,
    ket: string
  ) => {
    if (!auth.currentUser || !profile || !oldItem.id) return;

    const categories = profile.categories || [];
    const oldCat = categories.find(c => c.id === oldItem.katId || c.name === oldItem.kat);
    const newCat = categories.find(c => c.id === katId);
    if (!newCat) throw new Error("Kategori tidak ditemukan");

    let newBalances = { ...balances };

    // Reverse old transaction
    if (oldCat) {
      const oldLogic = oldCat.logicType;
      if (oldLogic === "BANK_OUT") { newBalances.bank += oldItem.amt; newBalances.admin -= (oldItem.fee || 0); newBalances.sales -= oldItem.amt; }
      else if (oldLogic === "BANK_IN") { newBalances.bank -= oldItem.amt; newBalances.admin -= (oldItem.fee || 0); newBalances.tarik -= oldItem.amt; }
      else if (oldLogic === "LABA_ACC") { newBalances.acc -= oldItem.amt; }
      else if (oldLogic === "LABA_ADMIN") { newBalances.admin -= oldItem.amt; }
    } else if (oldItem.kat === 'KASBON') {
      newBalances.kas -= oldItem.amt;
    } else if (oldItem.kat === 'DEPOSIT') {
      // Can't reverse deposit easily, skip
    }

    // Apply new transaction
    const newLogic = newCat.logicType;
    if (newLogic === "BANK_OUT") { newBalances.bank -= nom; newBalances.admin += fee; newBalances.sales += nom; }
    else if (newLogic === "BANK_IN") { newBalances.bank += nom; newBalances.admin += fee; newBalances.tarik += nom; }
    else if (newLogic === "LABA_ACC") { newBalances.acc += nom; }
    else if (newLogic === "LABA_ADMIN") { newBalances.admin += nom; }

    await updateHistory(oldItem.id, {
      kat: newCat.name,
      katId,
      ket: ket || newCat.name,
      amt: nom,
      fee,
    });

    await syncBalances(newBalances);
  };

  const hapusHistory = async (item: HistoryItem) => {
    if (!auth.currentUser || !profile || !item.id) return;

    const categories = profile.categories || [];
    const cat = categories.find(c => c.id === item.katId || c.name === item.kat);

    let newBalances = { ...balances };

    // Reverse transaction effect
    if (cat) {
      const logic = cat.logicType;
      if (logic === "BANK_OUT") { newBalances.bank += item.amt; newBalances.admin -= (item.fee || 0); newBalances.sales -= item.amt; }
      else if (logic === "BANK_IN") { newBalances.bank -= item.amt; newBalances.admin -= (item.fee || 0); newBalances.tarik -= item.amt; }
      else if (logic === "LABA_ACC") { newBalances.acc -= item.amt; }
      else if (logic === "LABA_ADMIN") { newBalances.admin -= item.amt; }
    }

    await deleteHistory(item.id);
    await syncBalances(newBalances);
  };

  const tambahKasbon = async (nama: string, nominal: number) => {
    if (!auth.currentUser) return;
    await addKasbon(auth.currentUser.uid, { 
      nama, 
      nominal, 
      tgl: new Date().toLocaleDateString('id-ID') 
    });
  };

  const bayarKasbon = async (id: string, nominal: number, nama: string) => {
    if (!auth.currentUser) return;
    
    let newBalances = { ...balances };
    // Pelunasan kasbon masuk ke kas tunai (sales)
    newBalances.sales += nominal;

    await addHistory(auth.currentUser.uid, { 
      tgl: new Date().toISOString(), 
      kat: 'KASBON', 
      ket: `Pelunasan ${nama}`, 
      amt: nominal,
      balBank: newBalances.bank,
      balKas: newBalances.sales + newBalances.admin + newBalances.acc - newBalances.tarik
    });
    
    await deleteKasbon(id);
    await syncBalances(newBalances);
  };

  const simpanDeposit = async (tujuan: 'bank' | 'kas', nominal: number) => {
    if (!auth.currentUser) return;
    
    let newBalances = { ...balances };
    if (tujuan === 'bank') newBalances.bank += nominal; 
    else newBalances.sales += nominal;   // deposit kas masuk ke sales agar terhitung di saldo kas
    
    newBalances.depo += nominal;

    await addHistory(auth.currentUser.uid, { 
      tgl: new Date().toISOString(), 
      kat: 'DEPOSIT', 
      ket: `Topup ${tujuan}`, 
      amt: nominal,
      balBank: newBalances.bank,
      balKas: newBalances.sales + newBalances.admin + newBalances.acc - newBalances.tarik
    });

    await syncBalances(newBalances);
  };

  const tambahKontak = async (nama: string, wa: string, catatan: string) => {
    if (!auth.currentUser) return;
    await addKontak(auth.currentUser.uid, { 
      nama, 
      wa: wa || '-', 
      catatan: catatan || '-',
      createdAt: new Date().toISOString() 
    });
  };

  const hapusKontak = async (id: string) => {
    if (!auth.currentUser) return;
    await deleteKontak(id);
  };

  const resetBalances = async () => {
    if (!auth.currentUser) return;
    const zeroBalances: Balances = {
      bank: 0, kas: 0, admin: 0, acc: 0, tarik: 0, depo: 0, sales: 0
    };
    await syncBalances(zeroBalances);
  };

  const resetAllData = async () => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    await resetBalances();

    await Promise.all([
      deleteHistoryByUser(uid),
      deleteKasbonByUser(uid),
      deleteKontakByUser(uid),
    ]);

    const defaultCats = [
      { id: 'cat_bank_out', name: 'Transfer Bank', logicType: 'BANK_OUT' as const },
      { id: 'cat_bank_in', name: 'Tarik Tunai', logicType: 'BANK_IN' as const },
      { id: 'cat_acc', name: 'Aksesoris', logicType: 'LABA_ACC' as const },
      { id: 'cat_admin', name: 'Admin/Fee', logicType: 'LABA_ADMIN' as const }
    ];

    await upsertProfile(uid, {
      toko: 'Toko Baru',
      defaultCategory: 'cat_bank_out',
      categories: defaultCats
    });

    alert("Semua data telah dihapus. Aplikasi akan memuat ulang.");
    window.location.reload();
  };

  return {
    simpanTransaksi,
    editTransaksi,
    hapusHistory,
    tambahKasbon,
    bayarKasbon,
    simpanDeposit,
    tambahKontak,
    hapusKontak,
    resetBalances,
    resetAllData
  };
};
