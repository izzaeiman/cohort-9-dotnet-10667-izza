import { useState, useEffect, useMemo, useCallback } from 'react';
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
import Pagination from '../../components/shared/Pagination';
import ConfirmationDialog from '../../components/shared/ConfirmationDialog';
import PageLoader from '../../components/common/PageLoader';

import { userService } from '../../services/userService';
import type { UserItem } from '../../data/users';
import styles from './Users.module.css';

const inviteUserSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  role: z.string().min(1, 'Role is required'),
  department: z.string().min(1, 'Department is required'),
  phone: z.string().optional(),
});

type InviteUserFormData = z.infer<typeof inviteUserSchema>;

const PAGE_SIZE = 5;

export const UsersPage = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Active Menus
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteUserFormData>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'Regular User',
      department: 'Software Engineering',
      phone: '',
    },
  });

  const loadUsers = useCallback(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    userService.getUsers()
      .then((data) => {
        if (isMounted) {
          setUsers(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load users', err);
        if (isMounted) {
          setError('Failed to load users. Please check your connection and try again.');
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!activeMenuId) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.menuDropdown}`) && !target.closest(`[aria-label^="User actions for"]`)) {
        setActiveMenuId(null);
      }
    };

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveMenuId(null);
    };

    const handleScroll = () => {
      setActiveMenuId(null);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeydown);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [activeMenuId]);

  useEffect(() => {
    const cancelLoad = loadUsers();
    return () => cancelLoad();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE) || 1;

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, currentPage]);

  const handleInviteUser = async (data: InviteUserFormData) => {
    const newUser = await userService.inviteUser({
      name: data.name,
      email: data.email,
      role: data.role as any,
      department: data.department,
      phone: data.phone || '+1 (555) 000-0000',
    });

    setUsers((prev) => [newUser, ...prev]);
    setIsInviteModalOpen(false);
    reset();
    setToastMessage(`Invitation sent to ${data.email}!`);
  };

  const handleEditUser = async (data: InviteUserFormData) => {
    if (!editingUser) return;
    const updated = await userService.updateUser(editingUser.id, {
      name: data.name,
      email: data.email,
      role: data.role as any,
      department: data.department,
      phone: data.phone || editingUser.phone,
    });

    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setEditingUser(null);
    setToastMessage(`User ${updated.name} updated successfully!`);
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    await userService.deleteUser(deletingUser.id);
    setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
    setDeletingUser(null);
    setToastMessage('User member deleted successfully!');
  };

  if (isLoading) return <PageLoader />;

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px', padding: '20px' }}>
        <p style={{ color: '#EF4444', fontWeight: 600, fontSize: '1.1rem' }}>{error}</p>
        <AppButton variant="primary" onClick={loadUsers}>Retry Loading</AppButton>
      </div>
    );
  }

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
          onClick={() => {
            reset({
              name: '',
              email: '',
              role: 'Regular User',
              department: 'Software Engineering',
              phone: '',
            });
            setIsInviteModalOpen(true);
          }}
        >
          Invite User
        </AppButton>
      </header>

      {/* ── Summary Metrics ───────────────────────────────────────────────── */}
      <div className={styles.statsGrid} aria-label="User metrics">
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
          <span className={styles.searchIcon} aria-hidden="true">
            <MdSearch size={18} />
          </span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search name or email..."
            aria-label="Search user members by name or email"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            className={styles.selectFilter}
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter user members by role"
          >
            <option value="all">All Roles</option>
            <option value="Administrator">Administrators</option>
            <option value="Regular User">Regular Users</option>
          </select>

          <select
            className={styles.selectFilter}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter user members by status"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="offline">Offline</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* ── User Table / Empty State ──────────────────────────────────────── */}
      {paginatedUsers.length > 0 ? (
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
              {paginatedUsers.map((u) => (
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
                        aria-hidden="true"
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor:
                            u.status === 'active'
                              ? '#2E7D32'
                              : u.status === 'pending'
                              ? '#7F5000'
                              : '#777',
                        }}
                      />
                      {u.status.toUpperCase()}
                    </span>
                  </td>
                  <td className={styles.td}>{u.lastActive}</td>
                  <td className={styles.td} style={{ textAlign: 'right', position: 'relative' }}>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}
                      title={`User actions for ${u.name}`}
                      aria-label={`User actions for ${u.name}`}
                      onClick={() => setActiveMenuId((prev) => (prev === u.id ? null : u.id))}
                    >
                      <MdMoreVert size={18} />
                    </button>

                    {activeMenuId === u.id && (
                      <div className={styles.menuDropdown}>
                        <button
                          type="button"
                          className={styles.menuItem}
                          onClick={() => {
                            setActiveMenuId(null);
                            setEditingUser(u);
                            reset({
                              name: u.name,
                              email: u.email,
                              role: u.role,
                              department: u.department,
                              phone: u.phone,
                            });
                          }}
                        >
                          Edit User
                        </button>
                        <button
                          type="button"
                          className={`${styles.menuItem} ${styles.menuItemDanger}`}
                          onClick={() => {
                            setActiveMenuId(null);
                            setDeletingUser(u);
                          }}
                        >
                          Delete User
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredUsers.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
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
      <Modal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} title="Invite Team Member">
        <form className={styles.modalForm} onSubmit={handleSubmit(handleInviteUser)} noValidate>
          <AppInput
            id="inv-fullname"
            label="Full Name"
            placeholder="e.g. Charlie Davis"
            error={errors.name?.message}
            {...register('name')}
          />

          <AppInput
            id="inv-email"
            label="Email Address"
            type="email"
            placeholder="charlie@example.test"
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <AppButton type="button" variant="outlined" size="md" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </AppButton>
            <AppButton type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              Send Invitation
            </AppButton>
          </div>
        </form>
      </Modal>

      {/* ── Edit User Modal ──────────────────────────────────────────────── */}
      <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title="Edit Team Member">
        <form className={styles.modalForm} onSubmit={handleSubmit(handleEditUser)} noValidate>
          <AppInput
            id="edit-user-fullname"
            label="Full Name"
            error={errors.name?.message}
            {...register('name')}
          />

          <AppInput
            id="edit-user-email"
            label="Email Address"
            type="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <AppSelect
            id="edit-user-role"
            label="Role Assignment"
            options={[
              { value: 'Regular User', label: 'Regular User' },
              { value: 'Administrator', label: 'Administrator' },
            ]}
            error={errors.role?.message}
            {...register('role')}
          />

          <AppInput
            id="edit-user-dept"
            label="Department"
            error={errors.department?.message}
            {...register('department')}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <AppButton type="button" variant="outlined" size="md" onClick={() => setEditingUser(null)}>
              Cancel
            </AppButton>
            <AppButton type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              Save Changes
            </AppButton>
          </div>
        </form>
      </Modal>

      {/* Delete User Confirmation */}
      <ConfirmationDialog
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDeleteUser}
        title="Delete User Member"
        message={`Are you sure you want to remove user "${deletingUser?.name}" (${deletingUser?.email})?`}
        confirmLabel="Remove User"
        isDanger
      />

      {/* Toast */}
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};

export default UsersPage;
