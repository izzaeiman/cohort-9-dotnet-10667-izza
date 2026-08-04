import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MdPersonAdd, MdSearch, MdMoreVert } from 'react-icons/md';

import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import AppSelect from '../../components/ui/AppSelect';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';
import styles from './Users.module.css';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'Administrator' | 'Regular User';
  department: string;
  status: 'active' | 'offline' | 'pending';
  lastActive: string;
  avatar: string;
}

const MOCK_USERS: UserItem[] = [
  {
    id: 'usr-1',
    name: 'Izza Eiman',
    email: 'izzaeiman0@gmail.com',
    role: 'Administrator',
    department: 'Fullstack Engineering',
    status: 'active',
    lastActive: 'Just now',
    avatar: 'https://i.pravatar.cc/150?img=68',
  },
  {
    id: 'usr-2',
    name: 'Nouman (Mentor)',
    email: 'nouman@10pearls.com',
    role: 'Administrator',
    department: 'Tech Lead / Reviewer',
    status: 'active',
    lastActive: '15 mins ago',
    avatar: 'https://i.pravatar.cc/150?img=33',
  },
  {
    id: 'usr-3',
    name: 'Sarah Connor',
    email: 'sarah.c@workflow.io',
    role: 'Regular User',
    department: 'UI/UX Design',
    status: 'active',
    lastActive: '1 hour ago',
    avatar: 'https://i.pravatar.cc/150?img=32',
  },
  {
    id: 'usr-4',
    name: 'Alex Rivera',
    email: 'alex.r@workflow.io',
    role: 'Regular User',
    department: 'Backend Engineering',
    status: 'offline',
    lastActive: 'Yesterday',
    avatar: 'https://i.pravatar.cc/150?img=12',
  },
  {
    id: 'usr-5',
    name: 'Elena Rostova',
    email: 'elena.r@workflow.io',
    role: 'Regular User',
    department: 'QA & Testing',
    status: 'pending',
    lastActive: 'Invited',
    avatar: 'https://i.pravatar.cc/150?img=47',
  },
];

const inviteUserSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.email('Please enter a valid email address'),
  role: z.enum(['Administrator', 'Regular User']),
  department: z.string().min(1, 'Department is required'),
});

type InviteUserFormData = z.infer<typeof inviteUserSchema>;

export const UsersPage = () => {
  const [users, setUsers] = useState<UserItem[]>(MOCK_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteUserFormData>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      fullName: '',
      email: '',
      role: 'Regular User',
      department: 'Software Engineering',
    },
  });

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const handleInviteUser = async (data: InviteUserFormData) => {
    // TODO: Connect to ASP.NET Core Web API → await userService.inviteUser(data);
    await new Promise((res) => setTimeout(res, 600));

    const newUser: UserItem = {
      id: `usr-${users.length + 1}`,
      name: data.fullName,
      email: data.email,
      role: data.role,
      department: data.department,
      status: 'pending',
      lastActive: 'Invited',
      avatar: `https://i.pravatar.cc/150?img=${(users.length % 50) + 12}`,
    };

    setUsers((prev) => [newUser, ...prev]);
    setIsModalOpen(false);
    reset();
    setToastMessage(`Invitation sent to ${data.email}!`);
  };

  return (
    <div className={styles.page}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>User Management</h1>
          <p className={styles.subtitle}>
            Manage team members, roles, departments, and access permissions
          </p>
        </div>

        <AppButton
          variant="primary"
          size="md"
          leftIcon={<MdPersonAdd size={20} />}
          onClick={() => setIsModalOpen(true)}
        >
          Invite User
        </AppButton>
      </header>

      {/* ── Summary Cards ─────────────────────────────────────────────────── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Members</span>
          <span className={styles.statVal}>{users.length}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Administrators</span>
          <span className={styles.statVal}>
            {users.filter((u) => u.role === 'Administrator').length}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Active Now</span>
          <span className={styles.statVal}>
            {users.filter((u) => u.status === 'active').length}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Pending Invites</span>
          <span className={styles.statVal}>
            {users.filter((u) => u.status === 'pending').length}
          </span>
        </div>
      </div>

      {/* ── Controls Bar ──────────────────────────────────────────────────── */}
      <div className={styles.controlsBar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>
            <MdSearch size={18} />
          </span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className={styles.selectFilter}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Filter by role"
        >
          <option value="all">All Roles</option>
          <option value="Administrator">Administrators</option>
          <option value="Regular User">Regular Users</option>
        </select>
      </div>

      {/* ── User Table / Empty State ──────────────────────────────────────── */}
      {filteredUsers.length > 0 ? (
        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>User Member</th>
                <th className={styles.th}>Role</th>
                <th className={styles.th}>Department</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Last Active</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className={styles.tr}>
                  <td className={styles.td}>
                    <div className={styles.userCell}>
                      <img src={u.avatar} alt={u.name} className={styles.avatar} />
                      <div className={styles.nameWrap}>
                        <span className={styles.userName}>{u.name}</span>
                        <span className={styles.userEmail}>{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <span
                      className={`${styles.roleBadge} ${
                        u.role === 'Administrator' ? styles.roleAdmin : styles.roleUser
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className={styles.td}>{u.department}</td>
                  <td className={styles.td}>
                    <span
                      className={`${styles.statusPill} ${
                        u.status === 'active'
                          ? styles.statusActive
                          : u.status === 'pending'
                          ? styles.statusPending
                          : styles.statusOffline
                      }`}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor:
                            u.status === 'active'
                              ? '#4CAF50'
                              : u.status === 'pending'
                              ? '#FFC107'
                              : '#999',
                        }}
                      />
                      {u.status.toUpperCase()}
                    </span>
                  </td>
                  <td className={styles.td}>{u.lastActive}</td>
                  <td className={styles.td} style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}
                      title="User Actions"
                    >
                      <MdMoreVert size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No members found"
          description="No users matched your current search filters."
          actionLabel="Clear Search"
          onAction={() => setSearchTerm('')}
        />
      )}

      {/* ── Invite User Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Invite Team Member">
        <form className={styles.modalForm} onSubmit={handleSubmit(handleInviteUser)} noValidate>
          <AppInput
            id="inv-fullname"
            label="Full Name"
            placeholder="e.g. David Miller"
            error={errors.fullName?.message}
            {...register('fullName')}
          />

          <AppInput
            id="inv-email"
            label="Email Address"
            type="email"
            placeholder="david@company.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <AppSelect
            id="inv-role"
            label="Role Assignment"
            options={[
              { value: 'Regular User', label: 'Regular User' },
              { value: 'Administrator', label: 'Administrator' },
            ]}
            error={errors.role?.message}
            {...register('role')}
          />

          <AppInput
            id="inv-dept"
            label="Department"
            placeholder="e.g. Frontend Engineering"
            error={errors.department?.message}
            {...register('department')}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <AppButton type="button" variant="outlined" size="md" onClick={() => setIsModalOpen(false)}>
              Cancel
            </AppButton>
            <AppButton type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              Send Invitation
            </AppButton>
          </div>
        </form>
      </Modal>

      {/* Toast */}
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};

export default UsersPage;
