import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { auth, onAuthStateChanged } from './services/firebase';
import {
  supabase,
  getProfile,
  getRekapHarian,
  getHistory,
  getKasbon,
  getKontak,
  subscribeProfile,
  subscribeBalances,
} from './services/supabase';
import { User } from 'firebase/auth';
import { UserProfile, Balances, HistoryItem, Kasbon, Kontak } from './types';
import Header from './components/Layout/Header';
import BottomNav from './components/Layout/BottomNav';
import Dashboard from './components/Pages/Dashboard';
import HistoryPage from './components/Pages/HistoryPage';
import ReportsPage from './components/Pages/ReportsPage';
import AccountPage from './components/Pages/AccountPage';
import AuthPanel from './components/Auth/AuthPanel';
import { useDataActions } from './hooks/useDataActions';

import TransactionModal from './components/Modals/TransactionModal';
import KasbonModal from './components/Modals/KasbonModal';
import DepositModal from './components/Modals/DepositModal';
import KontakModal from './components/Modals/KontakModal';
// ============================================================
// Error Boundary — menangkap crash React dan tampilkan pesan
// ============================================================
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App Error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '30px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#dc2626' }}>⚠️ Terjadi Error</h2>
          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px', maxWidth: '400px', margin: '0 auto 20px' }}>
            {this.state.error}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 }}
          >
            Muat Ulang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================
// Helper: subscribe realtime changes
// ============================================================
function subscribeToChanges(table: string, uid: string, onRefresh: () => void): () => void {
  const channel = supabase
    .channel(`${table}-${uid}-${Date.now()}`)
    .on(
      'postgres_changes' as any,
      { event: '*', schema: 'public', table, filter: `user_id=eq.${uid}` },
      () => { onRefresh(); }
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

// ============================================================
// Main App Component
// ============================================================
const AppInner: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'beranda' | 'riwayat' | 'laporan' | 'akun'>('beranda');
  const [modalType, setModalType] = useState<'transaksi' | 'kasbon' | 'deposit' | 'kontak' | 'rincian_bank' | 'rincian_kas' | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [balances, setBalances] = useState<Balances>({
    bank: 0, kas: 0, admin: 0, acc: 0, tarik: 0, depo: 0, sales: 0
  });
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [kasbon, setKasbon] = useState<Kasbon[]>([]);
  const [kontak, setKontak] = useState<Kontak[]>([]);

  const {
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
  } = useDataActions(balances, profile);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setBalances({ bank: 0, kas: 0, admin: 0, acc: 0, tarik: 0, depo: 0, sales: 0 });
        setHistory([]);
        setKasbon([]);
        setKontak([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Data loader
  useEffect(() => {
    if (!user) return;

    const uid = user.uid;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const startOfToday = todayStart.toISOString();

    const loadData = async () => {
      try {
        const prof = await getProfile(uid);
        setProfile(prof);
      } catch (err) { console.error('Gagal memuat profil:', err); }

      try {
        const bal = await getRekapHarian(uid, todayStr);
        if (bal) setBalances(bal);
      } catch (err) { console.error('Gagal memuat saldo:', err); }

      try {
        const hist = await getHistory(uid, startOfToday, 500);
        setHistory(hist);
      } catch (err) { console.error('Gagal memuat history:', err); }

      try {
        const kb = await getKasbon(uid);
        setKasbon(kb);
      } catch (err) { console.error('Gagal memuat kasbon:', err); }

      try {
        const kt = await getKontak(uid);
        setKontak(kt);
      } catch (err) { console.error('Gagal memuat kontak:', err); }
    };

    loadData();

    // Realtime subscriptions
    const unsubProfile = subscribeProfile(uid, (p) => {
      setProfile(p);
    });

    const unsubBalances = subscribeBalances(uid, todayStr, (b) => {
      if (b) setBalances(b);
    });

    const refreshHistory = async () => {
      try { setHistory(await getHistory(uid, startOfToday, 500)); } catch {}
    };
    const refreshKasbon = async () => {
      try { setKasbon(await getKasbon(uid)); } catch {}
    };
    const refreshKontak = async () => {
      try { setKontak(await getKontak(uid)); } catch {}
    };

    const unsubHistory = subscribeToChanges('history', uid, refreshHistory);
    const unsubKasbon = subscribeToChanges('kasbon', uid, refreshKasbon);
    const unsubKontak = subscribeToChanges('kontak', uid, refreshKontak);

    return () => {
      unsubProfile();
      unsubBalances();
      unsubHistory();
      unsubKasbon();
      unsubKontak();
    };
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Memuat KINK...</p>
      </div>
    );
  }

  if (!user) return <AuthPanel />;

  const tId = profile?.colors?.theme || 'blue';
  let themeColor = '#2563eb';
  let appBg = '#f8fafc';
  let cardBg = '#ffffff';
  let textCol = '#1e293b';
  let textMut = '#64748b';
  let borderCol = '#e2e8f0';

  if (tId === 'emerald') {
    themeColor = '#10b981';
    appBg = '#f0fdf4';
  } else if (tId === 'dark') {
    themeColor = '#3b82f6';
    appBg = '#0f172a';
    cardBg = '#1e293b';
    textCol = '#f8fafc';
    textMut = '#94a3b8';
    borderCol = '#334155';
  } else if (tId === 'gold') {
    themeColor = '#d97706';
    appBg = '#fffbeb';
  } else if (tId.startsWith('#')) {
    themeColor = tId;
    appBg = profile?.colors?.appBg || '#f8fafc';
  }

  return (
    <div className="app-container">
      <style>{`
        :root {
          --accent: ${themeColor} !important;
          --accent-light: ${themeColor}15 !important;
          --bg: ${appBg} !important;
          --container-bg: ${appBg} !important;
          --card: ${cardBg} !important;
          --text: ${textCol} !important;
          --text-muted: ${textMut} !important;
          --border: ${borderCol} !important;
        }
        body { background-color: ${appBg} !important; color: ${textCol} !important; }
        .app-container { background-color: ${appBg} !important; }
        .btn-submit, .fab-btn {
          background: var(--accent) !important;
          box-shadow: 0 4px 12px ${themeColor}40 !important;
          color: white !important;
        }
        .nav-item.active { color: var(--accent) !important; }
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
            onSimpanTransaksi={simpanTransaksi}
            onTambahKasbon={tambahKasbon}
            onBayarKasbon={bayarKasbon}
            onSimpanDeposit={simpanDeposit}
            onTambahKontak={tambahKontak}
            onHapusKontak={hapusKontak}
          />
        )}
        {activeView === 'riwayat' && (
          <HistoryPage
            history={history}
            profile={profile}
            balances={balances}
            onEdit={editTransaksi}
            onDelete={hapusHistory}
            onBack={() => setActiveView('beranda')}
          />
        )}
        {activeView === 'laporan' && (
          <ReportsPage
            history={history}
            profile={profile}
            balances={balances}
            onBack={() => setActiveView('beranda')}
          />
        )}
        {activeView === 'akun' && (
          <AccountPage
            profile={profile}
            balances={balances}
            onBack={() => setActiveView('beranda')}
            onResetBalances={resetBalances}
            onResetAllData={resetAllData}
          />
        )}
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

      <BottomNav
        activeView={activeView}
        setActiveView={setActiveView}
        onFabClick={() => setModalType('transaksi')}
      />


    </div>
  );
};

// Bungkus dengan ErrorBoundary
const App: React.FC = () => (
  <ErrorBoundary>
    <AppInner />
  </ErrorBoundary>
);

export default App;
