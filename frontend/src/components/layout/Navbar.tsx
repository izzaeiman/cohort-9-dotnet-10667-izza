import { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  MdMenu,
  MdSearch,
  MdDarkMode,
  MdLightMode,
  MdPersonOutline,
  MdOutlineSettings,
  MdLogout,
  MdChevronRight,
  MdExpandMore,
  MdNotificationsNone,
} from 'react-icons/md';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import apiClient from '../../services/api';
import styles from './Navbar.module.css';

const getAvatarUrl = (avatarPath?: string, name?: string) => {
  if (!avatarPath) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random`;
  }
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }
  const backendBase = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 'http://localhost:5000';
  return `${backendBase}${avatarPath}`;
};

interface NavbarProps {
  onOpenMobileMenu: () => void;
}

export const Navbar = ({ onOpenMobileMenu }: NavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  

  const notifRef = useRef<HTMLDivElement>(null);
  const userWrapRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) {
        setIsNotificationOpen(false);
      }
      if (userWrapRef.current && !userWrapRef.current.contains(target)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format breadcrumb text from current path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const currentSegment = pathSegments[pathSegments.length - 1] || 'dashboard';

  const handleLogout = async () => {
    setIsUserDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className={styles.navbar} ref={dropdownRef}>
      {/* ── Left section: Hamburger + Breadcrumb ───────────────────────── */}
      <div className={styles.leftSection}>
        <button
          type="button"
          className={styles.mobileMenuBtn}
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
        >
          <MdMenu size={22} />
        </button>

        {/* Breadcrumbs */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb navigation">
          <span className={styles.crumbRoot}>WorkFlow</span>
          <MdChevronRight size={16} className={styles.crumbSeparator} aria-hidden="true" />
          <span className={styles.crumbCurrent}>
            {currentSegment.charAt(0).toUpperCase() + currentSegment.slice(1)}
          </span>
        </nav>
      </div>

      {/* ── Right section: Search + Actions + User Avatar ────────────────── */}
      <div className={styles.rightSection}>
        <form
          style={{ display: 'flex', alignItems: 'center' }}
          onSubmit={(e) => {
            e.preventDefault();
            const val = searchInputRef.current?.value.trim();
            if (val) {
              navigate(`/tasks?search=${encodeURIComponent(val)}`);
            }
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <MdSearch size={18} style={{ position: 'absolute', left: '10px', color: '#888' }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search tasks..."
              aria-label="Search tasks"
              style={{
                padding: '6px 12px 6px 32px',
                borderRadius: '8px',
                border: '1px solid var(--border, #ccc)',
                backgroundColor: 'var(--bg-secondary, #f9fafb)',
                color: 'var(--text, #111)',
                fontSize: '0.875rem',
                outline: 'none',
                width: '180px',
              }}
            />
          </div>
        </form>

        {/* Theme Toggle Button */}
        <button
          type="button"
          className={styles.iconBtn}
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          aria-label={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {theme === 'dark' ? <MdLightMode size={20} /> : <MdDarkMode size={20} />}
        </button>

        {/* Notifications Bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => {
              setIsNotificationOpen((prev) => !prev);
              setIsUserDropdownOpen(false);
              if (!isNotificationOpen) {
                apiClient.get('/notifications').then(res => setNotifications(res.data || [])).catch(() => {});
              }
            }}
            title="Notifications"
            aria-label="Notifications"
          >
            <MdNotificationsNone size={22} />
            {notifications.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#FF7A1A',
                }}
              />
            )}
          </button>

          {isNotificationOpen && (
            <div className={styles.dropdown} style={{ width: '320px', right: 0, padding: '12px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '8px', borderBottom: '1px solid var(--border, #eee)', paddingBottom: '6px' }}>
                Notifications ({notifications.length})
              </div>
              {notifications.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: '#888', padding: '8px 0' }}>No new notifications</div>
              ) : (
                <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {notifications.map((n) => (
                    <div key={n.id} style={{ fontSize: '0.8rem', padding: '6px 8px', borderRadius: '6px', backgroundColor: 'var(--bg-secondary, #f3f4f6)' }}>
                      <strong style={{ display: 'block', color: 'var(--text, #111)' }}>{n.title}</strong>
                      <span style={{ color: 'var(--text-secondary, #555)' }}>{n.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div className={styles.userWrap} ref={userWrapRef}>
          <button
            type="button"
            className={styles.userBtn}
            onClick={() => {
              setIsUserDropdownOpen((prev) => !prev);
              setIsNotificationOpen(false);
            }}
            aria-expanded={isUserDropdownOpen}
            aria-label={`User account menu for ${user?.name || 'User'}`}
          >
            <img
              src={getAvatarUrl(user?.avatar, user?.name)}
              alt={`${user?.name || 'User'} profile avatar`}
              className={styles.avatar}
            />
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name || 'Guest User'}</span>
              <span className={styles.userRole}>{user?.role || 'Regular User'}</span>
            </div>
            <MdExpandMore size={18} color="#888" aria-hidden="true" />
          </button>

          {/* User Dropdown Menu */}
          {isUserDropdownOpen && (
            <div className={styles.dropdown} role="menu" aria-label="Account actions">
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border, #e5e7eb)' }}>
                <strong style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text, #1f1f1f)' }}>
                  {user?.name}
                </strong>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary, #6b7280)' }}>
                  {user?.email}
                </span>
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: '4px',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    backgroundColor: user?.role === 'Administrator' ? 'rgba(255, 122, 26, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                    color: user?.role === 'Administrator' ? '#FF7A1A' : '#3B82F6',
                  }}
                >
                  {user?.role} Role
                </span>
              </div>

              <Link
                to={user?.role === 'Administrator' ? '/admin/profile' : '/profile'}
                className={styles.dropdownItem}
                role="menuitem"
                onClick={() => setIsUserDropdownOpen(false)}
              >
                <MdPersonOutline size={18} />
                <span>My Profile</span>
              </Link>
              <Link
                to={user?.role === 'Administrator' ? '/admin/settings' : '/settings'}
                className={styles.dropdownItem}
                role="menuitem"
                onClick={() => setIsUserDropdownOpen(false)}
              >
                <MdOutlineSettings size={18} />
                <span>Settings</span>
              </Link>
              <div className={styles.dropdownDivider} aria-hidden="true" />
              <button
                type="button"
                className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                role="menuitem"
                onClick={handleLogout}
              >
                <MdLogout size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
