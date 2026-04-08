import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

const navItems = [
  { to: '/admin', icon: '📊', label: 'Dashboard', end: true },
  { to: '/admin/profile', icon: '👤', label: 'Profile & About' },
  { to: '/admin/projects', icon: '🚀', label: 'Projects' },
  { to: '/admin/skills', icon: '⚡', label: 'Skills' },
  { to: '/admin/certifications', icon: '🏆', label: 'Certifications' },
  { to: '/admin/jobs', icon: '🤖', label: 'AI Job Matcher' },
  { to: '/admin/messages', icon: '📧', label: 'Messages' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          {'<'}Admin{' />'}
        </div>

        <nav className="admin-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '0 var(--space-md)', marginTop: 'auto' }}>
          <div style={{ padding: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', justifyContent: 'space-between' }}>
            <ThemeToggle />
            <a href="/" target="_blank" rel="noopener noreferrer" className="admin-nav-item" style={{ padding: 'var(--space-sm)' }}>
              <span className="nav-icon">🌐</span>
              <span>View Site</span>
            </a>
          </div>
          <button
            className="admin-nav-item"
            onClick={handleLogout}
            style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font-family)', color: '#EF4444' }}
          >
            <span className="nav-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
