import React from 'react';
import { Menu, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ onToggleSidebar, onQuickAdd }) => {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button 
          onClick={onToggleSidebar} 
          className="mobile-menu-toggle"
          aria-label="Toggle menu"
        >
          <Menu size={22} />
        </button>
        <div style={{ fontWeight: 600, color: '#475569', fontSize: '0.92rem' }}>
          Welcome back, <span style={{ color: '#0f172a', fontWeight: 700 }}>{user?.username}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={onQuickAdd} className="btn-primary" style={{ padding: '8px 14px', fontSize: '0.88rem' }}>
          <Plus size={16} />
          <span>New Task</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
