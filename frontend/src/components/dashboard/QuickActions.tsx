import { useNavigate } from 'react-router-dom';
import SectionTitle from '../ui/SectionTitle';
import {
  MdAddCircleOutline,
  MdPersonAddAlt,
  MdCalendarToday,
  MdFolderOpen,
} from 'react-icons/md';
import styles from './QuickActions.module.css';

export const QuickActions = () => {
  const navigate = useNavigate();

  const ACTIONS = [
    {
      id: 'qa-create-task',
      label: 'Create Task',
      icon: MdAddCircleOutline,
      onClick: () => navigate('/tasks'),
    },
    {
      id: 'qa-invite-user',
      label: 'Invite User',
      icon: MdPersonAddAlt,
      onClick: () => navigate('/users'),
    },
    {
      id: 'qa-calendar',
      label: 'View Calendar',
      icon: MdCalendarToday,
      onClick: () => navigate('/calendar'),
    },
    {
      id: 'qa-projects',
      label: 'Manage Projects',
      icon: MdFolderOpen,
      onClick: () => navigate('/projects'),
    },
  ];

  return (
    <div className={styles.card}>
      <SectionTitle
        title="Quick Actions"
        subtitle="Frequently used tools and workflow shortcuts"
      />

      <div className={styles.grid}>
        {ACTIONS.map(({ id, label, icon: Icon, onClick }) => (
          <button key={id} type="button" className={styles.actionBtn} onClick={onClick}>
            <div className={styles.iconWrap}>
              <Icon />
            </div>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
