import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  CheckCircle2, 
  History, 
  LogOut, 
  Check, 
  X 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">
          <Check size={20} strokeWidth={3} />
        </div>
        <div className="sidebar-brand">TaskFlow</div>
        {isOpen && (
          <button 
            onClick={onClose} 
            className="mobile-menu-toggle" 
            style={{ marginLeft: 'auto', color: '#94a3b8' }}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        <NavLink 
          to="/" 
          end
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink 
          to="/tasks" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <CheckSquare size={18} />
          <span>My Tasks</span>
        </NavLink>

        <NavLink 
          to="/completed" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <CheckCircle2 size={18} />
          <span>Completed Tasks</span>
        </NavLink>

        <NavLink 
          to="/history" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <History size={18} />
          <span>Task History</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-badge">
          <div className="user-avatar">
            {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-info-text">
            <div className="user-name">{user?.username || 'User'}</div>
            <div className="user-role">Personal Workspace</div>
          </div>
        </div>

        <button onClick={logout} className="logout-btn">
          <LogOut size={16} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
