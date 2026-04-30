import React, { useState, useEffect } from 'react';
import { HistoryItem, Balances, UserProfile } from '../../types';
import { ArrowLeft, Download, Share2, TrendingUp, Wallet, DollarSign, Tag, CreditCard, PieChart, Calendar } from 'lucide-react';
import { formatRp } from '../../utils/formatters';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface ReportsPageProps {
  history: HistoryItem[];
  profile: UserProfile | null;
  onBack: () => void;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ history, profile, onBack }) => {
  const [filterTglStart, setFilterTglStart] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterTglEnd, setFilterTglEnd] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [reportData, setReportData] = useState({
    filteredHistory: [] as HistoryItem[],
    catStats: {} as Record<string, { count: number, total: number }>,
    salesTotal: 0,
    adminTotal: 0,
    accTotal: 0,
    tarikTotal: 0,
    kasbonTotal: 0,
    depositTotal: 0,
    totalCash: 0,
    sisaCash: 0,
    finalBalBank: 0,
    finalBalKas: 0
  });

  useEffect(() => {
    const filtered = history.filter(h => {
      if (!h.tgl) return false;
      const itemDate = h.tgl.split('T')[0];
      return itemDate >= filterTglStart && itemDate <= filterTglEnd;
    });

    const stats = filtered.reduce((acc, h) => {
      const key = h.kat;
      if (!acc[key]) acc[key] = { count: 0, total: 0 };
      acc[key].count += 1;
      acc[key].total += (h.amt || 0);
      return acc;
    }, {} as Record<string, { count: number, total: number }>);

    let sales = 0, admin = 0, acc = 0, tarik = 0, kasbon = 0, deposit = 0;

    filtered.forEach(h => {
      const cat = profile?.categories.find(c => c.id === h.katId || c.name === h.kat);
      const logic = cat?.logicType;

      admin += (h.fee || 0);

      if (logic === 'BANK_OUT') sales += (h.amt || 0);
      else if (logic === 'BANK_IN') tarik += (h.amt || 0);
      else if (logic === 'LABA_ACC') acc += (h.amt || 0);
      else if (logic === 'LABA_ADMIN') admin += (h.amt || 0);
      else if (h.kat === 'KASBON') kasbon += (h.amt || 0);
      else if (h.kat === 'DEPOSIT') deposit += (h.amt || 0);
    });

    const sisa = sales - tarik + kasbon; // Kasbon masuk juga menambah cash
    const total = sisa + admin + acc;

    // Ambil saldo terakhir dari transaksi terakhir di periode ini
    // history biasanya DESC (terbaru di atas), jadi ambil index 0 jika ada
    const lastItem = filtered[0]; 

    setReportData({
      filteredHistory: filtered,
      catStats: stats,
      salesTotal: sales,
      adminTotal: admin,
      accTotal: acc,
      tarikTotal: tarik,
      kasbonTotal: kasbon,
      depositTotal: deposit,
      totalCash: total,
      sisaCash: sisa,
      finalBalBank: lastItem?.balBank ?? 0,
      finalBalKas: lastItem?.balKas ?? 0
    });
  }, [history, filterTglStart, filterTglEnd, profile]);

  const exportPDF = (mode: 'download' | 'share') => {
    const element = document.getElementById('report-content');
    const opt = {
      margin: 10,
      filename: `Laporan_KINK_${new Date().toLocaleDateString('id-ID')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (mode === 'download') {
      html2pdf().set(opt).from(element).save();
    } else {
      html2pdf().set(opt).from(element).outputPdf('blob').then((blob: Blob) => {
        const file = new File([blob], opt.filename, { type: 'application/pdf' });
        if (navigator.share) {
          navigator.share({
            files: [file],
            title: 'Laporan Keuangan KINK',
            text: 'Berikut adalah laporan keuangan dari KINK POS.'
          });
        } else {
          alert("Sharing not supported on this browser.");
        }
      });
    }
  };

  return (
    <div id="view-laporan" className="page-view">
      <div className="page-header">
        <button className="btn-back" onClick={onBack}><ArrowLeft size={20} /></button>
        <div className="page-title">Laporan Keuangan</div>
      </div>
      <div className="page-content">
        
        {/* Filter Tanggal */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px', background: 'var(--card)', padding: '15px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '10px' }}>Mulai</label>
            <input type="date" className="form-control" value={filterTglStart} onChange={(e) => setFilterTglStart(e.target.value)} style={{ padding: '8px', fontSize: '12px' }} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '10px' }}>Sampai</label>
            <input type="date" className="form-control" value={filterTglEnd} onChange={(e) => setFilterTglEnd(e.target.value)} style={{ padding: '8px', fontSize: '12px' }} />
          </div>
        </div>

        <div id="report-content" className="report-container">
          <div className="report-header">
            <div className="report-brand">KINK REPORT</div>
            <div className="report-date">
              <Calendar size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              {filterTglStart === filterTglEnd ? filterTglStart : `${filterTglStart} s/d ${filterTglEnd}`}
            </div>
          </div>

          {/* RINGKASAN SALDO (Snapshot Historis) */}
          <div className="report-section total-box" style={{ background: 'var(--accent-light)', border: 'none', marginBottom: '25px' }}>
            <div className="section-title" style={{ color: 'var(--accent)', borderLeftColor: 'var(--accent)' }}>
              🏛️ SALDO AKHIR PERIODE
            </div>
            <div className="report-row" style={{ marginBottom: '5px' }}>
              <span>Saldo Bank:</span>
              <strong>{formatRp(reportData.finalBalBank)}</strong>
            </div>
            <div className="report-row">
              <span>Saldo Kas:</span>
              <strong>{formatRp(reportData.finalBalKas)}</strong>
            </div>
            <div style={{ fontSize: '9px', color: 'var(--accent)', marginTop: '5px', opacity: 0.8 }}>
              *Menampilkan saldo terakhir yang tercatat pada periode ini.
            </div>
          </div>
          
          <div className="report-section">
            <div className="section-title">
              <PieChart size={16} /> RINCIAN KATEGORI
            </div>
            <div className="cat-list">
              {Object.entries(reportData.catStats).map(([name, stat]) => (
                <div key={name} className="report-row">
                  <span>{name} ({stat.count}x)</span>
                  <strong>{formatRp(stat.total)}</strong>
                </div>
              ))}
              {Object.keys(reportData.catStats).length === 0 && (
                <div className="text-muted text-center" style={{ padding: '10px' }}>Tidak ada transaksi di periode ini</div>
              )}
            </div>
          </div>

          <div className="divider-line"></div>

          <div className="report-section">
            <div className="report-row">
              <span className="label-with-icon"><TrendingUp size={16} color="#2563eb" /> TOTAL PENJUALAN</span>
              <strong className="text-accent">{formatRp(reportData.salesTotal)}</strong>
            </div>
            <div className="report-row">
              <span className="label-with-icon"><Wallet size={16} color="#10b981" /> Sisa Cash Penjualan</span>
              <strong>{formatRp(reportData.sisaCash)}</strong>
            </div>
            <div className="report-row">
              <span className="label-with-icon"><DollarSign size={16} color="#f59e0b" /> Admin</span>
              <strong>{formatRp(reportData.adminTotal)}</strong>
            </div>
            <div className="report-row">
              <span className="label-with-icon"><Tag size={16} color="#8b5cf6" /> Aksesoris</span>
              <strong>{formatRp(reportData.accTotal)}</strong>
            </div>
            <div className="report-row">
              <span className="label-with-icon"><CreditCard size={16} color="#ef4444" /> Non Tunai</span>
              <strong>Rp 0</strong>
            </div>
          </div>

          <div className="divider-line"></div>

          <div className="report-section total-box">
            <div className="report-row main-total">
              <span className="label-with-icon">💰 TOTAL UANG CASH</span>
              <strong className="text-success">{formatRp(reportData.totalCash)}</strong>
            </div>
            <div className="formula-note">
              Sisa Cash: {formatRp(reportData.sisaCash)} + Admin: {formatRp(reportData.adminTotal)} + Aks: {formatRp(reportData.accTotal)}
            </div>
          </div>

          <div className="report-footer">
            Dihasilkan secara otomatis oleh KINK System • {new Date().toLocaleString('id-ID')}
          </div>
        </div>

        <div className="report-actions">
          <button 
            className="btn-action btn-pdf"
            onClick={() => exportPDF('download')}
          >
            <Download size={18} /> Simpan PDF
          </button>
          <button 
            className="btn-action btn-share"
            onClick={() => exportPDF('share')}
          >
            <Share2 size={18} /> Bagikan
          </button>
        </div>
      </div>

      <style>{`
        .report-container {
          background: white;
          padding: 30px 24px;
          border-radius: 20px;
          color: #1e293b;
          box-shadow: var(--shadow);
        }
        .report-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .report-brand {
          font-size: 24px;
          font-weight: 900;
          color: var(--accent);
          letter-spacing: 2px;
          margin-bottom: 5px;
        }
        .report-date {
          font-size: 11px;
          color: #64748b;
          font-weight: 600;
        }
        .report-section {
          margin-bottom: 20px;
        }
        .section-title {
          font-size: 13px;
          font-weight: 800;
          color: #64748b;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-left: 4px solid var(--accent);
          padding-left: 10px;
        }
        .report-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-size: 14px;
        }
        .label-with-icon {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
        }
        .divider-line {
          height: 1px;
          background: #e2e8f0;
          margin: 20px 0;
          border: none;
        }
        .total-box {
          background: #f8fafc;
          padding: 20px;
          border-radius: 16px;
          border: 1.5px dashed var(--border);
        }
        .main-total {
          font-size: 16px;
          font-weight: 800;
          margin-bottom: 8px;
        }
        .text-accent { color: var(--accent); }
        .text-success { color: var(--success); }
        .formula-note {
          font-size: 10px;
          color: #94a3b8;
          font-weight: 600;
          text-align: center;
          margin-top: 10px;
          font-style: italic;
        }
        .report-footer {
          margin-top: 40px;
          text-align: center;
          font-size: 10px;
          color: #cbd5e1;
          font-weight: 700;
          text-transform: uppercase;
        }
        .report-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 24px;
        }
        .btn-action {
          height: 52px;
          border-radius: 16px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
          transition: 0.2s;
        }
        .btn-pdf {
          background: #f1f5f9;
          color: var(--text);
        }
        .btn-share {
          background: var(--accent);
          color: white;
          box-shadow: 0 8px 16px -4px rgba(37,99,235,0.4);
        }
        .btn-action:active { transform: scale(0.96); }
      `}</style>
    </div>
  );
};

export default ReportsPage;
