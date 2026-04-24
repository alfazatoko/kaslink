import React, { useState, useEffect } from 'react';
import { UserProfile, Category } from '../types';
import { 
  auth, 
  db, 
  doc, 
  updateDoc, 
  signOut, 
  setDoc 
} from '../firebase-config';
import { updatePassword } from "firebase/auth";
import { ArrowLeft, Save, LogOut, Tags } from 'lucide-react';

interface AccountPageProps {
  profile: UserProfile | null;
  onBack: () => void;
}

const AccountPage: React.FC<AccountPageProps> = ({ profile, onBack }) => {
  const [toko, setToko] = useState('');
  const [defaultKat, setDefaultKat] = useState('');
  const [newPass, setNewPass] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (profile) {
      setToko(profile.toko || '');
      setDefaultKat(profile.defaultCategory || '');
      setCategories(profile.categories || []);
    }
  }, [profile]);

  const handleUpdateCat = (index: number, field: keyof Category, value: string) => {
    const updated = [...categories];
    updated[index] = { ...updated[index], [field]: value };
    setCategories(updated);
  };

  const handleUpdateProfile = async () => {
    if (!auth.currentUser) return;
    try {
      const uid = auth.currentUser.uid;
      await setDoc(doc(db, `${uid}_profile`, 'data'), {
        toko,
        defaultCategory: defaultKat,
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

      alert("Profil & Kategori Berhasil Diperbarui!");
    } catch (err: any) {
      alert("Gagal Update: " + err.message);
    }
  };

  return (
    <div id="view-akun" className="page-view">
      <div className="page-header">
        <button className="btn-back" onClick={onBack}><ArrowLeft size={20} /></button>
        <div className="page-title">Pengaturan Akun</div>
      </div>
      <div className="page-content">
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
            value={defaultKat}
            onChange={(e) => setDefaultKat(e.target.value)}
          >
            {categories.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
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

        <div className="form-group" style={{ border: '1px solid var(--border)', padding: '15px', borderRadius: '15px', marginTop: '10px' }}>
          <label style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tags size={16} /> PENGATURAN KATEGORI
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            {categories.map((c, i) => (
              <div key={i} style={{ background: 'var(--bg)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  value={c.name} 
                  onChange={(e) => handleUpdateCat(i, 'name', e.target.value)}
                  style={{ marginBottom: '5px' }} 
                  placeholder="Nama Kategori" 
                />
                <select 
                  className="form-control" 
                  value={c.role}
                  onChange={(e) => handleUpdateCat(i, 'role', e.target.value as any)}
                  style={{ fontSize: '11px', padding: '6px' }}
                >
                  <option value="bank_out">Bank Out (Transfer/Isi Saldo)</option>
                  <option value="bank_in">Bank In (Tarik Tunai)</option>
                  <option value="cash_in">Cash In (Penjualan/Aksesoris)</option>
                  <option value="none">Lainnya (Hanya Catat)</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        <button className="btn-submit" onClick={handleUpdateProfile} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Save size={18} /> UPDATE PROFIL
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
