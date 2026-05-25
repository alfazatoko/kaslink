import React, { useState, useEffect, useMemo } from 'react';
import { HistoryItem, Balances, UserProfile } from '../../types';
import { ArrowLeft, Download, Share2, Calendar, Clock, MoreVertical, Filter } from 'lucide-react';
import { getHistoryByDateRange } from '../../services/supabase';
import { auth } from '../../services/firebase';
import { formatRp, getInt, formatInput } from '../../utils/formatters';
import html2pdf from 'html2pdf.js';

interface ReportsPageProps {
  history: HistoryItem[];
  profile: UserProfile | null;
  balances: Balances;   // saldo live dari beranda
  onBack: () => void;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ history, profile, balances, onBack }) => {
  const [filterTglStart, setFilterTglStart] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterTglEnd,   setFilterTglEnd]   = useState<string>(new Date().toISOString().split('T')[0]);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [localHistory, setLocalHistory] = useState<HistoryItem[]>([]);

  // Local state for Saldo Real app like ALPHA
  const [saldoReal, setSaldoReal] = useState<number>(balances.bank);
  const [showSaldoRealModal, setShowSaldoRealModal] = useState(false);
  const [inputSaldoReal, setInputSaldoReal] = useState('');
  const [inputSaldoRealKet, setInputSaldoRealKet] = useState('');

  const [reportData, setReportData] = useState({
    catStats:     {} as Record<string, { count: number; total: number; fee: number }>,
    salesTotal:   0,   // BANK_OUT nominal
    tarikTotal:   0,   // BANK_IN nominal
    adminTotal:   0,   // semua fee + LABA_ADMIN nominal
    accTotal:     0,   // LABA_ACC nominal
    depositTotal: 0,
    kasbonTotal:  0,
    txCount:      0,
  });

  const categoryMap = useMemo(() => {
    const map: Record<string, any> = {};
    profile?.categories?.forEach(c => {
      map[c.id]   = c;
      map[c.name] = c;
    });
    return map;
  }, [profile?.categories]);

  useEffect(() => {
    const fetchFiltered = async () => {
      if (!auth.currentUser) return;
      try {
        const data = await getHistoryByDateRange(auth.currentUser.uid, filterTglStart, filterTglEnd);
        setLocalHistory(data);
      } catch (err) {
        console.error("Gagal memuat history:", err);
      }
    };
    fetchFiltered();
  }, [filterTglStart, filterTglEnd]);

  useEffect(() => {
    const stats: Record<string, { count: number; total: number; fee: number }> = {};
    let sales = 0, tarik = 0, admin = 0, acc = 0, deposit = 0, kasbon = 0, txCount = 0;

    for (const h of localHistory) {
      if (!h.tgl) continue;
      const itemDate = h.tgl.split('T')[0];
      if (itemDate < filterTglStart || itemDate > filterTglEnd) continue;

      txCount++;

      // per-kategori stats
      const catName = h.kat || 'Lainnya';
      if (!stats[catName]) stats[catName] = { count: 0, total: 0, fee: 0 };
      stats[catName].count += 1;
      stats[catName].total += h.amt || 0;
      stats[catName].fee   += h.fee || 0;

      const cat   = categoryMap[h.katId || ''] || categoryMap[catName];
      const logic = cat?.logicType;

      // fee selalu masuk admin
      admin += h.fee || 0;

      if      (logic === 'BANK_OUT')   { sales += h.amt || 0; }
      else if (logic === 'BANK_IN')    { tarik += h.amt || 0; }
      else if (logic === 'LABA_ACC')   { acc   += h.amt || 0; }
      else if (logic === 'LABA_ADMIN') { admin += h.amt || 0; }
      else if (catName === 'DEPOSIT')    { deposit += h.amt || 0; }
      else if (catName === 'KASBON')     { kasbon  += h.amt || 0; }
    }

    setReportData({ catStats: stats, salesTotal: sales, tarikTotal: tarik, adminTotal: admin, accTotal: acc, depositTotal: deposit, kasbonTotal: kasbon, txCount });
  }, [localHistory, filterTglStart, filterTglEnd, categoryMap]);

  // Saldo kas live dari beranda (bukan dari history)
  const liveKas  = balances.sales + balances.admin + balances.acc - balances.tarik;
  const liveBank = balances.bank;

  // Total kas periode = sisa penjualan + admin + acc
  const sisaCash   = reportData.salesTotal - reportData.tarikTotal;
  const totalCash  = sisaCash + reportData.adminTotal + reportData.accTotal;

  const getDayName = () => {
    const d = new Date(filterTglStart);
    return d.toLocaleDateString('id-ID', { weekday: 'long' });
  };
  const getFullDate = () => {
    const d = new Date(filterTglStart);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const clockStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const exportPDF = async (mode: 'download' | 'share') => {
    setIsSharing(true);
    try {
      const element = document.getElementById('report-content-body');
      if (!element) throw new Error("Report element not found");
      const opt = {
        margin: 10,
        filename: `Laporan_KINK_${new Date().toLocaleDateString('id-ID')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      if (mode === 'download') {
        await html2pdf().set(opt).from(element).save();
      } else {
        const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
        const file = new File([pdfBlob], opt.filename, { type: 'application/pdf' });
        if (navigator.share) {
          await navigator.share({ files: [file], title: 'Laporan Keuangan', text: 'Laporan keuangan KINK POS.' });
        } else {
          alert('Fitur share tidak didukung browser ini.');
        }
      }
    } catch (err: any) {
      alert("Gagal export PDF: " + err.message);
    } finally {
      setIsSharing(false);
      setShowShareMenu(false);
    }
  };

  const handleUpdateSaldoReal = () => {
    const nominal = getInt(inputSaldoReal);
    if (nominal > 0) {
      setSaldoReal(nominal);
      setInputSaldoReal('');
      setInputSaldoRealKet('');
      setShowSaldoRealModal(false);
    }
  };

  const selisih = saldoReal - liveBank;

  return (
    <div id="view-laporan" className="page-view" style={{ backgroundColor: 'var(--container-bg, #f8fafc)' }}>
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
          <div className="alpha-header-right-text" style={{ textAlign: 'right' }}>
             <p className="text-day">{getDayName()}</p>
             <p className="text-date">{getFullDate()}</p>
             <p className="text-time">{clockStr}</p>
          </div>
        </div>
      </div>

      <div className="alpha-jurnal-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="alpha-jurnal-title">Rekapitulasi</h2>
          <p className="alpha-jurnal-subtitle">Arus kas & laba</p>
        </div>
        
        <div style={{ position: 'relative' }}>
          <button 
            className="btn-share-alpha" 
            onClick={() => setShowShareMenu(!showShareMenu)}
            disabled={isSharing}
          >
            BAGIKAN {isSharing ? '...' : <Share2 size={12} />}
          </button>
          
          {showShareMenu && (
            <div className="share-dropdown">
              <button onClick={() => exportPDF('download')}><Download size={12} color="#10b981" /> Download PDF</button>
              <button onClick={() => exportPDF('share')}><Share2 size={12} color="#ef4444" /> Share PDF</button>
            </div>
          )}
        </div>
      </div>

      {/* FILTER TANGGAL */}
      <div className="alpha-filter-date">
        <span className="filter-label"><Calendar size={10} /> Tanggal Laporan:</span>
        <div className="filter-inputs">
          <input type="date" value={filterTglStart} onChange={e => setFilterTglStart(e.target.value)} />
          <span> - </span>
          <input type="date" value={filterTglEnd} onChange={e => setFilterTglEnd(e.target.value)} />
        </div>
      </div>

      <div id="report-content-body" className="alpha-content-wrapper">
        {/* STATS CARDS */}
        <div className="stats-grid-2">
          <div className="stat-card stat-blue">
            <div className="sc-glow"></div>
            <p className="sc-label">Saldo Bank</p>
            <p className="sc-value">{formatRp(liveBank)}</p>
          </div>
          <div className="stat-card stat-emerald">
            <div className="sc-glow"></div>
            <p className="sc-label">Saldo Laci Kasir</p>
            <p className="sc-value">{formatRp(liveKas)}</p>
          </div>
        </div>

        {/* REKAP PER KATEGORI TABLE */}
        <div className="alpha-card mb-4">
          <div className="card-header">
            <h3 className="ch-title">Rekap per Kategori</h3>
            <span className="ch-badge">OTOMATIS</span>
          </div>
          <div className="table-responsive">
            <table className="alpha-table">
              <thead>
                <tr>
                  <th>Kategori</th>
                  <th className="text-center">Qty</th>
                  <th>Nominal</th>
                  <th className="text-right">Laba</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(reportData.catStats).length > 0 ? (
                  Object.entries(reportData.catStats).map(([name, stat]) => {
                    let badgeClass = "badge-default";
                    if (name === 'Transfer Bank') badgeClass = "badge-blue";
                    else if (name === 'DANA') badgeClass = "badge-cyan";
                    else if (name === 'FLIP') badgeClass = "badge-orange";
                    else if (name === 'Order Kuota') badgeClass = "badge-emerald";
                    else if (name === 'Tarik Tunai') badgeClass = "badge-rose";
                    else if (name === 'Aksesoris') badgeClass = "badge-fuchsia";
                    
                    return (
                      <tr key={name}>
                        <td><span className={`ahc-badge ${badgeClass}`}>{name}</span></td>
                        <td className="text-center"><strong>{stat.count}</strong></td>
                        <td><strong>{formatRp(stat.total)}</strong></td>
                        <td className="text-right text-emerald-600"><strong>{formatRp(stat.fee)}</strong></td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={4} className="text-center" style={{ padding: '20px', color: '#94a3b8' }}>Tidak ada transaksi</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* KAS MASUK & KELUAR */}
        <div className="mb-4">
          <h4 className="section-title text-emerald-600">KAS MASUK</h4>
          <div className="alpha-card-inner border-emerald-100">
            <div className="row-item bg-gray-50 border-gray-100">
              <span className="ri-label text-gray-700">Penjualan Digital (BANK OUT)</span>
              <span className="ri-value text-gray-800">{formatRp(reportData.salesTotal)}</span>
            </div>
            <div className="row-item bg-emerald-50 border-emerald-100">
              <span className="ri-label text-emerald-700">Total Admin Fee</span>
              <span className="ri-value text-emerald-600">{formatRp(reportData.adminTotal)}</span>
            </div>
            <div className="row-item bg-purple-50 border-purple-100">
              <span className="ri-label text-purple-700">Total Laba Acc</span>
              <span className="ri-value text-purple-600">{formatRp(reportData.accTotal)}</span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="section-title text-rose-600">KAS KELUAR</h4>
          <div className="alpha-card-inner border-rose-100">
            <div className="row-item bg-rose-50 border-rose-100">
              <span className="ri-label text-rose-700">Tarik Tunai (BANK IN)</span>
              <span className="ri-value text-rose-600">-{formatRp(reportData.tarikTotal)}</span>
            </div>
          </div>
        </div>

        {/* TOTAL LACI KASIR */}
        <div className="mb-4">
          <div className="total-laci-box">
            <div className="tlb-label-box">
              <span>Total Saldo</span>
              <span>Laci Kasir</span>
            </div>
            <span className="tlb-value">{formatRp(totalCash)}</span>
          </div>
        </div>

        {/* KAS LAINNYA */}
        <div className="mb-4">
          <h4 className="section-title text-purple-600">KAS LAINNYA</h4>
          <div className="alpha-card-inner border-purple-100">
            <div className="row-item bg-purple-50 border-purple-100">
              <span className="ri-label text-purple-700">Total Kasbon</span>
              <span className="ri-value text-purple-600">{formatRp(reportData.kasbonTotal)}</span>
            </div>
            <div className="row-item bg-indigo-50 border-indigo-100">
              <span className="ri-label text-indigo-700">Total Deposit</span>
              <span className="ri-value text-indigo-600">{formatRp(reportData.depositTotal)}</span>
            </div>
          </div>
        </div>

        {/* JURNAL PENYESUAIAN SALDO */}
        <div className="alpha-card border-indigo-100 shadow-indigo">
          <div className="card-header px-1 mb-3">
            <h4 className="ch-title text-indigo-800">JURNAL PENYESUAIAN SALDO</h4>
            <span className="ch-badge bg-indigo-100 text-indigo-700">OTOMATIS</span>
          </div>
          
          <div className="jurnal-list">
            <div className="row-item bg-blue-50 border-blue-100">
              <div>
                <p className="ri-label text-blue-700">1. Sisa Saldo (Buku KINK)</p>
                <p className="ri-sub text-blue-400">Saldo seharusnya di aplikasi KINK</p>
              </div>
              <span className="ri-value text-blue-900">{formatRp(liveBank)}</span>
            </div>

            <div className="row-item bg-emerald-50 border-emerald-100 flex-col-custom">
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <div>
                  <p className="ri-label text-emerald-700">2. Saldo Real App (HP/M-Banking)</p>
                  <p className="ri-sub text-emerald-400">Input manual saldo sebenarnya</p>
                </div>
                <span className="ri-value text-emerald-900">{formatRp(saldoReal)}</span>
              </div>
              
              <button className="btn-update-saldo" onClick={() => setShowSaldoRealModal(true)}>
                <div className="bus-left">
                  <div className="bus-icon"><Clock size={12} /></div>
                  <div className="bus-text">
                    <p>Catat Sisa Saldo M-Banking</p>
                    <span>Input saldo sebenarnya dari HP</span>
                  </div>
                </div>
                <div className="bus-badge">UPDATE</div>
              </button>
            </div>

            <div className={`selisih-box ${selisih === 0 ? 'bg-emerald-600 border-emerald-400' : selisih > 0 ? 'bg-blue-600 border-blue-400' : 'bg-rose-600 border-rose-400'}`}>
              <div>
                <p className="sb-status">
                  {selisih === 0 ? 'STATUS: KLOP' : selisih > 0 ? 'STATUS: SURPLUS' : 'STATUS: SELISIH'}
                </p>
                <p className="sb-desc">
                  {selisih === 0 ? 'Sisa saldo di HP cocok dengan catatan KINK' : selisih > 0 ? 'Saldo di HP lebih besar dari KINK' : 'Saldo di HP lebih kecil (Uang kurang)'}
                </p>
              </div>
              <div className="sb-right">
                <span className="sb-value">{selisih === 0 ? '✓ MATCH' : formatRp(selisih)}</span>
                {selisih !== 0 && <span className="sb-warning">Periksa Kembali</span>}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* MODAL UPDATE SALDO REAL */}
      {showSaldoRealModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowSaldoRealModal(false); }}>
          <div className="modal-card">
            <div className="modal-header-gradient">
              <div>
                <h3>Update Saldo Aplikasi</h3>
                <p>Bisa diinput berkali-kali</p>
              </div>
              <button className="btn-close-modal" onClick={() => setShowSaldoRealModal(false)}>×</button>
            </div>
            
            <div className="modal-body-padding">
              <div className="form-group">
                <label>Keterangan Aplikasi</label>
                <input 
                  type="text" 
                  value={inputSaldoRealKet}
                  onChange={(e) => setInputSaldoRealKet(e.target.value)}
                  className="form-control alpha-input"
                  placeholder="Cth: BRImo, Dana, BCA dll"
                />
              </div>

              <div className="form-group">
                <label>Nominal Saldo</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 900, color: '#94a3b8' }}>Rp</span>
                  <input 
                    type="text"
                    inputMode="numeric"
                    value={inputSaldoReal}
                    onChange={(e) => setInputSaldoReal(formatInput(e.target.value))}
                    className="form-control alpha-input-lg"
                    placeholder="0"
                  />
                </div>
              </div>

              <button
                onClick={handleUpdateSaldoReal}
                disabled={!inputSaldoReal}
                className="btn-submit-gradient"
              >
                SIMPAN SALDO
              </button>
            </div>
          </div>
        </div>
      )}

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
        .text-day { color: #bfdbfe; font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
        .text-date { color: white; font-size: 10px; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 2px; }
        .text-time { color: #dbeafe; font-size: 12px; font-weight: 900; letter-spacing: 1px; }

        .alpha-jurnal-banner {
          margin: -2.5rem 6px 0 6px;
          padding: 1.5rem 1rem 1.25rem 1rem;
          background: linear-gradient(to right, #4338ca, #2563eb);
          border-radius: 0 0 2rem 2rem;
          box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.2);
          position: relative;
          z-index: 10;
        }
        .alpha-jurnal-title { font-size: 14px; font-weight: 700; color: white; letter-spacing: 0.5px; }
        .alpha-jurnal-subtitle { font-size: 10px; color: #bfdbfe; opacity: 0.9; }
        
        .btn-share-alpha {
          background: rgba(255,255,255,0.2); backdrop-filter: blur(4px);
          padding: 6px 12px; border-radius: 20px; color: white; font-size: 10px; font-weight: 800;
          display: flex; align-items: center; gap: 6px; border: none; cursor: pointer; text-transform: uppercase;
        }
        .share-dropdown {
          position: absolute; right: 0; top: 32px; width: 140px; background: white; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
          overflow: hidden; z-index: 50;
        }
        .share-dropdown button {
          width: 100%; text-align: left; padding: 10px 12px; border: none; background: white; font-size: 10px; font-weight: 800;
          display: flex; align-items: center; gap: 8px; cursor: pointer; border-bottom: 1px solid #f1f5f9;
        }
        .share-dropdown button:hover { background: #f8fafc; }

        .alpha-filter-date {
          background: rgba(255,255,255,0.1); margin: 12px 12px 0 12px; padding: 10px 12px;
          border-radius: 12px; border: 1px solid rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: space-between; gap: 8px;
        }
        .filter-label { font-size: 10px; font-weight: 800; color: #1e293b; text-transform: uppercase; display: flex; align-items: center; gap: 4px; }
        .dark .filter-label { color: #f8fafc; }
        .filter-inputs { display: flex; align-items: center; gap: 6px; flex: 1; }
        .filter-inputs input {
          background: white; color: #047857; font-size: 10px; font-weight: 900; border: none; border-radius: 8px; padding: 4px 8px; flex: 1; outline: none;
        }

        .alpha-content-wrapper { padding: 20px 12px; }

        /* Stats Cards */
        .stats-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
        .stat-card { padding: 16px; border-radius: 24px; position: relative; overflow: hidden; color: white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
        .stat-blue { background: linear-gradient(135deg, #3b82f6, #4f46e5); }
        .stat-emerald { background: linear-gradient(135deg, #34d399, #14b8a6); }
        .sc-glow { position: absolute; right: -16px; top: -16px; width: 64px; height: 64px; background: rgba(255,255,255,0.1); border-radius: 50%; filter: blur(10px); }
        .sc-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; opacity: 0.9; }
        .sc-value { font-size: 18px; font-weight: 900; text-shadow: 0 1px 2px rgba(0,0,0,0.1); }

        /* Alpha Card Generic */
        .alpha-card { background: white; border-radius: 24px; padding: 20px; border: 1px solid #f1f5f9; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .dark .alpha-card { background: #1e293b; border-color: #334155; }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .ch-title { font-size: 11px; font-weight: 900; color: #1e293b; text-transform: uppercase; letter-spacing: 1px; }
        .dark .ch-title { color: #f8fafc; }
        .ch-badge { font-size: 9px; font-weight: 900; color: #6366f1; background: #e0e7ff; padding: 2px 8px; border-radius: 8px; text-transform: uppercase; }
        .dark .ch-badge { background: rgba(99,102,241,0.2); }

        .alpha-table { width: 100%; border-collapse: collapse; }
        .alpha-table th { font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; text-align: left; }
        .dark .alpha-table th { border-color: #334155; }
        .alpha-table td { padding: 10px 0; border-bottom: 1px solid #f8fafc; font-size: 11px; color: #1e293b; }
        .dark .alpha-table td { border-color: rgba(51,65,85,0.5); color: #f1f5f9; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        
        .ahc-badge {
          font-size: 9px; font-weight: 900; text-transform: uppercase; padding: 3px 8px; border-radius: 8px; display: inline-block;
        }
        .badge-default { background: #f1f5f9; color: #475569; }
        .badge-blue { background: #eff6ff; color: #1d4ed8; }
        .badge-cyan { background: #ecfeff; color: #0e7490; }
        .badge-orange { background: #fff7ed; color: #c2410c; }
        .badge-emerald { background: #ecfdf5; color: #047857; }
        .badge-rose { background: #fff1f2; color: #be123c; }
        .badge-fuchsia { background: #fdf4ff; color: #a21caf; }
        .text-emerald-600 { color: #059669; }

        .section-title { font-size: 12px; font-weight: 900; letter-spacing: 1px; margin-bottom: 8px; }
        .text-rose-600 { color: #e11d48; }
        .text-purple-600 { color: #7e22ce; }
        
        .alpha-card-inner { background: white; border-radius: 16px; padding: 8px; border: 1px solid #f1f5f9; box-shadow: 0 1px 2px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 6px; }
        .dark .alpha-card-inner { background: #1e293b; border-color: #334155; }
        .row-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-radius: 12px; border: 1px solid; }
        .ri-label { font-size: 11px; font-weight: 800; display: flex; align-items: center; gap: 6px; }
        .ri-value { font-size: 13px; font-weight: 900; }
        .ri-sub { font-size: 9px; font-weight: 600; font-style: italic; margin-top: -2px; }
        
        .bg-gray-50 { background: #f8fafc; } .border-gray-100 { border-color: #f1f5f9; } .text-gray-700 { color: #334155; } .text-gray-800 { color: #1e293b; }
        .bg-emerald-50 { background: rgba(236,253,245,0.5); } .border-emerald-100 { border-color: rgba(209,250,229,0.5); } .text-emerald-700 { color: #047857; }
        .bg-purple-50 { background: rgba(250,245,255,0.5); } .border-purple-100 { border-color: rgba(243,232,255,0.5); } .text-purple-700 { color: #7e22ce; }
        .bg-rose-50 { background: rgba(255,241,242,0.5); } .border-rose-100 { border-color: rgba(255,228,230,0.5); } .text-rose-700 { color: #be123c; }
        .bg-indigo-50 { background: rgba(238,242,255,0.5); } .border-indigo-100 { border-color: rgba(224,231,255,0.5); } .text-indigo-700 { color: #4338ca; } .text-indigo-600 { color: #4f46e5; }
        .bg-blue-50 { background: rgba(239,246,255,0.5); } .border-blue-100 { border-color: rgba(219,234,254,0.5); } .text-blue-700 { color: #1d4ed8; } .text-blue-900 { color: #1e3a8a; } .text-blue-400 { color: #60a5fa; }
        
        .total-laci-box {
          background: #0f172a; padding: 16px; border-radius: 24px; border: 1px solid #1e3a8a;
          display: flex; justify-content: space-between; align-items: center;
          box-shadow: 0 10px 15px -3px rgba(30,58,138,0.3);
          margin: 0 -12px;
        }
        .tlb-label-box {
          border: 1px solid #3b82f6; background: rgba(30,58,138,0.3); border-radius: 12px; padding: 6px 12px;
          display: flex; flex-direction: column;
        }
        .tlb-label-box span { font-size: 9px; font-weight: 900; color: #bfdbfe; text-transform: uppercase; letter-spacing: 2px; line-height: 1.2; }
        .tlb-value { font-size: 24px; font-weight: 900; color: #4ade80; text-shadow: 0 2px 10px rgba(74,222,128,0.3); }

        .shadow-indigo { box-shadow: 0 10px 25px -5px rgba(79,70,229,0.1); margin: 0 -12px; border-radius: 28px; }
        .jurnal-list { display: flex; flex-direction: column; gap: 8px; }
        .flex-col-custom { flex-direction: column; gap: 10px; align-items: flex-start; }
        
        .btn-update-saldo {
          width: 100%; background: linear-gradient(to right, #10b981, #14b8a6); border: none; border-radius: 12px; padding: 10px 12px;
          display: flex; justify-content: space-between; align-items: center; color: white; cursor: pointer; transition: 0.2s;
        }
        .btn-update-saldo:active { transform: scale(0.98); }
        .bus-left { display: flex; align-items: center; gap: 10px; }
        .bus-icon { width: 24px; height: 24px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .bus-text { text-align: left; }
        .bus-text p { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin: 0; }
        .bus-text span { font-size: 8px; font-weight: 600; opacity: 0.9; }
        .bus-badge { background: #facc15; color: #713f12; padding: 4px 10px; border-radius: 8px; font-size: 8px; font-weight: 900; letter-spacing: 1px; }

        .selisih-box {
          margin-top: 8px; padding: 12px 16px; border-radius: 16px; border: 2px solid; display: flex; justify-content: space-between; align-items: center; color: white;
        }
        .bg-emerald-600 { background: #059669; } .border-emerald-400 { border-color: #34d399; }
        .bg-blue-600 { background: #2563eb; } .border-blue-400 { border-color: #60a5fa; }
        .bg-rose-600 { background: #e11d48; } .border-rose-400 { border-color: #fb7185; }
        .sb-status { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
        .sb-desc { font-size: 9px; font-weight: 700; font-style: italic; opacity: 0.9; }
        .sb-right { text-align: right; }
        .sb-value { font-size: 14px; font-weight: 900; display: block; }
        .sb-warning { font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; }

        .modal-header-gradient {
          background: linear-gradient(to right, #059669, #0d9488); padding: 16px 24px; color: white;
          display: flex; justify-content: space-between; align-items: center; border-radius: 28px 28px 0 0;
        }
        .modal-header-gradient h3 { font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
        .modal-header-gradient p { font-size: 9px; font-weight: 600; color: #d1fae5; }
        .btn-close-modal { width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.2); border: none; color: white; font-size: 16px; cursor: pointer; }
        
        .modal-body-padding { padding: 24px; }
        .alpha-input { width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 16px; font-size: 12px; font-weight: 700; color: #1e293b; outline: none; }
        .alpha-input:focus { border-color: #10b981; }
        .alpha-input-lg { width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px 16px 16px 48px; border-radius: 16px; font-size: 16px; font-weight: 900; color: #1e293b; outline: none; }
        .alpha-input-lg:focus { border-color: #10b981; }
        
        .btn-submit-gradient {
          width: 100%; background: linear-gradient(to right, #059669, #0d9488); border: none; border-radius: 16px; padding: 16px;
          color: white; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; margin-top: 8px; box-shadow: 0 10px 15px -3px rgba(16,185,129,0.3); transition: 0.2s;
        }
        .btn-submit-gradient:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-submit-gradient:active:not(:disabled) { transform: scale(0.98); }
        .dark .modal-card { background: #1e293b; border: 1px solid #334155; }
        .dark .alpha-input, .dark .alpha-input-lg { background: #0f172a; border-color: #334155; color: #f8fafc; }
      `}</style>
    </div>
  );
};

export default ReportsPage;
