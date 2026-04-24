import React from 'react';
import { Balances, UserProfile, HistoryItem, Kasbon, Kontak } from '../types';
import { Wallet, Landmark, Phone } from 'lucide-react';
import { useDataActions } from '../hooks/useDataActions';

// Modals
import TransactionModal from './Modals/TransactionModal';
import KasbonModal from './Modals/KasbonModal';
import DepositModal from './Modals/DepositModal';
import KontakModal from './Modals/KontakModal';
import Modal from './Modal';

interface DashboardProps {
  balances: Balances;
  profile: UserProfile | null;
  history: HistoryItem[];
  kasbon: Kasbon[];
  kontak: Kontak[];
  modalType: 'transaksi' | 'kasbon' | 'deposit' | 'kontak' | 'rincian_bank' | 'rincian_kas' | null;
  setModalType: (type: 'transaksi' | 'kasbon' | 'deposit' | 'kontak' | 'rincian_bank' | 'rincian_kas' | null) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  balances, 
  profile, 
  kasbon, 
  kontak, 
  modalType, 
  setModalType 
}) => {
  const { 
    simpanTransaksi, 
    tambahKasbon, 
    bayarKasbon, 
    simpanDeposit, 
    tambahKontak, 
    hapusKontak 
  } = useDataActions(balances, profile);

  const formatRp = (v: number) => 'Rp ' + (v || 0).toLocaleString('id-ID');

  // Rumus Kas Tunai: Sales + Admin + Acc - Withdrawals
  const totalKasDisplay = balances.sales + balances.admin + balances.acc - balances.tarik;

  return (
    <div id="view-beranda">
      <div className="balance-card card-blue">
        <div className="card-label">
          Saldo Bank 
          <span className="rincian-btn" onClick={() => setModalType('rincian_bank')}>Rincian</span>
        </div>
        <div className="card-value">{formatRp(balances.bank)}</div>
      </div>
      
      <div className="balance-card card-green">
        <div className="card-label">
          Saldo Kas Tunai 
          <span className="rincian-btn" onClick={() => setModalType('rincian_kas')}>Rincian</span>
        </div>
        <div className="card-value">{formatRp(totalKasDisplay)}</div>
      </div>

      <div className="quick-actions">
        <div className="qa-btn" onClick={() => setModalType('kasbon')}>
          <Wallet size={16} /> KASBON
        </div>
        <div className="qa-btn" onClick={() => setModalType('deposit')}>
          <Landmark size={16} /> DEPOSIT
        </div>
        <div className="qa-btn" onClick={() => setModalType('kontak')}>
          <Phone size={16} /> KONTAK
        </div>
      </div>

      <div className="laba-grid">
        <div className="laba-card">
          <div className="laba-label">📊 LABA ADMIN</div>
          <div className="laba-value">{formatRp(balances.admin)}</div>
        </div>
        <div className="laba-card">
          <div className="laba-label">🎧 LABA ACC</div>
          <div className="laba-value">{formatRp(balances.acc)}</div>
        </div>
        <div className="laba-card">
          <div className="laba-label">🏧 TARIK TUNAI</div>
          <div className="laba-value">{formatRp(balances.tarik)}</div>
        </div>
        <div className="laba-card">
          <div className="laba-label">📈 TOTAL DEPOSIT</div>
          <div className="laba-value">{formatRp(balances.depo)}</div>
        </div>
      </div>

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

      {/* Rincian Modals */}
      <Modal isOpen={modalType === 'rincian_bank'} onClose={() => setModalType(null)} title="🏦 Riwayat Deposit">
        <div style={{ padding: '10px' }}>
          <p>Total Deposit: {formatRp(balances.depo)}</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px' }}>Fitur rincian mendalam sedang dikembangkan.</p>
        </div>
      </Modal>

      <Modal isOpen={modalType === 'rincian_kas'} onClose={() => setModalType(null)} title="💵 Rincian Kas Tunai">
        <div style={{ padding: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Penjualan (Sales):</span>
            <strong>{formatRp(balances.sales)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Laba Admin:</span>
            <strong>{formatRp(balances.admin)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Laba Acc:</span>
            <strong>{formatRp(balances.acc)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            <span>Tarik Tunai:</span>
            <strong style={{ color: 'var(--danger)' }}>-{formatRp(balances.tarik)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '16px', fontWeight: 800 }}>
            <span>Total Kas:</span>
            <strong style={{ color: 'var(--success)' }}>{formatRp(totalKasDisplay)}</strong>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
