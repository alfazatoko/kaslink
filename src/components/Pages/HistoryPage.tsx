import React, { useState, useMemo } from 'react';
import { HistoryItem, UserProfile, Balances } from '../../types';
import { RotateCcw, ArrowLeft, Calendar, Filter, ChevronDown, ChevronUp, Pencil, Trash2, Search, Clock, MoreVertical } from 'lucide-react';
import { formatRp, formatInput, getInt } from '../../utils/formatters';
import Modal from '../Common/Modal';

interface HistoryPageProps {
  history: HistoryItem[];
  profile: UserProfile | null;
  balances: Balances;
  onEdit: (oldItem: HistoryItem, katId: string, nom: number, fee: number, ket: string) => Promise<void>;
  onDelete: (item: HistoryItem) => Promise<void>;
  onBack: () => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ history, profile, balances, onEdit, onDelete, onBack }) => {
  const [filterKat, setFilterKat] = useState('Semua');
  const [filterPencarian, setFilterPencarian] = useState('');
  const [filterTglStart, setFilterTglStart] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterTglEnd, setFilterTglEnd] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [displayLimit, setDisplayLimit] = useState(50);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [editingItem, setEditingItem] = useState<HistoryItem | null>(null);
  const [editKatId, setEditKatId] = useState('');
  const [editNom, setEditNom] = useState('');
  const [editFee, setEditFee] = useState('0');
  const [editKet, setEditKet] = useState('');

  const categoryMap = useMemo(() => {
    const map: Record<string, any> = {};
    profile?.categories?.forEach(c => {
      map[c.id] = c;
      map[c.name] = c;
    });
    return map;
  }, [profile?.categories]);

  const filteredHistory = useMemo(() => {
    return history.filter(h => {
      let matchKat = true;
      if (filterKat !== 'Semua') {
        const idMatch = h.katId === filterKat;
        const nameMatch = !h.katId && categoryMap[filterKat] && h.kat === categoryMap[filterKat].name;
        const systemMatch = h.kat === filterKat;
        matchKat = idMatch || nameMatch || systemMatch;
      }
      
      let matchSearch = true;
      if (filterPencarian) {
        const keyword = filterPencarian.toLowerCase();
        matchSearch = 
          (h.ket || '').toLowerCase().includes(keyword) || 
          (h.amt || 0).toString().includes(keyword) ||
          (h.kat || '').toLowerCase().includes(keyword);
      }

      let matchTgl = true;
      if (h.tgl) {
        const itemDate = h.tgl.split('T')[0];
        if (filterTglStart && itemDate < filterTglStart) matchTgl = false;
        if (filterTglEnd && itemDate > filterTglEnd) matchTgl = false;
      }
      
      return matchKat && matchSearch && matchTgl;
    });
  }, [history, filterKat, filterPencarian, filterTglStart, filterTglEnd, categoryMap]);

  const displayedHistory = filteredHistory.slice(0, displayLimit);
  const totalNominal = filteredHistory.reduce((acc, curr) => acc + (curr.amt || 0), 0);
  const totalFee = filteredHistory.reduce((acc, curr) => acc + (curr.fee || 0), 0);

  const resetFilter = () => {
    const today = new Date().toISOString().split('T')[0];
    setFilterKat('Semua');
    setFilterPencarian('');
    setFilterTglStart(today);
    setFilterTglEnd(today);
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
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '-';
    }
  };

  const toggleExpand = (id: string | undefined) => {
    if (!id) return;
    setExpandedId(expandedId === id ? null : id);
  };

  const openEdit = (h: HistoryItem) => {
    setEditingItem(h);
    setEditKatId(h.katId || '');
    setEditNom(formatInput(h.amt.toString()));
    setEditFee(formatInput((h.fee || 0).toString()));
    setEditKet(h.ket || '');
  };

  const handleEditSave = async () => {
    if (!editingItem) return;
    const nominal = getInt(editNom);
    const adminFee = getInt(editFee);
    if (!editKatId) return alert("Pilih kategori");
    if (nominal <= 0) return alert("Nominal harus diisi");
    try {
      await onEdit(editingItem, editKatId, nominal, adminFee, editKet);
      alert("Transaksi berhasil diupdate!");
      setEditingItem(null);
    } catch (err: any) {
      alert("Gagal: " + err.message);
    }
  };

  const handleDelete = async (h: HistoryItem) => {
    if (!confirm(`Hapus transaksi "${h.kat}" Rp ${formatRp(h.amt)}?`)) return;
    try {
      await onDelete(h);
      alert("Transaksi berhasil dihapus!");
    } catch (err: any) {
      alert("Gagal: " + err.message);
    }
  };

  return (
    <div id="view-riwayat" className="page-view" style={{ backgroundColor: 'var(--container-bg, #f8fafc)' }}>
      {/* HEADER TOKO IDENTIK BERANDA - LIKE ALPHA */}
      <div className="alpha-header" style={{ paddingBottom: '2.5rem' }}>
        <div className="alpha-header-content">
          <div className="alpha-header-left">
            <div className="alpha-header-logo-container">
              <button className="btn-back-alpha" onClick={onBack}><ArrowLeft size={18} color="white" /></button>
            </div>
            <div>
              <h1 className="alpha-store-name">{profile?.toko || 'ALFAZA CELL'}</h1>
              <p className="alpha-store-subtext">Pembukuan Agen brilink & Konter</p>
              <div className="alpha-role-badge">
                <span className="role-text">KASIR / OWNER</span>
              </div>
            </div>
          </div>
          <button className="alpha-btn-menu">
            <MoreVertical size={16} color="white" />
          </button>
        </div>
      </div>

      <div className="alpha-jurnal-banner">
        <div className="alpha-jurnal-header">
          <div>
            <h2 className="alpha-jurnal-title">Data Transaksi</h2>
            <p className="alpha-jurnal-subtitle">Arus kas keluar masuk</p>
          </div>
          <div className="alpha-jurnal-icon">
            <Clock size={14} color="white" />
          </div>
        </div>
      </div>

      <div className="alpha-content-wrapper">
        {/* HORIZONTAL FILTER BAR */}
        <div className="alpha-filter-card">
          <div className="alpha-filter-row">
            <div className="alpha-filter-item">
              <label>Dari Tanggal</label>
              <div className="alpha-input-wrap">
                <input type="date" value={filterTglStart} onChange={e => setFilterTglStart(e.target.value)} />
                <Calendar size={12} className="alpha-input-icon" />
              </div>
            </div>
            <div className="alpha-filter-item">
              <label>Ke Tanggal</label>
              <div className="alpha-input-wrap">
                <input type="date" value={filterTglEnd} onChange={e => setFilterTglEnd(e.target.value)} />
                <Calendar size={12} className="alpha-input-icon" />
              </div>
            </div>
          </div>
          
          <div className="alpha-filter-row">
            <div className="alpha-filter-item" style={{ flex: 1 }}>
              <label>Kategori</label>
              <div className="alpha-input-wrap">
                <select value={filterKat} onChange={e => setFilterKat(e.target.value)}>
                  <option value="Semua">Semua Kategori</option>
                  {profile?.categories?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  <option value="KASBON">KASBON</option>
                  <option value="DEPOSIT">DEPOSIT</option>
                </select>
                <ChevronDown size={10} className="alpha-select-icon" />
              </div>
            </div>
          </div>

          <div className="alpha-filter-row">
            <div className="alpha-filter-item" style={{ flex: 1.5 }}>
              <label>Cari (Keterangan / Nominal)</label>
              <div className="alpha-input-wrap">
                <input type="text" placeholder="Kata kunci..." value={filterPencarian} onChange={e => setFilterPencarian(e.target.value)} />
                <Search size={12} className="alpha-input-icon" />
              </div>
            </div>
          </div>

          <button onClick={resetFilter} className="alpha-btn-reset">
            RESET FILTER
          </button>
        </div>

        {/* LIST TRANSAKSI */}
        <div className="alpha-history-list">
          {displayedHistory.length > 0 ? (
            displayedHistory.map((h, i) => {
              const cat = categoryMap[h.katId || ''] || categoryMap[h.kat || ''];
              const logic = cat?.logicType;
              const isMinus = h.kat === 'KASBON' || logic === 'BANK_IN';
              const isExpanded = expandedId === h.id;
              
              let badgeClass = "badge-default";
              if (h.kat === 'Transfer Bank') badgeClass = "badge-blue";
              else if (h.kat === 'DANA') badgeClass = "badge-emerald";
              else if (h.kat === 'FLIP') badgeClass = "badge-cyan";
              else if (h.kat === 'Order Kuota') badgeClass = "badge-amber";
              else if (h.kat === 'Tarik Tunai') badgeClass = "badge-rose";
              else if (logic === 'BANK_OUT') badgeClass = "badge-blue";
              else if (logic === 'BANK_IN') badgeClass = "badge-rose";
              
              const isKhusus = (h.ket || '').includes('[KHUSUS]');
              const isNonTunai = (h.ket || '').includes('[NON_TUNAI]');

              return (
                <div className="alpha-history-card" key={h.id || i}>
                  <div className="ahc-top">
                    <span className="ahc-time">{getTglFull(h.tgl)} • {getJam(h.tgl)}</span>
                  </div>
                  
                  <div className="ahc-mid" onClick={() => toggleExpand(h.id)} style={{ cursor: 'pointer' }}>
                    <div className="ahc-kategori">
                      <span className={`ahc-badge ${badgeClass}`}>{h.kat}</span>
                    </div>
                    <div className="ahc-nominal-area">
                      <span className={`ahc-nominal ${isMinus ? 'text-rose-600' : 'text-slate-800'}`}>
                        {formatRp(h.amt)}
                      </span>
                      {h.fee > 0 && <span className="ahc-fee">+{formatRp(h.fee)}</span>}
                    </div>
                  </div>

                  <div className="ahc-ket-area">
                    <span className="ahc-ket-text">{h.ket || '-'}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {isKhusus && <span className="badge-mini badge-orange">KHUSUS</span>}
                      {isNonTunai && <span className="badge-mini badge-purple">NON TUNAI</span>}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="ahc-expanded">
                      <div className="ahc-expanded-grid">
                        <div>
                          <p>Total Nominal</p>
                          <strong>{formatRp(h.amt)}</strong>
                        </div>
                        <div>
                          <p>Admin Fee</p>
                          <strong className="text-emerald-600">{formatRp(h.fee || 0)}</strong>
                        </div>
                        <div>
                          <p>Grand Total</p>
                          <strong className="text-slate-900">{formatRp((h.amt || 0) + (h.fee || 0))}</strong>
                        </div>
                      </div>
                      <div className="ahc-actions">
                        <button className="ahc-btn-edit" onClick={() => openEdit(h)}>
                          <Pencil size={10} /> EDIT
                        </button>
                        <button className="ahc-btn-del" onClick={() => handleDelete(h)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="alpha-empty-state">
              Tidak ada transaksi dalam filter ini
            </div>
          )}
          
          {filteredHistory.length > displayLimit && (
            <button className="alpha-btn-loadmore" onClick={() => setDisplayLimit(prev => prev + 50)}>
              Tampilkan Lebih Banyak ({filteredHistory.length - displayLimit} lagi)
            </button>
          )}
        </div>

        {/* SUMMARY FOOTER */}
        <div className="alpha-summary-footer">
          <div className="asf-item">
            <span>TOTAL NOMINAL</span>
            <strong>{formatRp(totalNominal)}</strong>
          </div>
          <div className="asf-divider" />
          <div className="asf-item text-emerald">
            <span>TOTAL ADMIN</span>
            <strong>{formatRp(totalFee)}</strong>
          </div>
          <div className="asf-divider" />
          <div className="asf-item text-dark">
            <span>GRAND TOTAL</span>
            <strong>{formatRp(totalNominal + totalFee)}</strong>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      <Modal isOpen={!!editingItem} onClose={() => setEditingItem(null)} title="✏️ Edit Transaksi">
        <form onSubmit={(e) => { e.preventDefault(); handleEditSave(); }}>
          <div className="form-group">
            <label>Kategori</label>
            <select className="form-control" value={editKatId} onChange={(e) => setEditKatId(e.target.value)}>
              <option value="">-- Pilih Kategori --</option>
              {profile?.categories?.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Nominal (Rp)</label>
            <input type="text" className="form-control" inputMode="numeric" value={editNom} onChange={(e) => setEditNom(formatInput(e.target.value))} required />
          </div>
          <div className="form-group">
            <label>Admin Fee (Laba)</label>
            <input type="text" className="form-control" inputMode="numeric" value={editFee} onChange={(e) => setEditFee(formatInput(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Keterangan</label>
            <input type="text" className="form-control" value={editKet} onChange={(e) => setEditKet(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={() => setEditingItem(null)} className="btn-cancel" style={{ flex: 1 }}>Batal</button>
            <button type="submit" className="btn-submit" style={{ flex: 2 }}>SIMPAN PERUBAHAN</button>
          </div>
        </form>
      </Modal>

      <style>{`
        /* ALPHA STYLES */
        .alpha-header {
          background: #1e1e1e;
          position: relative;
        }
        .alpha-header-content {
          padding: 3rem 1rem 0.5rem 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .alpha-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .btn-back-alpha {
          width: 40px; height: 40px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
        }
        .alpha-store-name {
          font-size: 13px; font-weight: 900; color: white; text-transform: uppercase; letter-spacing: 1px;
        }
        .alpha-store-subtext {
          font-size: 8px; font-weight: 700; color: #bfdbfe; text-transform: uppercase;
        }
        .alpha-role-badge {
          margin-top: 4px;
        }
        .role-text {
          font-size: 7px; font-weight: 900; background: rgba(255,255,255,0.25); color: white; padding: 2px 6px; border-radius: 10px;
        }
        .alpha-btn-menu {
          width: 40px; height: 40px;
          border-radius: 16px;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .alpha-jurnal-banner {
          margin: -2.5rem 6px 0 6px;
          padding: 1.5rem 1rem 1.25rem 1rem;
          background: linear-gradient(to right, #4338ca, #2563eb);
          border-radius: 0 0 2rem 2rem;
          box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.2);
          position: relative;
          z-index: 10;
        }
        .alpha-jurnal-header {
          display: flex; justify-content: space-between; align-items: center;
        }
        .alpha-jurnal-title {
          font-size: 14px; font-weight: 700; color: white; letter-spacing: 0.5px;
        }
        .alpha-jurnal-subtitle {
          font-size: 10px; color: #bfdbfe; opacity: 0.9;
        }
        .alpha-jurnal-icon {
          width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);
        }

        .alpha-content-wrapper {
          padding: 20px 12px;
        }

        /* Filter Card */
        .alpha-filter-card {
          background: white;
          border-radius: 24px;
          padding: 20px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          margin-bottom: 20px;
        }
        .dark .alpha-filter-card { background: #1e293b; border-color: #334155; }
        .alpha-filter-row {
          display: flex; gap: 12px; margin-bottom: 12px;
        }
        .alpha-filter-item { flex: 1; }
        .alpha-filter-item label {
          display: block; font-size: 8px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;
        }
        .alpha-input-wrap {
          position: relative;
        }
        .alpha-input-wrap input, .alpha-input-wrap select {
          width: 100%;
          background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;
          padding: 8px 12px; padding-left: 36px;
          font-size: 12px; font-weight: 700; color: #1e293b;
          outline: none; appearance: none;
        }
        .dark .alpha-input-wrap input, .dark .alpha-input-wrap select {
          background: #0f172a; border-color: #334155; color: #f1f5f9;
        }
        .alpha-input-icon {
          position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none;
        }
        .alpha-select-icon {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none;
        }
        .alpha-btn-reset {
          width: 100%; background: #f1f5f9; color: #475569; border: none; padding: 10px; border-radius: 12px; font-size: 10px; font-weight: 900; text-transform: uppercase; cursor: pointer; margin-top: 8px; transition: 0.2s;
        }
        .dark .alpha-btn-reset { background: #334155; color: #cbd5e1; }
        .alpha-btn-reset:active { transform: scale(0.98); }

        /* History List */
        .alpha-history-list {
          display: flex; flex-direction: column; gap: 12px;
        }
        .alpha-history-card {
          background: white; border-radius: 20px; padding: 14px 16px; border: 1px solid #f1f5f9; box-shadow: 0 1px 2px rgba(0,0,0,0.03);
          transition: 0.2s;
        }
        .dark .alpha-history-card { background: #1e293b; border-color: #334155; }
        
        .ahc-top {
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
        }
        .ahc-time { font-size: 10px; font-weight: 600; color: #64748b; }
        
        .ahc-mid {
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;
        }
        .ahc-badge {
          font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 10px; border: 1px solid transparent;
        }
        .badge-default { background: #f1f5f9; color: #475569; border-color: #e2e8f0; }
        .badge-blue { background: #eff6ff; color: #1d4ed8; border-color: #dbeafe; }
        .badge-emerald { background: #ecfdf5; color: #047857; border-color: #d1fae5; }
        .badge-cyan { background: #ecfeff; color: #0e7490; border-color: #cffafe; }
        .badge-amber { background: #fffbeb; color: #b45309; border-color: #fef3c7; }
        .badge-rose { background: #fff1f2; color: #be123c; border-color: #ffe4e6; }
        .badge-purple { background: #faf5ff; color: #7e22ce; border-color: #f3e8ff; }
        .badge-orange { background: #fff7ed; color: #c2410c; border-color: #ffedd5; }
        
        .dark .badge-default { background: #334155; color: #cbd5e1; border-color: #475569; }
        .dark .badge-blue { background: rgba(30,58,138,0.3); color: #60a5fa; border-color: rgba(30,58,138,0.5); }
        .dark .badge-emerald { background: rgba(6,78,59,0.3); color: #34d399; border-color: rgba(6,78,59,0.5); }
        .dark .badge-cyan { background: rgba(22,78,99,0.3); color: #22d3ee; border-color: rgba(22,78,99,0.5); }
        .dark .badge-amber { background: rgba(120,53,15,0.3); color: #fbbf24; border-color: rgba(120,53,15,0.5); }
        .dark .badge-rose { background: rgba(136,19,55,0.3); color: #fb7185; border-color: rgba(136,19,55,0.5); }
        .dark .badge-purple { background: rgba(88,28,135,0.3); color: #c084fc; border-color: rgba(88,28,135,0.5); }
        .dark .badge-orange { background: rgba(124,45,18,0.3); color: #fb923c; border-color: rgba(124,45,18,0.5); }

        .badge-mini {
          font-size: 7px; font-weight: 900; padding: 2px 4px; border-radius: 4px; border: 1px solid;
        }

        .ahc-nominal-area {
          display: flex; flex-direction: column; align-items: flex-end;
        }
        .ahc-nominal {
          font-size: 15px; font-weight: 900;
        }
        .text-rose-600 { color: #e11d48; }
        .text-slate-800 { color: #1e293b; }
        .dark .text-slate-800 { color: #f8fafc; }
        .text-emerald-600 { color: #059669; }
        .text-slate-900 { color: #0f172a; }
        .dark .text-slate-900 { color: #ffffff; }

        .ahc-fee {
          font-size: 10px; font-weight: 800; color: #10b981;
        }

        .ahc-ket-area {
          display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
        }
        .ahc-ket-text {
          font-size: 11px; font-weight: 700; color: #475569; max-width: 80%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .dark .ahc-ket-text { color: #94a3b8; }

        .ahc-expanded {
          margin-top: 12px; padding-top: 12px; border-top: 1px solid #f1f5f9;
          animation: slideDown 0.2s ease-out;
        }
        .dark .ahc-expanded { border-color: #334155; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        
        .ahc-expanded-grid {
          display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 12px;
        }
        .ahc-expanded-grid div p {
          font-size: 8px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 2px;
        }
        .ahc-expanded-grid div strong {
          font-size: 11px;
        }
        .ahc-actions {
          display: flex; gap: 8px; justify-content: center;
        }
        .ahc-btn-edit {
          background: #eff6ff; color: #2563eb; border: 1px solid #dbeafe; padding: 6px 12px; border-radius: 10px; font-size: 9px; font-weight: 900; display: flex; align-items: center; gap: 4px; cursor: pointer;
        }
        .dark .ahc-btn-edit { background: rgba(30,58,138,0.2); border-color: rgba(30,58,138,0.4); color: #60a5fa; }
        
        .ahc-btn-del {
          background: #fff1f2; color: #e11d48; border: 1px solid #ffe4e6; padding: 6px 12px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer;
        }
        .dark .ahc-btn-del { background: rgba(136,19,55,0.2); border-color: rgba(136,19,55,0.4); color: #fb7185; }

        .alpha-empty-state {
          padding: 40px 20px; text-align: center; color: #94a3b8; font-size: 12px; font-weight: 800; text-transform: uppercase; background: rgba(241, 245, 249, 0.5); border-radius: 20px;
        }
        .dark .alpha-empty-state { background: rgba(30, 41, 59, 0.5); }

        .alpha-btn-loadmore {
          background: #f8fafc; border: 1px dashed #cbd5e1; color: #64748b; padding: 12px; border-radius: 16px; font-size: 11px; font-weight: 800; cursor: pointer; width: 100%; transition: 0.2s;
        }
        .dark .alpha-btn-loadmore { background: #1e293b; border-color: #475569; color: #94a3b8; }

        /* Summary Footer */
        .alpha-summary-footer {
          margin-top: 24px; background: white; border-radius: 24px; padding: 16px; display: flex; align-items: center; justify-content: space-between; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px rgba(0,0,0,0.02);
        }
        .dark .alpha-summary-footer { background: #1e293b; border-color: #334155; }
        .asf-item {
          display: flex; flex-direction: column; align-items: center; flex: 1;
        }
        .asf-item span {
          font-size: 8px; font-weight: 900; color: #94a3b8; margin-bottom: 4px;
        }
        .asf-item strong {
          font-size: 12px; font-weight: 900; color: #3b82f6;
        }
        .asf-item.text-emerald strong { color: #10b981; }
        .asf-item.text-dark strong { color: #0f172a; }
        .dark .asf-item.text-dark strong { color: #f8fafc; }
        .asf-divider {
          width: 1px; height: 24px; background: #e2e8f0;
        }
        .dark .asf-divider { background: #334155; }

        .btn-cancel {
          background: #f1f5f9; border: 1px solid #e2e8f0; color: #64748b; padding: 14px; border-radius: 16px; font-size: 13px; font-weight: 800; cursor: pointer;
        }
        .dark .btn-cancel { background: #334155; border-color: #475569; color: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default HistoryPage;
