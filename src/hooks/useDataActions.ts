import { 
  db, 
  auth, 
  collection, 
  addDoc, 
  setDoc, 
  doc, 
  deleteDoc 
} from '../firebase-config';
import { Balances, UserProfile, HistoryItem } from '../types';

export const useDataActions = (balances: Balances, profile: UserProfile | null) => {
  const syncBalances = async (newBalances: Balances) => {
    if (!auth.currentUser) return;
    await setDoc(doc(db, `${auth.currentUser.uid}_balances`, 'data'), newBalances);
  };

  const simpanTransaksi = async (kat: string, nom: number, fee: number, ket: string) => {
    if (!auth.currentUser || !profile) return;
    
    const categories = profile.categories || [];
    const selectedCat = categories.find(c => c.name === kat);
    const role = selectedCat ? selectedCat.role : 'none';

    let newBalances = { ...balances };

    if (role === "bank_out") { 
      newBalances.kas += nom; 
      newBalances.bank -= nom; 
      newBalances.admin += fee; 
      newBalances.sales += nom; 
    }
    else if (role === "cash_in") { 
      newBalances.kas += nom; 
      newBalances.acc += nom; 
    }
    else if (role === "bank_in") { 
      newBalances.kas -= nom; 
      newBalances.bank += nom; 
      newBalances.admin += fee; 
      newBalances.tarik += nom; 
    }

    await addDoc(collection(db, `${auth.currentUser.uid}_history`), { 
      tgl: new Date().toISOString(), 
      kat, 
      ket: ket || kat, 
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

  return {
    simpanTransaksi,
    tambahKasbon,
    bayarKasbon,
    simpanDeposit,
    tambahKontak,
    hapusKontak
  };
};
