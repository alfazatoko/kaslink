import React, { useState } from 'react';
import { HistoryItem, UserProfile } from '../types';
import { Search, RotateCcw, ArrowLeft } from 'lucide-react';

interface HistoryPageProps {
  history: HistoryItem[];
  profile: UserProfile | null;
  onBack: () => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ history, profile, onBack }) => {
  const [filterKat, setFilterKat] = useState('');
  const [filterTgl, setFilterTgl] = useState('');

  const formatRp = (v: number) => 'Rp ' + (v || 0).toLocaleString('id-ID');

  const filteredHistory = history.filter(h => {
    const matchKat = filterKat === '' || h.katId === filterKat || h.kat === filterKat;
    const matchTgl = filterTgl === '' || (h.tgl && h.tgl.startsWith(filterTgl));
    return matchKat && matchTgl;
  });

  const resetFilter = () => {
    setFilterKat('');
    setFilterTgl('');
  };

  return (
    <div id="view-riwayat" className="page-view">
      <div className="page-header">
        <button className="btn-back" onClick={onBack}><ArrowLeft size={20} /></button>
        <div className="page-title">Riwayat Transaksi</div>
      </div>
      <div className="page-content">
        <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select 
            className="form-control" 
            style={{ fontSize: '11px', padding: '8px', flex: 1 }}
            value={filterKat}
            onChange={(e) => setFilterKat(e.target.value)}
          >
            <option value="">Semua Kategori</option>
            {profile?.categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input 
            type="date" 
            className="form-control" 
            style={{ fontSize: '11px', padding: '8px', flex: 1 }}
            value={filterTgl}
            onChange={(e) => setFilterTgl(e.target.value)}
          />
          <button 
            onClick={resetFilter} 
            className="btn-submit" 
            style={{ padding: '8px 12px', width: 'auto', fontSize: '11px', height: '38px', background: 'var(--danger)' }}
          >
            <RotateCcw size={14} />
          </button>
        </div>
        
        <div id="listRiwayat">
          {filteredHistory.map((h, i) => {
            const cat = profile?.categories.find(c => c.id === h.katId || c.name === h.kat);
            const logic = cat?.logicType;
            const isMinus = h.kat === 'KASBON' || logic === 'BANK_IN';
            const amtClass = isMinus ? 'amt-minus' : 'amt-plus';
            const amtSign = isMinus ? '-' : '+';

            return (
              <div key={h.id || i} className="history-item">
                <div className="history-info">
                  <div style={{ fontSize: '13px' }}>{h.ket}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {h.kat} • {new Date(h.tgl).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className={`history-amt ${amtClass}`}>
                  {amtSign}{formatRp(h.amt)}
                </div>
              </div>
            );
          })}
          {filteredHistory.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Tidak ada data ditemukan
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
