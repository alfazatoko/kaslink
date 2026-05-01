import React, { useState, useMemo } from 'react';
import { HistoryItem, UserProfile } from '../../types';
import { RotateCcw, ArrowLeft, Calendar, Filter, ChevronDown, ChevronUp, Clock, Info } from 'lucide-react';
import { formatRp } from '../../utils/formatters';

interface HistoryPageProps {
  history: HistoryItem[];
  profile: UserProfile | null;
  onBack: () => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ history, profile, onBack }) => {
  const [filterKat, setFilterKat] = useState('');
  const [filterTglStart, setFilterTglStart] = useState('');
  const [filterTglEnd, setFilterTglEnd] = useState('');
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [displayLimit, setDisplayLimit] = useState(50);

  // Optimize category lookup
  const categoryMap = useMemo(() => {
    const map: Record<string, any> = {};
    profile?.categories.forEach(c => {
      map[c.id] = c;
      map[c.name] = c;
    });
    return map;
  }, [profile?.categories]);

  const filteredHistory = useMemo(() => {
    return history.filter(h => {
      // Logic Filter Kategori (Prioritas ID)
      let matchKat = true;
      if (filterKat !== '') {
        const idMatch = h.katId === filterKat;
        const nameMatch = !h.katId && categoryMap[filterKat] && h.kat === categoryMap[filterKat].name;
        const systemMatch = h.kat === filterKat; // Untuk KASBON/DEPOSIT
        
        matchKat = idMatch || nameMatch || systemMatch;
      }
      
      let matchTgl = true;
      if (h.tgl) {
        const itemDate = h.tgl.split('T')[0];
        if (filterTglStart && itemDate < filterTglStart) matchTgl = false;
        if (filterTglEnd && itemDate > filterTglEnd) matchTgl = false;
      }
      
      return matchKat && matchTgl;
    });
  }, [history, filterKat, filterTglStart, filterTglEnd, categoryMap]);

  const displayedHistory = filteredHistory.slice(0, displayLimit);

  const resetFilter = () => {
    setFilterKat('');
    setFilterTglStart('');
    setFilterTglEnd('');
    setDisplayLimit(50);
  };

  const getJam = (tgl: string) => {
    try {
      const d = new Date(tgl);
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '-';
    }
  };

  const getTglFull = (tgl: string) => {
    try {
      const d = new Date(tgl);
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return '-';
    }
  };

  const toggleExpand = (id: string | number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div id="view-riwayat" className="page-view">
      <div className="page-header">
        <button className="btn-back" onClick={onBack}><ArrowLeft size={20} /></button>
        <div className="page-title">Riwayat Transaksi</div>
      </div>
      
      <div className="page-content">
        <div className="filter-card">
          <div className="filter-header">
            <Filter size={16} />
            <span>Filter Data</span>
          </div>
          <div className="filter-grid">
            <div className="filter-item">
              <label>Kategori</label>
              <select 
                className="form-control" 
                value={filterKat}
                onChange={(e) => setFilterKat(e.target.value)}
              >
                <option value="">Semua Kategori</option>
                {profile?.categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value="KASBON">KASBON</option>
                <option value="DEPOSIT">DEPOSIT</option>
              </select>
            </div>
            <div className="filter-item">
              <label>Dari Tanggal</label>
              <div className="input-with-icon">
                <Calendar size={14} className="input-icon" />
                <input 
                  type="date" 
                  className="form-control" 
                  value={filterTglStart}
                  onChange={(e) => setFilterTglStart(e.target.value)}
                />
              </div>
            </div>
            <div className="filter-item">
              <label>Sampai Tanggal</label>
              <div className="input-with-icon">
                <Calendar size={14} className="input-icon" />
                <input 
                  type="date" 
                  className="form-control" 
                  value={filterTglEnd}
                  onChange={(e) => setFilterTglEnd(e.target.value)}
                />
              </div>
            </div>
            <button onClick={resetFilter} className="btn-reset-filter">
              <RotateCcw size={16} /> Reset
            </button>
          </div>
        </div>
        
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>No</th>
                <th style={{ width: '60px' }}>Jam</th>
                <th>Tipe</th>
                <th className="text-right">Nominal</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {displayedHistory.length > 0 ? (
                displayedHistory.map((h, i) => {
                  const id = h.id || i;
                  const isExpanded = expandedId === id;
                  const cat = categoryMap[h.katId || ''] || categoryMap[h.kat || ''];
                  const logic = cat?.logicType;
                  const isMinus = h.kat === 'KASBON' || logic === 'BANK_IN';
                  const amtClass = isMinus ? 'amt-minus' : 'amt-plus';

                  return (
                    <React.Fragment key={id}>
                      <tr className={isExpanded ? 'row-active' : ''} onClick={() => toggleExpand(id)}>
                        <td className="text-center">{i + 1}</td>
                        <td>{getJam(h.tgl)}</td>
                        <td>
                          <span className="cat-badge">{h.kat}</span>
                        </td>
                        <td className={`text-right font-bold ${amtClass}`}>
                          {formatRp(h.amt)}
                        </td>
                        <td className="text-center">
                          {isExpanded ? <ChevronUp size={18} className="text-accent" /> : <ChevronDown size={18} className="text-muted" />}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="expanded-content">
                          <td colSpan={5}>
                            <div className="detail-box">
                              <div className="detail-grid">
                                <div className="detail-item">
                                  <div className="detail-label"><Clock size={12} /> Waktu</div>
                                  <div className="detail-value">{getJam(h.tgl)} • {getTglFull(h.tgl)}</div>
                                </div>
                                <div className="detail-item">
                                  <div className="detail-label"><Info size={12} /> Keterangan Lengkap</div>
                                  <div className="detail-value text-full-ket">{h.ket}</div>
                                </div>
                                {h.fee && (
                                  <div className="detail-item">
                                    <div className="detail-label">Biaya Admin</div>
                                    <div className="detail-value">{formatRp(h.fee)}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="empty-row">
                    Tidak ada data ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {filteredHistory.length > displayLimit && (
            <div className="load-more-container">
              <button 
                className="btn-load-more" 
                onClick={() => setDisplayLimit(prev => prev + 50)}
              >
                Tampilkan Lebih Banyak ({filteredHistory.length - displayLimit} data lagi)
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .filter-card {
          background: var(--card);
          border-radius: 20px;
          padding: 16px;
          border: 1px solid var(--border);
          margin-bottom: 20px;
          box-shadow: var(--shadow);
        }
        .filter-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 800;
          color: var(--accent);
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .filter-grid {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: flex-end;
        }
        .filter-item {
          flex: 1;
          min-width: 140px;
        }
        .filter-item label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          margin-bottom: 6px;
        }
        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
          pointer-events: none;
        }
        .input-with-icon .form-control {
          padding-left: 34px;
        }
        .btn-reset-filter {
          background: #f1f5f9;
          border: 1px solid var(--border);
          color: var(--text-muted);
          height: 44px;
          padding: 0 16px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: 0.2s;
        }
        .dark .btn-reset-filter {
          background: #334155;
          color: #f8fafc;
        }
        .btn-reset-filter:hover {
          background: var(--danger);
          color: white;
          border-color: var(--danger);
        }
        
        .history-table-container {
          background: var(--card);
          border-radius: 24px;
          border: 1px solid var(--border);
          overflow: hidden;
          box-shadow: var(--shadow);
        }
        .history-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .history-table th {
          background: var(--accent-light);
          color: var(--accent);
          padding: 14px 16px;
          text-align: left;
          font-weight: 800;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid var(--border);
          white-space: nowrap;
        }
        .history-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border);
          color: var(--text);
        }
        .history-table tr:hover {
          background: rgba(0,0,0,0.02);
          cursor: pointer;
        }
        .dark .history-table tr:hover {
          background: rgba(255,255,255,0.02);
        }
        .row-active {
          background: var(--accent-light) !important;
        }
        .dark .row-active {
          background: rgba(37,99,235,0.1) !important;
        }
        
        /* Detail Section */
        .expanded-content td {
          padding: 0 !important;
          background: #f8fafc;
          border-bottom: 1px solid var(--border);
        }
        .dark .expanded-content td {
          background: #1e293b;
        }
        .detail-box {
          padding: 16px 20px;
          animation: slideDown 0.2s ease-out;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .detail-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .detail-label {
          font-size: 10px;
          font-weight: 800;
          color: var(--accent);
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .detail-value {
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
        }
        .text-full-ket {
          line-height: 1.5;
          color: var(--text-muted);
          background: var(--card);
          padding: 10px;
          border-radius: 10px;
          border: 1px solid var(--border);
        }
        
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-accent { color: var(--accent); }
        .text-muted { color: var(--text-muted) !important; }
        .font-bold { font-weight: 800; }
        
        .cat-badge {
          background: var(--bg);
          border: 1px solid var(--border);
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 700;
          color: var(--text-muted);
          white-space: nowrap;
        }
        .empty-row {
          padding: 60px !important;
          text-align: center;
          color: var(--text-muted);
          font-weight: 600;
        }
        
        
        .load-more-container {
          padding: 20px;
          display: flex;
          justify-content: center;
          background: var(--card);
        }
        .btn-load-more {
          background: var(--accent-light);
          color: var(--accent);
          border: 1px solid var(--accent);
          padding: 10px 24px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s;
        }
        .btn-load-more:hover {
          background: var(--accent);
          color: white;
        }

        @media (max-width: 640px) {
          .filter-grid { flex-direction: column; align-items: stretch; }
          .filter-item { min-width: 100%; }
          .history-table th, .history-table td {
            padding: 12px 10px;
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
};

export default HistoryPage;
