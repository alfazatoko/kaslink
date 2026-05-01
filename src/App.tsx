import React, { useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  onAuthStateChanged, 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy, 
  limit 
} from './services/firebase';
import { User } from 'firebase/auth';
import { UserProfile, Balances, HistoryItem, Kasbon, Kontak } from './types';

// Components
import Header from './components/Layout/Header';
import BottomNav from './components/Layout/BottomNav';
import Dashboard from './components/Pages/Dashboard';
import HistoryPage from './components/Pages/HistoryPage';
import ReportsPage from './components/Pages/ReportsPage';
import AccountPage from './components/Pages/AccountPage';
import AuthPanel from './components/Auth/AuthPanel';
import { useDataActions } from './hooks/useDataActions';

// Modals
import TransactionModal from './components/Modals/TransactionModal';
import KasbonModal from './components/Modals/KasbonModal';
import DepositModal from './components/Modals/DepositModal';
import KontakModal from './components/Modals/KontakModal';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'beranda' | 'riwayat' | 'laporan' | 'akun'>('beranda');
  
  // Global Data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [balances, setBalances] = useState<Balances>({
    bank: 0, kas: 0, admin: 0, acc: 0, tarik: 0, depo: 0, sales: 0
  });
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [kasbon, setKasbon] = useState<Kasbon[]>([]);
  const [kontak, setKontak] = useState<Kontak[]>([]);

  const { 
    simpanTransaksi, 
    tambahKasbon, 
    bayarKasbon, 
    simpanDeposit, 
    tambahKontak, 
    hapusKontak 
  } = useDataActions(balances, profile);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const uid = user.uid;

    // Listen to Profile
    const unsubProfile = onSnapshot(doc(db, `${uid}_profile`, 'data'), (snap) => {
      if (snap.exists()) setProfile(snap.data() as UserProfile);
    });

    // Listen to Balances
    const unsubBalances = onSnapshot(doc(db, `${uid}_balances`, 'data'), (snap) => {
      if (snap.exists()) setBalances(snap.data() as Balances);
    });

    // Listen to History
    const qHistory = query(collection(db, `${uid}_history`), orderBy('tgl', 'desc'), limit(500));
    const unsubHistory = onSnapshot(qHistory, (snap) => {
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() } as HistoryItem)));
    });

    // Listen to Kasbon
    const unsubKasbon = onSnapshot(collection(db, `${uid}_kasbon`), (snap) => {
      setKasbon(snap.docs.map(d => ({ id: d.id, ...d.data() } as Kasbon)));
    });

    // Listen to Kontak
    const unsubKontak = onSnapshot(collection(db, `${uid}_kontak`), (snap) => {
      setKontak(snap.docs.map(d => ({ id: d.id, ...d.data() } as Kontak)));
    });

    return () => {
      unsubProfile();
      unsubBalances();
      unsubHistory();
      unsubKasbon();
      unsubKontak();
    };
  }, [user]);

  const [modalType, setModalType] = useState<'transaksi' | 'kasbon' | 'deposit' | 'kontak' | 'rincian_bank' | 'rincian_kas' | null>(null);

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  if (!user) return <AuthPanel />;

  const themeColor = profile?.colors?.theme || '#2563eb';
  const appBg = profile?.colors?.appBg || '#f8fafc';

  return (
    <div className="app-container">
      <style>{`
        :root {
          --accent: ${themeColor} !important;
          --accent-light: ${themeColor}15 !important;
          --bg: ${appBg} !important;
        }
        body {
          background-color: ${appBg} !important;
        }
        .app-container {
          background-color: ${appBg} !important;
        }
        .btn-submit, .fab-btn {
          background: var(--accent) !important;
          box-shadow: 0 4px 12px ${themeColor}40 !important;
        }
        .nav-item.active {
          color: var(--accent) !important;
        }
      `}</style>
      <Header profile={profile} />
      
      <main className="container">
        {activeView === 'beranda' && (
          <Dashboard 
            balances={balances} 
            profile={profile} 
            history={history} 
            kasbon={kasbon}
            kontak={kontak}
            modalType={modalType}
            setModalType={setModalType}
          />
        )}
        {activeView === 'riwayat' && <HistoryPage history={history} profile={profile} onBack={() => setActiveView('beranda')} />}
        {activeView === 'laporan' && <ReportsPage history={history} profile={profile} onBack={() => setActiveView('beranda')} />}
        {activeView === 'akun' && <AccountPage profile={profile} balances={balances} onBack={() => setActiveView('beranda')} />}
      </main>

      {/* Global Modals */}
      <TransactionModal 
        isOpen={modalType === 'transaksi'} 
        onClose={() => setModalType(null)} 
        profile={profile}
        onSave={simpanTransaksi}
      />

      <KasbonModal 
        isOpen={modalType === 'kasbon'} 
        onClose={() => setModalType(null)} 
        kasbonList={kasbon}
        onAdd={tambahKasbon}
        onPay={bayarKasbon}
      />

      <DepositModal 
        isOpen={modalType === 'deposit'} 
        onClose={() => setModalType(null)} 
        onSave={simpanDeposit}
      />

      <KontakModal 
        isOpen={modalType === 'kontak'} 
        onClose={() => setModalType(null)} 
        kontakList={kontak}
        onAdd={tambahKontak}
        onDelete={hapusKontak}
      />

      <BottomNav activeView={activeView} setActiveView={setActiveView} onFabClick={() => setModalType('transaksi')} />
    </div>
  );
};

export default App;
