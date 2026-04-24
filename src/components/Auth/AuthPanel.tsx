import React, { useState } from 'react';
import { 
  auth, 
  db, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  googleProvider,
  setDoc,
  doc
} from '../../services/firebase';

const AuthPanel: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPass, setShowPass] = useState(false);

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
      const uid = res.user.uid;
      
      await setDoc(doc(db, `${uid}_profile`, 'data'), {
        email,
        phone: phone || '-',
        toko: "KINK",
        defaultCategory: "Seabank",
        categories: [
          { name: "Seabank", role: "bank_out" },
          { name: "Dana", role: "bank_out" },
          { name: "Orderkuota", role: "bank_out" },
          { name: "Tarik Tunai", role: "bank_in" },
          { name: "Aksesoris", role: "cash_in" }
        ]
      });
      
      await setDoc(doc(db, `${uid}_balances`, 'data'), {
        bank: 0, kas: 0, admin: 0, acc: 0, tarik: 0, depo: 0, sales: 0
      });
      
      alert("Akun berhasil dibuat!");
    } catch (err: any) {
      alert("Gagal: " + err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      alert("Gagal Login Google: " + err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--accent)', letterSpacing: '-1px' }}>KINK</h1>
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
