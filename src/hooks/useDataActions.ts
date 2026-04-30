import { 
  db, 
  auth, 
  collection, 
  addDoc, 
  setDoc, 
  doc, 
  deleteDoc,
  getDocs,
  query
} from '../firebase-config';
import { Balances, UserProfile, HistoryItem } from '../types';

export const useDataActions = (balances: Balances, profile: UserProfile | null) => {
  const syncBalances = async (newBalances: Balances) => {
    if (!auth.currentUser) return;
    await setDoc(doc(db, `${auth.currentUser.uid}_balances`, 'data'), newBalances);
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
      // Logic: - saldo Bank, + saldo Kas
      newBalances.bank -= nom; 
      newBalances.admin += fee; 
      newBalances.sales += nom; 
    }
    else if (logic === "BANK_IN") { 
      // Logic: - Saldo kas, + Tarik tunai
      newBalances.bank += nom; 
      newBalances.admin += fee; 
      newBalances.tarik += nom; 
    }
    else if (logic === "LABA_ACC") { 
      // Logic: + Laba Acc
      newBalances.acc += nom; 
    }
    else if (logic === "LABA_ADMIN") { 
      // Logic: ADMIN (hanya menambah jumlah pada Laba Admin)
      newBalances.admin += nom; 
    }

    await addDoc(collection(db, `${auth.currentUser.uid}_history`), { 
      tgl: new Date().toISOString(), 
      kat: katName, 
      katId: katId,
      ket: ket || katName, 
      amt: nom, 
      fee 
    });

    await syncBalances(newBalances);
  };

  const tambahKasbon = async (nama: string, nominal: number) => {
    if (!auth.currentUser) return;
    await addDoc(collection(db, `${auth.currentUser.uid}_kasbon`), { 
      nama, 
      nominal, 
      tgl: new Date().toLocaleDateString('id-ID') 
    });
  };

  const bayarKasbon = async (id: string, nominal: number, nama: string) => {
    if (!auth.currentUser) return;
    
    let newBalances = { ...balances };
    newBalances.kas += nominal;

    await addDoc(collection(db, `${auth.currentUser.uid}_history`), { 
      tgl: new Date().toISOString(), 
      kat: 'KASBON', 
      ket: `Pelunasan ${nama}`, 
      amt: nominal 
    });
    
    await deleteDoc(doc(db, `${auth.currentUser.uid}_kasbon`, id));
    await syncBalances(newBalances);
  };

  const simpanDeposit = async (tujuan: 'bank' | 'kas', nominal: number) => {
    if (!auth.currentUser) return;
    
    let newBalances = { ...balances };
    if (tujuan === 'bank') newBalances.bank += nominal; 
    else newBalances.kas += nominal;
    
    newBalances.depo += nominal;

    await addDoc(collection(db, `${auth.currentUser.uid}_history`), { 
      tgl: new Date().toISOString(), 
      kat: 'DEPOSIT', 
      ket: `Topup ${tujuan}`, 
      amt: nominal 
    });

    await syncBalances(newBalances);
  };

  const tambahKontak = async (nama: string, wa: string, catatan: string) => {
    if (!auth.currentUser) return;
    await addDoc(collection(db, `${auth.currentUser.uid}_kontak`), { 
      nama, 
      wa: wa || '-', 
      catatan: catatan || '-',
      createdAt: new Date().toISOString() 
    });
  };

  const hapusKontak = async (id: string) => {
    if (!auth.currentUser) return;
    await deleteDoc(doc(db, `${auth.currentUser.uid}_kontak`, id));
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

    // 1. Reset balances
    await resetBalances();

    // 2. Clear collections (History, Kasbon, Kontak)
    const colNames = ['history', 'kasbon', 'kontak'];
    for (const name of colNames) {
      try {
        const q = query(collection(db, `${uid}_${name}`));
        const snap = await getDocs(q);
        const deletes = snap.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletes);
      } catch (err) {
        console.error(`Gagal menghapus koleksi ${name}:`, err);
      }
    }

    // 3. Reset Profile & Categories to Default
    const defaultCats = [
      { id: 'cat_bank_out', name: 'Transfer Bank', logicType: 'BANK_OUT' },
      { id: 'cat_bank_in', name: 'Tarik Tunai', logicType: 'BANK_IN' },
      { id: 'cat_acc', name: 'Aksesoris', logicType: 'LABA_ACC' },
      { id: 'cat_admin', name: 'Admin/Fee', logicType: 'LABA_ADMIN' }
    ];

    await setDoc(doc(db, `${uid}_profile`, 'data'), {
      toko: 'Toko Baru',
      defaultCategory: 'cat_bank_out',
      categories: defaultCats
    }, { merge: true });

    alert("Semua data telah dihapus. Aplikasi akan memuat ulang.");
    window.location.reload();
  };

  return {
    simpanTransaksi,
    tambahKasbon,
    bayarKasbon,
    simpanDeposit,
    tambahKontak,
    hapusKontak,
    resetBalances,
    resetAllData
  };
};
