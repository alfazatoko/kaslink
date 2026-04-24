import React from 'react';
import { Home, ClipboardList, BarChart2, User } from 'lucide-react';

type ViewType = 'beranda' | 'riwayat' | 'laporan' | 'akun';

interface BottomNavProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  onFabClick: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeView, setActiveView, onFabClick }) => {
  return (
    <div className="bottom-nav">
      <button 
        className={`nav-item ${activeView === 'beranda' ? 'active' : ''}`} 
        onClick={() => setActiveView('beranda')}
      >
        <span className="nav-icon"><Home size={20} /></span>
        <div>Beranda</div>
      </button>
      <button 
        className={`nav-item ${activeView === 'riwayat' ? 'active' : ''}`} 
        onClick={() => setActiveView('riwayat')}
      >
        <span className="nav-icon"><ClipboardList size={20} /></span>
        <div>Riwayat</div>
      </button>
      <div className="fab-box">
        <button className="fab-btn" onClick={onFabClick}>
          +
        </button>
      </div>
      <button 
        className={`nav-item ${activeView === 'laporan' ? 'active' : ''}`} 
        onClick={() => setActiveView('laporan')}
      >
        <span className="nav-icon"><BarChart2 size={20} /></span>
        <div>Laporan</div>
      </button>
      <button 
        className={`nav-item ${activeView === 'akun' ? 'active' : ''}`} 
        onClick={() => setActiveView('akun')}
      >
        <span className="nav-icon"><User size={20} /></span>
        <div>Akun</div>
      </button>
    </div>
  );
};

export default BottomNav;
