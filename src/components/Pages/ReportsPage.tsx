import React from 'react';
import { HistoryItem, Balances } from '../../types';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import { formatRp } from '../../utils/formatters';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface ReportsPageProps {
  history: HistoryItem[];
  balances: Balances;
  onBack: () => void;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ history, balances, onBack }) => {
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
        <div id="report-content" style={{ background: 'white', padding: '20px', borderRadius: '15px', color: 'black' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{ color: 'var(--accent)' }}>KINK REPORT</h2>
            <p style={{ fontSize: '12px' }}>Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
          </div>
          
          <div style={{ marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>RINGKASAN SALDO</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>Saldo Bank:</span>
              <strong>{formatRp(balances.bank)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>Saldo Kas:</span>
              <strong>{formatRp(balances.sales + balances.admin + balances.acc - balances.tarik)}</strong>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>PERFORMA LABA</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>Laba Admin:</span>
              <strong>{formatRp(balances.admin)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>Laba Aksesoris:</span>
              <strong>{formatRp(balances.acc)}</strong>
            </div>
          </div>

          <div style={{ marginTop: '30px', fontSize: '10px', textAlign: 'center', color: '#888' }}>
            Dihasilkan secara otomatis oleh KINK System
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' }}>
          <button 
            className="btn-submit" 
            style={{ background: '#f1f5f9', color: 'var(--text)', boxShadow: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            onClick={() => exportPDF('download')}
          >
            <Download size={16} /> PDF
          </button>
          <button 
            className="btn-submit" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            onClick={() => exportPDF('share')}
          >
            <Share2 size={16} /> Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
