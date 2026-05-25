import React, { useState, useMemo, useEffect } from 'react';
import { HistoryItem, UserProfile, Balances } from '../../types';
import { RotateCcw, ArrowLeft, Calendar, Filter, ChevronDown, ChevronUp, Pencil, Trash2, Search, Clock, MoreVertical } from 'lucide-react';
import { getHistoryByDateRange } from '../../services/supabase';
import { auth } from '../../services/firebase';
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
  const [localHistory, setLocalHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
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

  useEffect(() => {
    const fetchFiltered = async () => {
      if (!auth.currentUser) return;
      setIsLoading(true);
      try {
        const data = await getHistoryByDateRange(auth.currentUser.uid, filterTglStart, filterTglEnd);
        setLocalHistory(data);
      } catch (err) {
        console.error("Gagal memuat history:", err);
      }
      setIsLoading(false);
    };
    fetchFiltered();
  }, [filterTglStart, filterTglEnd]);

  const filteredHistory = useMemo(() => {
    return localHistory.filter(h => {
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
  }, [localHistory, filterKat, filterPencarian, filterTglStart, filterTglEnd, categoryMap]);

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
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Memuat data...</div>
          ) : displayedHistory.length > 0 ? (
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

    </div>
  );
};

export default HistoryPage;
