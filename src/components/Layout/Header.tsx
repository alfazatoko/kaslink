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

  const toggleScale = () => {
    document.body.style.maxWidth = document.body.style.maxWidth === '600px' ? '100%' : '600px';
    document.body.style.margin = '0 auto';
  };

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
          <div className="h-btn" onClick={toggleScale} title="Toggle Scale">
            <Monitor size={16} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
