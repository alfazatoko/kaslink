import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { RefreshCw, Moon, Monitor } from 'lucide-react';

interface HeaderProps {
  profile: UserProfile | null;
}

const Header: React.FC<HeaderProps> = ({ profile }) => {
  const [time, setTime] = useState<string>('00.00.00');
  const [dateStr, setDateStr] = useState<string>('Hari, 00 Bln 0000');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString('id-ID', { hour12: false }));
      setDateStr(now.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleLandscape = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const toggleMode = () => {
    document.body.classList.toggle('dark');
  };

  const [viewMode, setViewMode] = useState<'hp' | 'tablet' | 'pc'>('pc');

  const updateScale = (mode: 'hp' | 'tablet' | 'pc') => {
    setViewMode(mode);
    const root = document.documentElement;
    root.setAttribute('data-view-mode', mode);
    
    if (mode === 'hp') root.style.setProperty('--app-width', '450px');
    else if (mode === 'tablet') root.style.setProperty('--app-width', '700px');
    else root.style.setProperty('--app-width', '100%');
  };

  const toggleScale = () => {
    let nextMode: 'hp' | 'tablet' | 'pc' = 'hp';
    if (viewMode === 'hp') nextMode = 'tablet';
    else if (viewMode === 'tablet') nextMode = 'pc';
    else nextMode = 'hp';
    updateScale(nextMode);
  };

  useEffect(() => {
    // Initial sync of CSS variables on mount
    updateScale(viewMode);
  }, []);

  return (
    <div className="header">
      <div className="brand-box">
        <img 
          src="/kink_logo.png" 
          className="logo-img" 
          alt="Logo" 
          onClick={() => {}} 
        />
        <div className="brand-text">
          <h3>{profile?.toko || 'KINK'} <span style={{ fontSize: '10px', opacity: 0.6 }}>v2.0</span></h3>
          <p>Pembukuan Kasir Agen Brilink</p>
          <div id="fullDate" style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent)', marginTop: '2px' }}>
            {dateStr}
          </div>
        </div>
      </div>
      <div className="header-right">
        <div className="time-display">{time}</div>
        <div className="header-btns">
          <div className="h-btn" onClick={toggleLandscape} title="Fullscreen">
            <RefreshCw size={16} />
          </div>
          <div className="h-btn" onClick={toggleMode} title="Dark Mode">
            <Moon size={16} />
          </div>
          <div className="h-btn" onClick={toggleScale} title={`Mode: ${viewMode.toUpperCase()}`}>
            <Monitor size={16} color={viewMode === 'pc' ? 'var(--text)' : 'var(--accent)'} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
