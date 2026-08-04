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
import styles from './Navbar.module.css';

interface NavbarProps {
  onOpenMobileMenu: () => void;
}

export const Navbar = ({ onOpenMobileMenu }: NavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleLogout = () => {
    setIsUserDropdownOpen(false);
    navigate('/login');
  };

  return (
    <header className={styles.navbar}>
      {/* Left Section: Mobile Menu + Breadcrumbs */}
      <div className={styles.leftSection}>
        <button
          type="button"
          className={styles.menuBtn}
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
        >
          <MdMenu size={22} />
        </button>

        {/* Auto-generated Breadcrumbs */}
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb navigation">
          <Link to="/dashboard" className={styles.breadcrumbLink}>
            WorkFlow
          </Link>
          <span className={styles.separator}>
            <MdChevronRight size={16} />
          </span>
          <span className={styles.breadcrumbCurrent}>{currentSegment}</span>
        </nav>
      </div>

      {/* Right Section: Search, Notifications, Theme, User Profile */}
      <div className={styles.rightSection} ref={dropdownRef}>
        {/* Search Input */}
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>
            <MdSearch size={18} />
          </span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search tasks, projects..."
            aria-label="Search dashboard"
          />
          <kbd className={styles.searchKbd}>Ctrl K</kbd>
        </div>

        {/* Theme Toggle (UI Only) */}
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => setIsDarkMode((prev) => !prev)}
          title="Toggle Light/Dark Theme (UI Demo)"
          aria-label="Toggle theme"
        >
          {isDarkMode ? <MdLightMode size={20} /> : <MdDarkMode size={20} />}
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
            aria-label="Notifications"
          >
            <MdNotificationsNone size={22} />
            <span className={styles.badge} />
          </button>

          {/* Notifications Dropdown */}
          {isNotificationOpen && (
            <div className={styles.dropdown}>
              <div style={{ padding: '8px 12px', fontWeight: 700, fontSize: '0.85rem' }}>
                Notifications (3 unread)
              </div>
              <div className={styles.dropdownDivider} />
              <div className={styles.dropdownItem} style={{ fontSize: '0.8rem' }}>
                <span>✅ Sarah completed <strong>Task System Spec</strong></span>
              </div>
              <div className={styles.dropdownItem} style={{ fontSize: '0.8rem' }}>
                <span>💬 Nouman commented on your PR</span>
              </div>
              <div className={styles.dropdownItem} style={{ fontSize: '0.8rem' }}>
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
            aria-label="User account menu"
          >
            <img
              src="https://i.pravatar.cc/150?img=68"
              alt="Izza Eiman"
              className={styles.avatar}
            />
            <div className={styles.userInfo}>
              <span className={styles.userName}>Izza Eiman</span>
              <span className={styles.userRole}>Software Engineer</span>
            </div>
            <MdExpandMore size={18} color="#888" />
          </button>

          {/* User Dropdown Menu */}
          {isUserDropdownOpen && (
            <div className={styles.dropdown}>
              <Link
                to="/profile"
                className={styles.dropdownItem}
                onClick={() => setIsUserDropdownOpen(false)}
              >
                <MdPersonOutline size={18} />
                <span>My Profile</span>
              </Link>
              <Link
                to="/settings"
                className={styles.dropdownItem}
                onClick={() => setIsUserDropdownOpen(false)}
              >
                <MdOutlineSettings size={18} />
                <span>Settings</span>
              </Link>
              <div className={styles.dropdownDivider} />
              <button
                type="button"
                className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
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
