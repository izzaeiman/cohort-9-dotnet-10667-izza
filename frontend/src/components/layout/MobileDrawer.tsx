import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import {
  MdClose,
  MdDashboard,
  MdCheckCircleOutline,
  MdFolderOpen,
  MdCalendarToday,
  MdPeopleOutline,
  MdPersonOutline,
  MdOutlineSettings,
} from 'react-icons/md';
import WorkFlowLogo from '../ui/WorkFlowLogo';
import styles from './MobileDrawer.module.css';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: MdDashboard },
  { path: '/tasks', label: 'Tasks', icon: MdCheckCircleOutline },
  { path: '/projects', label: 'Projects', icon: MdFolderOpen },
  { path: '/calendar', label: 'Calendar', icon: MdCalendarToday },
  { path: '/users', label: 'Users', icon: MdPeopleOutline },
  { path: '/profile', label: 'Profile', icon: MdPersonOutline },
  { path: '/settings', label: 'Settings', icon: MdOutlineSettings },
];

export const MobileDrawer = ({ isOpen, onClose }: MobileDrawerProps) => (
  <>
    {/* Backdrop Overlay */}
    <div
      className={clsx(styles.overlay, isOpen && styles.overlayOpen)}
      onClick={onClose}
      aria-hidden="true"
    />

    {/* Slide-out Drawer */}
    <div className={clsx(styles.drawer, isOpen && styles.drawerOpen)}>
      <div className={styles.header}>
        <WorkFlowLogo size="md" />
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close navigation menu"
        >
          <MdClose size={20} />
        </button>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={onClose}
            className={({ isActive }) =>
              clsx(styles.navItem, isActive && styles.navItemActive)
            }
          >
            <span className={styles.navIcon}>
              <Icon />
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  </>
);

export default MobileDrawer;
