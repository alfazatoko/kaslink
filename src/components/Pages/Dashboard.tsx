import React, { useState } from 'react';
import { Balances, UserProfile, HistoryItem, Kasbon, Kontak } from '../../types';
import { Wallet, Landmark, Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDataActions } from '../../hooks/useDataActions';
import { formatRp } from '../../utils/formatters';

// Modals
import Modal from '../Common/Modal';

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
  history,
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

  const [filterDate, setFilterDate] = useState(new Date());

  // Rumus Kas Tunai: Sales + Admin + Acc - Withdrawals
  const totalKasDisplay = balances.sales + balances.admin + balances.acc - balances.tarik;

  const changeDate = (days: number) => {
    const newDate = new Date(filterDate);
    newDate.setDate(newDate.getDate() + days);
    setFilterDate(newDate);
  };

  const dateStr = filterDate.toISOString().split('T')[0];
  const displayDate = filterDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

  const colors = profile?.colors || {};

  const getCardStyle = (bgColor?: string, isMain?: boolean) => {
    if (!bgColor || bgColor === '#ffffff') return {};
    return {
      background: bgColor,
      backgroundImage: 'none',
      color: '#fff',
      border: 'none',
      boxShadow: isMain ? '0 10px 20px -5px rgba(0,0,0,0.15)' : 'none'
    };
  };

  const getLabelStyle = (bgColor?: string) => {
    if (!bgColor || bgColor === '#ffffff') return {};
    return { color: 'rgba(255,255,255,0.8)' };
  };

  return (
    <div id="view-beranda">
      <div 
        className="balance-card card-blue" 
        style={getCardStyle(colors.bank, true)}
      >
        <div className="card-label" style={getLabelStyle(colors.bank)}>
          Saldo Bank 
          <span className="rincian-btn" onClick={() => setModalType('rincian_bank')}>Rincian</span>
        </div>
        <div className="card-value">{formatRp(balances.bank)}</div>
      </div>
      
      <div 
        className="balance-card card-green"
        style={getCardStyle(colors.cash, true)}
      >
        <div className="card-label" style={getLabelStyle(colors.cash)}>
          Saldo Kas Tunai 
          <span className="rincian-btn" onClick={() => setModalType('rincian_kas')}>Rincian</span>
        </div>
        <div className="card-value">{formatRp(totalKasDisplay)}</div>
      </div>

      <div className="quick-actions">
        <div className="qa-btn" onClick={() => setModalType('kasbon')} style={colors.theme ? { borderLeft: `4px solid ${colors.theme}` } : {}}>
          <Wallet size={16} color={colors.theme || 'var(--accent)'} /> KASBON
        </div>
        <div className="qa-btn" onClick={() => setModalType('deposit')} style={colors.theme ? { borderLeft: `4px solid ${colors.theme}` } : {}}>
          <Landmark size={16} color={colors.theme || 'var(--accent)'} /> DEPOSIT
        </div>
        <div className="qa-btn" onClick={() => setModalType('kontak')} style={colors.theme ? { borderLeft: `4px solid ${colors.theme}` } : {}}>
          <Phone size={16} color={colors.theme || 'var(--accent)'} /> KONTAK
        </div>
      </div>

      <div className="laba-grid">
        <div className="laba-card" style={getCardStyle(colors.admin)}>
          <div className="laba-label" style={getLabelStyle(colors.admin)}>📊 LABA ADMIN</div>
          <div className="laba-value" style={colors.admin && colors.admin !== '#ffffff' ? { color: '#fff' } : {}}>{formatRp(balances.admin)}</div>
        </div>
        <div className="laba-card" style={getCardStyle(colors.acc)}>
          <div className="laba-label" style={getLabelStyle(colors.acc)}>🎧 LABA ACC</div>
          <div className="laba-value" style={colors.acc && colors.acc !== '#ffffff' ? { color: '#fff' } : {}}>{formatRp(balances.acc)}</div>
        </div>
        <div className="laba-card" style={getCardStyle(colors.tarik)}>
          <div className="laba-label" style={getLabelStyle(colors.tarik)}>🏧 TARIK TUNAI</div>
          <div className="laba-value" style={colors.tarik && colors.tarik !== '#ffffff' ? { color: '#fff' } : {}}>{formatRp(balances.tarik)}</div>
        </div>
        <div className="laba-card" style={colors.theme && colors.theme !== '#ffffff' ? { border: `1.5px solid ${colors.theme}` } : {}}>
          <div className="laba-label">📈 DEPOSIT HARI INI</div>
          <div className="laba-value" style={colors.theme ? { color: colors.theme } : {}}>
            {formatRp(history
              .filter(h => {
                const todayStr = new Date().toISOString().split('T')[0];
                return h.kat === 'DEPOSIT' && h.tgl.startsWith(todayStr);
              })
              .reduce((acc, curr) => acc + curr.amt, 0)
            )}
          </div>
        </div>
      </div>

      {/* Rincian Modals */}
      <Modal isOpen={modalType === 'rincian_bank'} onClose={() => setModalType(null)} title="🏦 Riwayat Deposit">
        <div style={{ padding: '5px' }}>
          {/* Date Selector */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px', background: 'var(--bg)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <button onClick={() => changeDate(-1)} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '8px', padding: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <ChevronLeft size={18} />
            </button>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
              {displayDate}
            </div>
            <button onClick={() => changeDate(1)} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '8px', padding: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <ChevronRight size={18} />
            </button>
          </div>

          <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '15px' }}>
            {(() => {
              const selectedDeposits = history.filter(h => 
                h.kat === 'DEPOSIT' && 
                h.ket === 'Topup bank' && 
                h.tgl.startsWith(dateStr)
              );

              if (selectedDeposits.length > 0) {
                return selectedDeposits.map((h, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>Deposit Bank</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {new Date(h.tgl).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div style={{ color: 'var(--success)', fontWeight: 700 }}>+{formatRp(h.amt)}</div>
                  </div>
                ));
              } else {
                return <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '12px' }}>Tidak ada riwayat untuk tanggal ini.</div>;
              }
            })()}
          </div>
          
          <div style={{ background: 'var(--bg-card)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>Total Deposit:</span>
            <strong style={{ color: 'var(--accent)', fontSize: '16px' }}>
              {formatRp(history
                .filter(h => h.kat === 'DEPOSIT' && h.ket === 'Topup bank' && h.tgl.startsWith(dateStr))
                .reduce((acc, curr) => acc + curr.amt, 0)
              )}
            </strong>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modalType === 'rincian_kas'} onClose={() => setModalType(null)} title="💵 Rincian Kas Tunai">
        <div style={{ padding: '5px' }}>
          {/* Date Selector */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px', background: 'var(--bg)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <button onClick={() => changeDate(-1)} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '8px', padding: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <ChevronLeft size={18} />
            </button>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
              {displayDate}
            </div>
            <button onClick={() => changeDate(1)} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '8px', padding: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <ChevronRight size={18} />
            </button>
          </div>

          {(() => {
            // Calculate daily values from history
            const dayHistory = history.filter(h => h.tgl.startsWith(dateStr));
            
            let dailySales = 0;
            let dailyAdmin = 0;
            let dailyAcc = 0;
            let dailyTarik = 0;

            dayHistory.forEach(h => {
              const cat = profile?.categories.find(c => c.id === h.katId || c.name === h.kat);
              const logic = cat?.logicType;

              if (logic === 'BANK_OUT') {
                dailySales += (h.amt || 0);
                dailyAdmin += (h.fee || 0);
              } else if (logic === 'BANK_IN') {
                dailyTarik += (h.amt || 0);
                dailyAdmin += (h.fee || 0); // Logic says BANK_IN also adds to admin balance
              } else if (logic === 'LABA_ACC') {
                dailyAcc += (h.amt || 0);
              } else if (logic === 'LABA_ADMIN') {
                dailyAdmin += (h.amt || 0);
              } else if (h.kat === 'KASBON' && !h.katId) {
                // Compatibility for old kasbon records or if kasbon logic is special
                // But usually kasbon pelunasan is handled via a separate action.
              }
            });

            const totalOmset = dailySales + dailyAdmin + dailyAcc - dailyTarik;

            return (
              <div style={{ padding: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>+ Saldo Kas</span>
                  <strong style={{ fontSize: '14px' }}>{formatRp(dailySales)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>+ Laba Admin</span>
                  <strong style={{ fontSize: '14px' }}>{formatRp(dailyAdmin)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>+ Laba Acc</span>
                  <strong style={{ fontSize: '14px' }}>{formatRp(dailyAcc)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1.5px dashed var(--border)', paddingBottom: '15px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>- Tarik Tunai</span>
                  <strong style={{ fontSize: '14px', color: 'var(--danger)' }}>-{formatRp(dailyTarik)}</strong>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--accent-light)', padding: '15px', borderRadius: '15px' }}>
                  <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '13px' }}>TOTAL OMSET</span>
                  <strong style={{ color: 'var(--accent)', fontSize: '18px', fontWeight: 900 }}>
                    {formatRp(totalOmset)}
                  </strong>
                </div>
              </div>
            );
          })()}
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
