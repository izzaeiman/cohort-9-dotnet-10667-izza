import { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  MdMenu,
  MdSearch,
  MdNotificationsNone,
  MdDarkMode,
  MdLightMode,
  MdPersonOutline,
  MdOutlineSettings,
  MdLogout,
  MdChevronRight,
  MdExpandMore,
} from 'react-icons/md';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import styles from './Navbar.module.css';

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

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global Ctrl+K / Cmd+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsUserDropdownOpen(false);
        setIsNotificationOpen(false);
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
        {/* Search bar */}
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon} aria-hidden="true">
            <MdSearch size={18} />
          </span>
          <input
            ref={searchInputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Search tasks, projects... (Ctrl + K)"
            aria-label="Search tasks and projects globally"
          />
          <kbd className={styles.kbdHint} aria-hidden="true">
            ⌘K
          </kbd>
        </div>

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

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => {
              setIsNotificationOpen((prev) => !prev);
              setIsUserDropdownOpen(false);
            }}
            title="Notifications"
            aria-label="Toggle notifications menu"
            aria-expanded={isNotificationOpen}
          >
            <MdNotificationsNone size={22} />
            <span className={styles.badge} aria-hidden="true" />
          </button>

          {/* Notifications Dropdown */}
          {isNotificationOpen && (
            <div className={styles.dropdown} role="menu" aria-label="Notifications list">
              <div style={{ padding: '8px 12px', fontWeight: 700, fontSize: '0.85rem' }}>
                Notifications (3 unread)
              </div>
              <div className={styles.dropdownDivider} aria-hidden="true" />
              <div className={styles.dropdownItem} role="menuitem" style={{ fontSize: '0.8rem' }}>
                <span>✅ Alice completed <strong>Task System Spec</strong></span>
              </div>
              <div className={styles.dropdownItem} role="menuitem" style={{ fontSize: '0.8rem' }}>
                <span>💬 John commented on your PR</span>
              </div>
              <div className={styles.dropdownItem} role="menuitem" style={{ fontSize: '0.8rem' }}>
                <span>⚠️ Deadline approaching for SQL Migration</span>
              </div>
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div className={styles.userWrap}>
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
              src={user?.avatar || 'https://i.pravatar.cc/150?img=68'}
              alt={`${user?.name || 'User'} profile avatar`}
              className={styles.avatar}
            />
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name || 'Guest User'}</span>
              <span className={styles.userRole}>{user?.role || 'Member'}</span>
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
                    backgroundColor: user?.role === 'Admin' ? 'rgba(255, 122, 26, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                    color: user?.role === 'Admin' ? '#FF7A1A' : '#3B82F6',
                  }}
                >
                  {user?.role} Role
                </span>
              </div>

              <Link
                to={user?.role === 'Admin' ? '/admin/profile' : '/profile'}
                className={styles.dropdownItem}
                role="menuitem"
                onClick={() => setIsUserDropdownOpen(false)}
              >
                <MdPersonOutline size={18} />
                <span>My Profile</span>
              </Link>
              <Link
                to={user?.role === 'Admin' ? '/admin/settings' : '/settings'}
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
