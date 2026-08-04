import { NavLink, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  MdDashboard,
  MdCheckCircleOutline,
  MdFolderOpen,
  MdCalendarToday,
  MdPeopleOutline,
  MdPersonOutline,
  MdOutlineSettings,
  MdLogout,
  MdChevronLeft,
  MdChevronRight,
} from 'react-icons/md';
import WorkFlowLogo from '../ui/WorkFlowLogo';
import styles from './Sidebar.module.css';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
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

export const Sidebar = ({ isCollapsed, onToggleCollapse }: SidebarProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // TODO: Replace with real auth logout logic when ASP.NET Core API is ready
    navigate('/login');
  };

  return (
    <aside
      className={clsx(
        styles.sidebar,
        isCollapsed ? styles['sidebar--collapsed'] : styles['sidebar--expanded'],
      )}
      aria-label="Main sidebar navigation"
    >
      {/* Sidebar Header */}
      <div className={styles.header}>
        <div className={styles.logoWrap}>
          {isCollapsed ? (
            <WorkFlowLogo size="sm" />
          ) : (
            <WorkFlowLogo size="md" />
          )}
        </div>
        <button
          type="button"
          className={styles.collapseBtn}
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <MdChevronRight size={20} /> : <MdChevronLeft size={20} />}
        </button>
      </div>

      {/* Nav List */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              clsx(styles.navItem, isActive && styles.navItemActive)
            }
            title={isCollapsed ? label : undefined}
          >
            <span className={styles.navIcon}>
              <Icon />
            </span>
            {!isCollapsed && <span className={styles.navText}>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className={styles.footer}>
        <button
          type="button"
          className={styles.logoutBtn}
          onClick={handleLogout}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <span className={styles.navIcon}>
            <MdLogout />
          </span>
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
