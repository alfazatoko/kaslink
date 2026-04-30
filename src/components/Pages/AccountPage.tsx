import React, { useState, useEffect } from 'react';
import { UserProfile, Category, Balances } from '../../types';
import { 
  auth, 
  db, 
  doc, 
  signOut, 
  setDoc,
  updatePassword 
} from '../../services/firebase';
import { ArrowLeft, Save, LogOut, Tags, Plus, Trash2, ChevronDown, ChevronUp, RotateCcw, AlertTriangle } from 'lucide-react';
import { generateId } from '../../utils/formatters';
import { useDataActions } from '../../hooks/useDataActions';
import Modal from '../Common/Modal';

interface AccountPageProps {
  profile: UserProfile | null;
  balances: Balances;
  onBack: () => void;
}

const AccountPage: React.FC<AccountPageProps> = ({ profile, balances, onBack }) => {
  const { resetBalances, resetAllData } = useDataActions(balances, profile);
  
  const [toko, setToko] = useState('');
  const [defaultKatId, setDefaultKatId] = useState('');
  const [newPass, setNewPass] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [showPass, setShowPass] = useState(false);
  
  const [showConfirm, setShowConfirm] = useState<'saldo' | 'semua' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  useEffect(() => {
    if (profile) {
      setToko(profile.toko || '');
      const existingCats = (profile.categories || []).map((c: any) => ({
        id: c.id || generateId(),
        name: c.name || '',
        logicType: c.logicType || (c.role === 'bank_out' ? 'BANK_OUT' : c.role === 'bank_in' ? 'BANK_IN' : c.role === 'cash_in' ? 'LABA_ACC' : 'NONE'),
        role: c.role || 'none'
      }));
      setCategories(existingCats);

      const defCat = existingCats.find(c => c.id === profile.defaultCategory || c.name === profile.defaultCategory);
      setDefaultKatId(defCat?.id || '');
    }
  }, [profile]);

  const handleUpdateCat = (id: string, field: keyof Category, value: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleAddCat = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newCat: Category = {
      id: generateId(),
      name: '',
      logicType: 'NONE'
    };
    setCategories([...categories, newCat]);
    setShowCategories(true);
  };

  const handleDeleteCat = (id: string) => {
    if (categories.length <= 1) return alert("Minimal harus ada 1 kategori");
    if (confirm("Hapus kategori ini?")) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  const handleUpdateProfile = async () => {
    if (!auth.currentUser || saveStatus !== 'idle') return;
    setSaveStatus('saving');
    try {
      const uid = auth.currentUser.uid;
      await setDoc(doc(db, `${uid}_profile`, 'data'), {
        toko,
        defaultCategory: defaultKatId,
        categories
      }, { merge: true });

      if (newPass) {
        try {
          await updatePassword(auth.currentUser, newPass);
        } catch (pErr: any) {
          if (pErr.code === 'auth/requires-recent-login') {
            alert("Untuk ganti password, Anda perlu Login ulang demi keamanan.");
            signOut(auth);
            return;
          }
          throw pErr;
        }
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err: any) {
      alert("Gagal Update: " + err.message);
      setSaveStatus('idle');
    }
  };

  const executeReset = async () => {
    if (!showConfirm) return;
    setIsProcessing(true);
    try {
      if (showConfirm === 'saldo') {
        await resetBalances();
        alert("Semua Saldo Berhasil di Reset ke 0!");
      } else {
        await resetAllData();
        alert("Semua Data Berhasil Dihapus!");
      }
    } catch (e) {
      alert("Gagal melakukan reset");
    }
    setIsProcessing(false);
    setShowConfirm(null);
  };

  return (
    <div id="view-akun" className="page-view">
      <div className="page-header">
        <button className="btn-back" onClick={onBack}><ArrowLeft size={20} /></button>
        <div className="page-title">Pengaturan Akun</div>
      </div>
      <div className="page-content">
        
        {/* Reset Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <button 
            onClick={() => setShowConfirm('saldo')}
            className="btn-submit" 
            style={{ 
              background: '#f1f5f9', 
              color: 'var(--text)',
              fontSize: '11px',
              padding: '12px 5px',
              height: 'auto',
              boxShadow: 'none',
              border: '1px solid var(--border)'
            }}
          >
            <RotateCcw size={14} /> Reset Saldo
          </button>

          <button 
            onClick={() => setShowConfirm('semua')}
            className="btn-submit" 
            style={{ 
              background: '#f1f5f9', 
              color: 'var(--text)',
              fontSize: '11px',
              padding: '12px 5px',
              height: 'auto',
              boxShadow: 'none',
              border: '1px solid var(--border)'
            }}
          >
            <RotateCcw size={14} /> Reset Semua
          </button>
        </div>

        {/* Confirmation Modal */}
        <Modal 
          isOpen={!!showConfirm} 
          onClose={() => !isProcessing && setShowConfirm(null)} 
          title={showConfirm === 'saldo' ? "🔄 Reset Saldo" : "⚠️ Hapus Semua Data"}
        >
          <div style={{ padding: '10px 0', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.5' }}>
              {showConfirm === 'saldo' 
                ? "Apakah Anda yakin ingin mereset semua saldo (Bank, Kas, Laba, dll) kembali ke Rp 0? Tindakan ini tidak dapat dibatalkan."
                : "PERHATIAN! Anda akan menghapus seluruh data riwayat, laporan, dan saldo. Tindakan ini permanen dan data tidak dapat dikembalikan."}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setShowConfirm(null)} 
                className="btn-submit" 
                style={{ background: '#f1f5f9', color: 'var(--text)', boxShadow: 'none' }}
                disabled={isProcessing}
              >
                Batal
              </button>
              <button 
                onClick={executeReset} 
                className="btn-submit" 
                style={{ background: 'var(--danger)', color: 'white' }}
                disabled={isProcessing}
              >
                {isProcessing ? 'Memproses...' : (showConfirm === 'saldo' ? 'Ya, Reset Saldo' : 'Ya, Hapus Semua')}
              </button>
            </div>
          </div>
        </Modal>

        <div className="form-group">
          <label>Nama Toko</label>
          <input 
            type="text" 
            className="form-control" 
            value={toko}
            onChange={(e) => setToko(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Kategori Default</label>
          <select 
            className="form-control"
            value={defaultKatId}
            onChange={(e) => setDefaultKatId(e.target.value)}
          >
            <option value="">-- Pilih Default --</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name || '(Tanpa Nama)'}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="text" className="form-control" value={profile?.email || ''} readOnly />
        </div>

        <div className="form-group">
          <label>Password Baru (Kosongkan jika tidak ganti)</label>
          <div className="password-wrapper" style={{ position: 'relative' }}>
            <input 
              type={showPass ? 'text' : 'password'} 
              className="form-control" 
              placeholder="••••••••"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
            />
            <span 
              className="eye-icon" 
              style={{ position: 'absolute', right: '15px', top: '12px', cursor: 'pointer' }}
              onClick={() => setShowPass(!showPass)}
            >
              {showPass ? '👁️' : '🙈'}
            </span>
          </div>
        </div>

        {/* Expandable Category Settings */}
        <div className="form-group" style={{ border: '1px solid var(--border)', padding: '15px', borderRadius: '15px', marginTop: '10px' }}>
          <div 
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => setShowCategories(!showCategories)}
          >
            <label style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, cursor: 'pointer' }}>
              <Tags size={16} /> PENGATURAN KATEGORI
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button 
                onClick={handleAddCat}
                style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', cursor: 'pointer' }}
              >
                <Plus size={14} /> Tambah
              </button>
              {showCategories ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </div>
          
          {showCategories && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
              {categories.map((c) => (
                <div key={c.id} style={{ background: 'var(--bg)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)', position: 'relative' }}>
                  <button 
                    onClick={() => handleDeleteCat(c.id)}
                    style={{ position: 'absolute', right: '10px', top: '10px', background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={c.name} 
                    onChange={(e) => handleUpdateCat(c.id, 'name', e.target.value)}
                    style={{ marginBottom: '5px', paddingRight: '35px' }} 
                    placeholder="Nama Kategori (Contoh: Seabank, Aksesoris)" 
                  />
                  <select 
                    className="form-control" 
                    value={c.logicType}
                    onChange={(e) => handleUpdateCat(c.id, 'logicType', e.target.value as any)}
                    style={{ fontSize: '11px', padding: '6px' }}
                  >
                    <option value="BANK_OUT">- Bank, + Kas (Transfer/Isi Saldo)</option>
                    <option value="BANK_IN">+ Bank, - Kas (Tarik Tunai)</option>
                    <option value="LABA_ACC">+ Laba Acc (Aksesoris)</option>
                    <option value="LABA_ADMIN">+ Laba Admin (Fee/Lainnya)</option>
                    <option value="NONE">Hanya Catatan (Tidak Pengaruhi Saldo)</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        <button 
          className="btn-submit" 
          onClick={handleUpdateProfile} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '8px',
            background: saveStatus === 'success' ? 'var(--success)' : 'var(--accent)',
            transition: '0.3s'
          }}
          disabled={saveStatus !== 'idle'}
        >
          {saveStatus === 'idle' && <><Save size={18} /> SIMPAN PENGATURAN</>}
          {saveStatus === 'saving' && 'MENYIMPAN...'}
          {saveStatus === 'success' && '✅ TERSIMPAN!'}
        </button>
        <button 
          className="btn-submit" 
          style={{ background: 'var(--danger)', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} 
          onClick={() => signOut(auth)}
        >
          <LogOut size={18} /> KELUAR AKUN
        </button>
      </div>
    </div>
  );
};

export default AccountPage;
