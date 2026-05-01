import React, { useState, useEffect } from 'react';
import { UserProfile, Category, Balances, CustomColors } from '../../types';
import { 
  auth, 
  db, 
  doc, 
  signOut, 
  setDoc,
  updatePassword 
} from '../../services/firebase';
import { ArrowLeft, Save, LogOut, Tags, Plus, Trash2, ChevronDown, ChevronUp, RotateCcw, AlertTriangle, User, Palette, ChevronRight, Wallet } from 'lucide-react';
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
  const [colors, setColors] = useState<CustomColors>({});
  const [showPass, setShowPass] = useState(false);
  
  const [showConfirm, setShowConfirm] = useState<'saldo' | 'semua' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Accordion States
  const [openSection, setOpenSection] = useState<string | null>(null);
  
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
      setColors(profile.colors || {});

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
    setOpenSection('categories');
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
        categories,
        colors
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

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const updateColor = (key: keyof CustomColors, val: string) => {
    setColors(prev => ({ ...prev, [key]: val }));
  };

  const SectionHeader = ({ id, icon: Icon, title, active }: { id: string, icon: any, title: string, active: boolean }) => (
    <div 
      onClick={() => toggleSection(id)}
      style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '18px 20px', 
        background: 'var(--card)',
        borderRadius: '18px',
        border: '1px solid var(--border)',
        cursor: 'pointer',
        marginBottom: '10px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: active ? '0 10px 15px -3px rgba(0,0,0,0.05)' : 'none',
        transform: active ? 'scale(1.02)' : 'scale(1)',
        zIndex: active ? 2 : 1,
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ 
          width: '38px', 
          height: '38px', 
          borderRadius: '12px', 
          background: active ? (colors.theme || 'var(--accent)') : 'var(--bg)', 
          color: active ? 'white' : 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: '0.3s'
        }}>
          <Icon size={20} />
        </div>
        <span style={{ fontWeight: 700, fontSize: '15px', color: active ? 'var(--text)' : 'var(--text)' }}>{title}</span>
      </div>
      <div style={{ 
        transform: active ? 'rotate(90deg)' : 'rotate(0deg)', 
        transition: '0.3s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: active ? (colors.theme || 'var(--accent)') : 'var(--text-muted)'
      }}>
        <ChevronRight size={20} />
      </div>
    </div>
  );

  return (
    <div id="view-akun" className="page-view">
      <div className="page-header">
        <button className="btn-back" onClick={onBack}><ArrowLeft size={20} /></button>
        <div className="page-title">Pengaturan</div>
      </div>
      <div className="page-content">
        
        {/* Section: Profile */}
        <SectionHeader id="profile" icon={User} title="Profil Toko" active={openSection === 'profile'} />
        {openSection === 'profile' && (
          <div style={{ padding: '5px 10px 20px', animation: 'slideDown 0.2s ease-out' }}>
            <div className="form-group">
              <label>Nama Toko</label>
              <input type="text" className="form-control" value={toko} onChange={(e) => setToko(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Kategori Default</label>
              <select className="form-control" value={defaultKatId} onChange={(e) => setDefaultKatId(e.target.value)}>
                <option value="">-- Pilih Default --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name || '(Tanpa Nama)'}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Email (Read Only)</label>
              <input type="text" className="form-control" value={profile?.email || ''} readOnly style={{ opacity: 0.7 }} />
            </div>
            <div className="form-group">
              <label>Ganti Password</label>
              <div className="password-wrapper" style={{ position: 'relative' }}>
                <input 
                  type={showPass ? 'text' : 'password'} 
                  className="form-control" 
                  placeholder="Isi jika ingin ganti"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                />
                <span style={{ position: 'absolute', right: '15px', top: '12px', cursor: 'pointer' }} onClick={() => setShowPass(!showPass)}>
                  {showPass ? '👁️' : '🙈'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Section: Categories */}
        <SectionHeader id="categories" icon={Tags} title="Edit Nama Kategori" active={openSection === 'categories'} />
        {openSection === 'categories' && (
          <div style={{ padding: '5px 10px 20px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
               <button onClick={handleAddCat} className="btn-submit" style={{ padding: '10px', fontSize: '12px', background: '#f1f5f9', color: 'var(--text)', border: '1px solid var(--border)', boxShadow: 'none' }}>
                <Plus size={14} /> Tambah Kategori
               </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {categories.map((c) => (
                <div key={c.id} style={{ background: 'var(--card)', padding: '12px', borderRadius: '14px', border: '1px solid var(--border)', position: 'relative' }}>
                  <button onClick={() => handleDeleteCat(c.id)} style={{ position: 'absolute', right: '10px', top: '10px', background: 'transparent', border: 'none', color: 'var(--danger)' }}>
                    <Trash2 size={16} />
                  </button>
                  <input type="text" className="form-control" value={c.name} onChange={(e) => handleUpdateCat(c.id, 'name', e.target.value)} style={{ marginBottom: '8px', paddingRight: '35px' }} placeholder="Nama Kategori" />
                  <select className="form-control" value={c.logicType} onChange={(e) => handleUpdateCat(c.id, 'logicType', e.target.value as any)} style={{ fontSize: '11px', padding: '8px' }}>
                    <option value="BANK_OUT">- Bank, + Kas (Transfer/Isi Saldo)</option>
                    <option value="BANK_IN">+ Bank, - Kas (Tarik Tunai)</option>
                    <option value="LABA_ACC">+ Laba Acc (Aksesoris)</option>
                    <option value="LABA_ADMIN">+ Laba Admin (Fee/Lainnya)</option>
                    <option value="NONE">Hanya Catatan (Tidak Pengaruhi Saldo)</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: Colors Theme */}
        <SectionHeader id="colors_theme" icon={Palette} title="Pengaturan Warna Tema" active={openSection === 'colors_theme'} />
        {openSection === 'colors_theme' && (
          <div style={{ padding: '5px 15px 25px', animation: 'slideDown 0.3s ease-out' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Warna Tema Utama (Tombol & Aksen)</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="color" className="form-control" style={{ height: '50px', width: '80px', padding: '5px', cursor: 'pointer' }} value={colors.theme || '#2563eb'} onChange={(e) => updateColor('theme', e.target.value)} />
                  <input type="text" className="form-control" value={colors.theme || '#2563eb'} onChange={(e) => updateColor('theme', e.target.value)} style={{ textTransform: 'uppercase' }} />
                </div>
              </div>
              <div className="form-group">
                <label>Warna Background Aplikasi</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="color" className="form-control" style={{ height: '50px', width: '80px', padding: '5px', cursor: 'pointer' }} value={colors.appBg || '#f8fafc'} onChange={(e) => updateColor('appBg', e.target.value)} />
                  <input type="text" className="form-control" value={colors.appBg || '#f8fafc'} onChange={(e) => updateColor('appBg', e.target.value)} style={{ textTransform: 'uppercase' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section: Colors Saldo */}
        <SectionHeader id="colors_saldo" icon={Wallet} title="Pengaturan Warna Saldo" active={openSection === 'colors_saldo'} />
        {openSection === 'colors_saldo' && (
          <div style={{ padding: '5px 15px 25px', animation: 'slideDown 0.3s ease-out' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
              <div className="form-group" style={{ background: 'var(--card)', padding: '15px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <label>Warna Kartu Saldo Bank</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="color" className="form-control" style={{ height: '45px', width: '60px', padding: '2px' }} value={colors.bank || '#2563eb'} onChange={(e) => updateColor('bank', e.target.value)} />
                  <div style={{ flex: 1, background: colors.bank || '#2563eb', borderRadius: '10px', display: 'flex', alignItems: 'center', padding: '0 15px', color: '#fff', fontSize: '12px', fontWeight: 700 }}>PREVIEW SALDO BANK</div>
                </div>
              </div>

              <div className="form-group" style={{ background: 'var(--card)', padding: '15px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <label>Warna Kartu Saldo Kas</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="color" className="form-control" style={{ height: '45px', width: '60px', padding: '2px' }} value={colors.cash || '#10b981'} onChange={(e) => updateColor('cash', e.target.value)} />
                  <div style={{ flex: 1, background: colors.cash || '#10b981', borderRadius: '10px', display: 'flex', alignItems: 'center', padding: '0 15px', color: '#fff', fontSize: '12px', fontWeight: 700 }}>PREVIEW SALDO KAS</div>
                </div>
              </div>

              <div className="form-group" style={{ background: 'var(--card)', padding: '15px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <label>Warna Kartu Laba Admin</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="color" className="form-control" style={{ height: '45px', width: '60px', padding: '2px' }} value={colors.admin || '#ffffff'} onChange={(e) => updateColor('admin', e.target.value)} />
                  <div style={{ flex: 1, background: colors.admin || '#ffffff', border: colors.admin === '#ffffff' ? '1px solid var(--border)' : 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', padding: '0 15px', color: colors.admin === '#ffffff' ? 'var(--text)' : '#fff', fontSize: '12px', fontWeight: 700 }}>PREVIEW LABA ADMIN</div>
                </div>
              </div>

              <div className="form-group" style={{ background: 'var(--card)', padding: '15px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <label>Warna Kartu Laba ACC</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="color" className="form-control" style={{ height: '45px', width: '60px', padding: '2px' }} value={colors.acc || '#ffffff'} onChange={(e) => updateColor('acc', e.target.value)} />
                  <div style={{ flex: 1, background: colors.acc || '#ffffff', border: colors.acc === '#ffffff' ? '1px solid var(--border)' : 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', padding: '0 15px', color: colors.acc === '#ffffff' ? 'var(--text)' : '#fff', fontSize: '12px', fontWeight: 700 }}>PREVIEW LABA ACC</div>
                </div>
              </div>

              <div className="form-group" style={{ background: 'var(--card)', padding: '15px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <label>Warna Kartu Tarik Tunai</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="color" className="form-control" style={{ height: '45px', width: '60px', padding: '2px' }} value={colors.tarik || '#ffffff'} onChange={(e) => updateColor('tarik', e.target.value)} />
                  <div style={{ flex: 1, background: colors.tarik || '#ffffff', border: colors.tarik === '#ffffff' ? '1px solid var(--border)' : 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', padding: '0 15px', color: colors.tarik === '#ffffff' ? 'var(--text)' : '#fff', fontSize: '12px', fontWeight: 700 }}>PREVIEW TARIK TUNAI</div>
                </div>
              </div>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '15px', textAlign: 'center' }}>* Warna putih akan menggunakan tampilan standar kartu.</p>
          </div>
        )}

        {/* Section: Reset */}
        <SectionHeader id="reset" icon={AlertTriangle} title="Pembersihan Data" active={openSection === 'reset'} />
        {openSection === 'reset' && (
          <div style={{ padding: '5px 10px 20px' }}>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button onClick={() => setShowConfirm('saldo')} className="btn-submit" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', boxShadow: 'none', fontSize: '12px' }}>
                <RotateCcw size={14} /> Reset Saldo
              </button>
              <button onClick={() => setShowConfirm('semua')} className="btn-submit" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', boxShadow: 'none', fontSize: '12px' }}>
                <RotateCcw size={14} /> Reset Semua
              </button>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px', textAlign: 'center' }}>Hati-hati! Tindakan ini tidak dapat dibatalkan.</p>
          </div>
        )}

        <div style={{ marginTop: '30px' }}>
          <button 
            className="btn-submit" 
            onClick={handleUpdateProfile} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px',
              background: saveStatus === 'success' ? 'var(--success)' : (colors.theme || 'var(--accent)'),
              transition: '0.3s'
            }}
            disabled={saveStatus !== 'idle'}
          >
            {saveStatus === 'idle' && <><Save size={18} /> SIMPAN SEMUA</>}
            {saveStatus === 'saving' && 'MENYIMPAN...'}
            {saveStatus === 'success' && '✅ BERHASIL DISIMPAN!'}
          </button>
          
          <button 
            className="btn-submit" 
            style={{ background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', marginTop: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: 'none' }} 
            onClick={() => signOut(auth)}
          >
            <LogOut size={18} /> KELUAR AKUN
          </button>
        </div>

        {/* Confirmation Modal */}
        <Modal isOpen={!!showConfirm} onClose={() => !isProcessing && setShowConfirm(null)} title={showConfirm === 'saldo' ? "🔄 Reset Saldo" : "⚠️ Hapus Semua Data"}>
          <div style={{ padding: '10px 0', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.5' }}>
              {showConfirm === 'saldo' 
                ? "Apakah Anda yakin ingin mereset semua saldo (Bank, Kas, Laba, dll) kembali ke Rp 0?"
                : "PERHATIAN! Anda akan menghapus seluruh data riwayat, laporan, dan saldo secara permanen."}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowConfirm(null)} className="btn-submit" style={{ background: '#f1f5f9', color: 'var(--text)', boxShadow: 'none' }} disabled={isProcessing}>Batal</button>
              <button onClick={executeReset} className="btn-submit" style={{ background: 'var(--danger)', color: 'white' }} disabled={isProcessing}>
                {isProcessing ? 'Memproses...' : 'Ya, Lanjutkan'}
              </button>
            </div>
          </div>
        </Modal>

      </div>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AccountPage;
