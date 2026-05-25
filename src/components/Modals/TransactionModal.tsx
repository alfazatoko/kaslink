import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../../types';
import Modal from '../Common/Modal';
import { formatInput, getInt, formatRp } from '../../utils/formatters';
import { CheckCircle, XCircle } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onSave: (kat: string, nom: number, fee: number, ket: string) => Promise<void>;
}

// ── Toast Notification ──────────────────────────────────────
interface ToastProps {
  type: 'success' | 'error';
  message: string;
  detail?: string;
  onDone: () => void;
}

const Toast: React.FC<ToastProps> = ({ type, message, detail, onDone }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // mount → slide in
    const t1 = setTimeout(() => setVisible(true), 10);
    // after 2.5s → slide out → unmount
    const t2 = setTimeout(() => setVisible(false), 2500);
    const t3 = setTimeout(() => onDone(), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const isSuccess = type === 'success';

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: `translateX(-50%) translateY(${visible ? '0' : '-80px'})`,
      opacity: visible ? 1 : 0,
      transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease',
      zIndex: 9999,
      minWidth: '280px',
      maxWidth: '340px',
      background: isSuccess ? '#fff' : '#fff',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)',
      border: `1.5px solid ${isSuccess ? '#bbf7d0' : '#fecaca'}`,
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
    }}>
      {/* Icon */}
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
        background: isSuccess ? '#dcfce7' : '#fee2e2',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isSuccess
          ? <CheckCircle size={20} color="#16a34a" />
          : <XCircle size={20} color="#dc2626" />
        }
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '14px', fontWeight: 800,
          color: isSuccess ? '#15803d' : '#dc2626',
          marginBottom: detail ? '3px' : 0,
        }}>
          {message}
        </div>
        {detail && (
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, lineHeight: 1.4 }}>
            {detail}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '3px', borderRadius: '0 0 16px 16px',
        background: isSuccess ? '#bbf7d0' : '#fecaca',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: isSuccess ? '#16a34a' : '#dc2626',
          animation: 'toastProgress 2.5s linear forwards',
        }} />
      </div>

      <style>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
};

// ── Main Modal ───────────────────────────────────────────────
const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, profile, onSave }) => {
  const [katId, setKatId]   = useState('');
  const [nom,   setNom]     = useState('');
  const [fee,   setFee]     = useState('');
  const [ket,   setKet]     = useState('');
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string; detail?: string } | null>(null);

  // Refs untuk navigasi Enter
  const refKat = useRef<HTMLSelectElement>(null);
  const refNom = useRef<HTMLInputElement>(null);
  const refFee = useRef<HTMLInputElement>(null);
  const refKet = useRef<HTMLInputElement>(null);
  const refBtn = useRef<HTMLButtonElement>(null);

  // Reset & fokus saat modal dibuka
  useEffect(() => {
    if (isOpen && profile) {
      const defaultId = profile.defaultCategory || profile.categories?.[0]?.id || '';
      setKatId(defaultId);
      setNom('');
      setFee('');
      setKet('');
      setSaving(false);
      setTimeout(() => refNom.current?.focus(), 150);
    }
  }, [isOpen]);

  // Enter di select → fokus nominal
  const onKatKeyDown = (e: React.KeyboardEvent<HTMLSelectElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); refNom.current?.focus(); }
  };

  // Enter di input → fokus field berikutnya
  const onNomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); refFee.current?.focus(); }
  };
  const onFeeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); refKet.current?.focus(); }
  };
  const onKetKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); refBtn.current?.click(); }
  };

  const showToast = (type: 'success' | 'error', message: string, detail?: string) => {
    setToast({ type, message, detail });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nominal  = getInt(nom);
    const adminFee = getInt(fee);

    if (!katId)       return showToast('error', 'Pilih kategori terlebih dahulu');
    if (nominal <= 0) return showToast('error', 'Nominal harus diisi');

    setSaving(true);
    try {
      await onSave(katId, nominal, adminFee, ket);

      const katName = profile?.categories?.find(c => c.id === katId)?.name || '';
      showToast('success', 'Transaksi Berhasil Disimpan', `${katName} • Rp ${nominal.toLocaleString('id-ID')}${adminFee > 0 ? ` • Admin Rp ${adminFee.toLocaleString('id-ID')}` : ''}`);

      // Reset form & tutup modal setelah toast muncul
      setNom(''); setFee(''); setKet('');
      setTimeout(() => {
        onClose();
        setToast(null);
      }, 1800);
    } catch (err: any) {
      showToast('error', 'Gagal Menyimpan', err.message);
    } finally {
      setSaving(false);
    }
  };

  const selectedCat = profile?.categories?.find(c => c.id === katId);

  return (
    <>
      {/* Toast di luar modal agar tidak terclip */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          detail={toast.detail}
          onDone={() => setToast(null)}
        />
      )}

      <Modal isOpen={isOpen} onClose={onClose} title="💸 Transaksi Baru">
        <form onSubmit={handleSubmit} autoComplete="off">

          {/* Kategori */}
          <div className="form-group">
            <label>Kategori</label>
            <select
              ref={refKat}
              className="form-control"
              value={katId}
              onChange={(e) => setKatId(e.target.value)}
              onKeyDown={onKatKeyDown}
            >
              <option value="">-- Pilih Kategori --</option>
              {profile?.categories?.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {selectedCat && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>
                {selectedCat.logicType === 'BANK_OUT' && '↓ Bank  ↑ Kas'}
                {selectedCat.logicType === 'BANK_IN'  && '↑ Bank  ↓ Kas'}
                {selectedCat.logicType === 'LABA_ACC'   && '↑ Laba Acc'}
                {selectedCat.logicType === 'LABA_ADMIN' && '↑ Laba Admin'}
                {selectedCat.logicType === 'NONE'       && 'Hanya catatan'}
              </div>
            )}
          </div>

          {/* Nominal */}
          <div className="form-group">
            <label>Nominal (Rp)</label>
            <input
              ref={refNom}
              type="text"
              className="form-control"
              inputMode="numeric"
              value={nom}
              onChange={(e) => setNom(formatInput(e.target.value))}
              onKeyDown={onNomKeyDown}
              placeholder="0"
              required
            />
          </div>

          {/* Admin Fee */}
          <div className="form-group">
            <label>Admin Fee / Laba</label>
            <input
              ref={refFee}
              type="text"
              className="form-control"
              inputMode="numeric"
              value={fee}
              onChange={(e) => setFee(formatInput(e.target.value))}
              onKeyDown={onFeeKeyDown}
              placeholder="0"
            />
          </div>

          {/* Keterangan */}
          <div className="form-group">
            <label>Keterangan</label>
            <input
              ref={refKet}
              type="text"
              className="form-control"
              placeholder="Opsional..."
              value={ket}
              onChange={(e) => setKet(e.target.value)}
              onKeyDown={onKetKeyDown}
            />
          </div>

          <button
            ref={refBtn}
            type="submit"
            className="btn-submit"
            disabled={saving}
            style={{ opacity: saving ? 0.7 : 1, transition: '0.2s' }}
          >
            {saving ? 'Menyimpan...' : 'SIMPAN TRANSAKSI  ↵'}
          </button>
        </form>
      </Modal>
    </>
  );
};

export default TransactionModal;
