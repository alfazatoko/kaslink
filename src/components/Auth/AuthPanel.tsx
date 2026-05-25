import React, { useState, useEffect } from 'react';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  googleProvider,
} from '../../services/firebase';
import { upsertProfile, getProfile } from '../../services/supabase';

const AuthPanel: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPass, setShowPass] = useState(false);

  const defaultCategories = [
    { id: "cat_bank_out", name: "Transfer Bank", logicType: "BANK_OUT" as const },
    { id: "cat_bank_in", name: "Tarik Tunai", logicType: "BANK_IN" as const },
    { id: "cat_acc", name: "Aksesoris", logicType: "LABA_ACC" as const },
    { id: "cat_admin", name: "Admin/Fee", logicType: "LABA_ADMIN" as const }
  ];

  const initProfile = async (uid: string, email: string) => {
    await upsertProfile(uid, {
      email,
      phone: phone || '-',
      toko: "KINK",
      defaultCategory: "cat_bank_out",
      categories: defaultCategories
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      alert("Gagal: " + err.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      await initProfile(res.user.uid, email);
      alert("Akun berhasil dibuat!");
    } catch (err: any) {
      alert("Gagal: " + err.message);
    }
  };

    const handleGoogleLogin = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      await syncProfileAfterLogin(res.user.uid, res.user.email || '');
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr: any) {
          alert("Gagal Login Google: " + redirectErr.message);
        }
      } else if (err.code === 'auth/operation-not-allowed') {
        alert("Login Google belum diaktifkan. Aktifkan di Firebase Console > Authentication > Sign-in method > Google.");
      } else if (err.code === 'auth/unauthorized-domain') {
        alert("Domain ini belum terdaftar. Tambahkan domain di Firebase Console > Authentication > Settings > Authorized domains.");
      } else {
        alert("Gagal Login Google: " + err.message);
      }
    }
  };

  const handleRedirectResult = async () => {
    try {
      const res = await getRedirectResult(auth);
      if (res) {
        await syncProfileAfterLogin(res.user.uid, res.user.email || '');
      }
    } catch (err: any) {
      alert("Gagal Login Google: " + err.message);
    }
  };

  const syncProfileAfterLogin = async (uid: string, email: string) => {
    try {
      const existing = await getProfile(uid);
      if (!existing) {
        await initProfile(uid, email);
      }
    } catch (err: any) {
      alert("Gagal menyimpan profil: " + err.message + ". Coba periksa koneksi database Supabase.");
    }
  };

  useEffect(() => {
    handleRedirectResult();
  }, []);

  return (
    <div className="auth-container">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img
            src="/kink_logo.png"
            style={{ width: '80px', height: '80px', borderRadius: '20px', marginBottom: '15px', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
            alt="Logo"
          />
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--accent)', letterSpacing: '-1px' }}>
            KINK <span style={{ fontSize: '12px', opacity: 0.5, fontWeight: 700 }}>v2.0</span>
          </h1>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px' }}>Pembukuan Kasir Agen Brilink</p>
        </div>

        {!isRegister ? (
          <div id="loginPanel">
            <div className="modal-title">🔐 Masuk Akun</div>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="owner@kink.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <div className="password-wrapper" style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="form-control"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
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
              <button type="submit" className="btn-submit">MASUK KE KASIR</button>
            </form>
            <div className="divider">ATAU</div>
            <button className="btn-google" onClick={handleGoogleLogin}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
              Daftar / Masuk via Google
            </button>
            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px' }}>
              Belum ada akun? <span onClick={() => setIsRegister(true)} style={{ color: 'var(--accent)', fontWeight: 800, cursor: 'pointer' }}>Daftar</span>
            </p>
          </div>
        ) : (
          <div id="registerPanel">
            <div className="modal-title">📝 Daftar Baru</div>
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>WhatsApp</label>
                <input
                  type="tel"
                  className="form-control"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <div className="password-wrapper" style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
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
              <button type="submit" className="btn-submit">BUAT AKUN</button>
            </form>
            <div className="divider">ATAU</div>
            <button className="btn-google" onClick={handleGoogleLogin}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
              Daftar via Google Akun
            </button>
            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px' }}>
              Sudah punya akun? <span onClick={() => setIsRegister(false)} style={{ color: 'var(--accent)', fontWeight: 800, cursor: 'pointer' }}>Login</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPanel;
