import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import {
  MdClose,
  MdDashboard,
  MdCheckCircleOutline,
  MdAdminPanelSettings,
  MdFolderOpen,
  MdCalendarToday,
  MdPeopleOutline,
  MdPersonOutline,
  MdOutlineSettings,
} from 'react-icons/md';
import WorkFlowLogo from '../ui/WorkFlowLogo';
import useAuth from '../../hooks/useAuth';
import styles from './MobileDrawer.module.css';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer = ({ isOpen, onClose }: MobileDrawerProps) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const { isAdmin } = useAuth();
  const adminUser = isAdmin();

  const navItems = adminUser
    ? [
        { path: '/admin/dashboard', label: 'Admin Dashboard', icon: MdDashboard },
        { path: '/admin/tasks', label: 'Admin Tasks', icon: MdAdminPanelSettings },
        { path: '/admin/projects', label: 'Projects', icon: MdFolderOpen },
        { path: '/admin/users', label: 'Users', icon: MdPeopleOutline },
        { path: '/admin/calendar', label: 'Calendar', icon: MdCalendarToday },
        { path: '/admin/profile', label: 'Profile', icon: MdPersonOutline },
        { path: '/admin/settings', label: 'Settings', icon: MdOutlineSettings },
      ]
    : [
        { path: '/dashboard', label: 'Dashboard', icon: MdDashboard },
        { path: '/tasks', label: 'My Tasks', icon: MdCheckCircleOutline },
        { path: '/projects', label: 'Projects', icon: MdFolderOpen },
        { path: '/calendar', label: 'Calendar', icon: MdCalendarToday },
        { path: '/profile', label: 'Profile', icon: MdPersonOutline },
        { path: '/settings', label: 'Settings', icon: MdOutlineSettings },
      ];

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement;

    const timer = setTimeout(() => {
      if (drawerRef.current) {
        const firstFocusable = drawerRef.current.querySelector<HTMLElement>('button, a[href]');
        firstFocusable?.focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusables = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>('button, a[href]'),
        );
        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className={clsx(styles.overlay, isOpen && styles.overlayOpen)}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Drawer */}
      <div
        ref={drawerRef}
        className={clsx(styles.drawer, isOpen && styles.drawerOpen)}
        aria-hidden={!isOpen}
        role="dialog"
        aria-label="Mobile navigation drawer"
      >
        <div className={styles.header}>
          <WorkFlowLogo size="md" />
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close navigation menu"
            tabIndex={isOpen ? 0 : -1}
          >
            <MdClose size={20} />
          </button>
        </div>

        <nav className={styles.nav} aria-label="Mobile navigation links">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={onClose}
              tabIndex={isOpen ? 0 : -1}
              className={({ isActive }) =>
                clsx(styles.navItem, isActive && styles.navItemActive)
              }
            >
              <span className={styles.navIcon} aria-hidden="true">
                <Icon />
              </span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
};

export default MobileDrawer;
