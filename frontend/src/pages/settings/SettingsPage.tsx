import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  MdOutlinePalette,
  MdNotificationsNone,
  MdLockOutline,
} from 'react-icons/md';

import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import AppSelect from '../../components/ui/AppSelect';
import Toast from '../../components/common/Toast';
import useTheme from '../../hooks/useTheme';
import { authService } from '../../services/authService';
import apiClient from '../../services/api';
import styles from './Settings.module.css';

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

export const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'appearance' | 'notifications' | 'security'>('appearance');

  const getStoredSettings = () => {
    const stored = localStorage.getItem('workflow_settings');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Fallback
      }
    }
    return null;
  };

  const storedSettings = getStoredSettings();

  const [emailAlerts, setEmailAlerts] = useState(storedSettings?.emailAlerts ?? true);
  const [pushAlerts, setPushAlerts] = useState(storedSettings?.pushAlerts ?? true);
  const [weeklyDigest, setWeeklyDigest] = useState(storedSettings?.weeklyDigest ?? true);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const handleToggleDarkMode = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  const handleChangePassword = async (data: PasswordChangeFormData) => {
    try {
      await authService.changePassword(data.currentPassword, data.newPassword);
      reset();
      setToastMessage('Password updated successfully!');
    } catch (err: any) {
      setToastMessage(err.response?.data?.message || err.message || 'Failed to update password.');
    }
  };

  const handleSaveSettings = () => {
    try {
      const settings = {
        emailAlerts,
        pushAlerts,
        weeklyDigest,
      };
      localStorage.setItem('workflow_settings', JSON.stringify(settings));
      setToastMessage('Settings preferences saved!');
    } catch {
      setToastMessage('Failed to save settings preferences.');
    }
  };

  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  const fetchSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const response = await apiClient.get('/auth/sessions');
      setSessions(response.data);
    } catch {
      // Fallback
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'security') {
      fetchSessions();
    }
  }, [activeTab, fetchSessions]);

  const handleRevokeSession = async (id: number) => {
    try {
      await authService.ensureCsrfToken();
      await apiClient.post(`/auth/sessions/${id}/revoke`);
      setToastMessage('Session revoked successfully!');
      fetchSessions();
    } catch (err: any) {
      setToastMessage(err.response?.data?.message || err.message || 'Failed to revoke session.');
    }
  };

  return (
    <div className={styles.page}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <h1 className={styles.title}>System Settings</h1>
        <p className={styles.subtitle}>
          Configure application preferences, security, notifications, and localization
        </p>
      </header>

      {/* ── Settings Grid ─────────────────────────────────────────────────── */}
      <div className={styles.grid}>
        {/* Left Side Navigation */}
        <div className={styles.navCard} aria-label="Settings categories">
          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'appearance' ? styles.navActive : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            <MdOutlinePalette size={18} />
            <span>Appearance & Theme</span>
          </button>
          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'notifications' ? styles.navActive : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <MdNotificationsNone size={18} />
            <span>Notification Preferences</span>
          </button>
          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'security' ? styles.navActive : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <MdLockOutline size={18} />
            <span>Password & Security</span>
          </button>
        </div>

        {/* Right Side Content Panel */}
        <div className={styles.contentCard}>
          {activeTab === 'appearance' && (
            <div>
              <h3 className={styles.sectionTitle}>Appearance Settings</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '16px' }}>
                Customize how WorkFlow looks on your screen
              </p>

              <div className={styles.toggleRow}>
                <div className={styles.toggleInfo}>
                  <label id="darkmode-lbl" htmlFor="darkmode-switch" className={styles.toggleLabel}>
                    Dark Mode (Theme Toggle)
                  </label>
                  <span className={styles.toggleSub}>Switch between light and dark UI themes</span>
                </div>
                <label className={styles.switch}>
                  <input
                    id="darkmode-switch"
                    type="checkbox"
                    checked={isDarkMode}
                    aria-labelledby="darkmode-lbl"
                    onChange={(e) => handleToggleDarkMode(e.target.checked)}
                  />
                  <span className={styles.slider} aria-hidden="true" />
                </label>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <AppButton variant="primary" size="md" onClick={handleSaveSettings}>
                  Save Preference
                </AppButton>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h3 className={styles.sectionTitle}>Notification Preferences</h3>

              <div className={styles.toggleRow}>
                <div className={styles.toggleInfo}>
                  <label id="email-reminders-lbl" htmlFor="email-reminders-switch" className={styles.toggleLabel}>
                    Email Task Reminders
                  </label>
                  <span className={styles.toggleSub}>Receive email alerts for task assignments and deadlines</span>
                </div>
                <label className={styles.switch}>
                  <input
                    id="email-reminders-switch"
                    type="checkbox"
                    checked={emailAlerts}
                    aria-labelledby="email-reminders-lbl"
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                  />
                  <span className={styles.slider} aria-hidden="true" />
                </label>
              </div>

              <div className={styles.toggleRow}>
                <div className={styles.toggleInfo}>
                  <label id="push-alerts-lbl" htmlFor="push-alerts-switch" className={styles.toggleLabel}>
                    Desktop Push Notifications
                  </label>
                  <span className={styles.toggleSub}>Show browser popups when comments or reviews are posted</span>
                </div>
                <label className={styles.switch}>
                  <input
                    id="push-alerts-switch"
                    type="checkbox"
                    checked={pushAlerts}
                    aria-labelledby="push-alerts-lbl"
                    onChange={(e) => setPushAlerts(e.target.checked)}
                  />
                  <span className={styles.slider} aria-hidden="true" />
                </label>
              </div>

              <div className={styles.toggleRow}>
                <div className={styles.toggleInfo}>
                  <label id="digest-lbl" htmlFor="digest-switch" className={styles.toggleLabel}>
                    Weekly Summary Digest
                  </label>
                  <span className={styles.toggleSub}>Receive a weekly productivity report on Mondays</span>
                </div>
                <label className={styles.switch}>
                  <input
                    id="digest-switch"
                    type="checkbox"
                    checked={weeklyDigest}
                    aria-labelledby="digest-lbl"
                    onChange={(e) => setWeeklyDigest(e.target.checked)}
                  />
                  <span className={styles.slider} aria-hidden="true" />
                </label>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <AppButton variant="primary" size="md" onClick={handleSaveSettings}>
                  Save Preferences
                </AppButton>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h3 className={styles.sectionTitle}>Change Password</h3>

              <form onSubmit={handleSubmit(handleChangePassword)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '420px' }}>
                <AppInput
                  id="cur-pass"
                  label="Current Password"
                  type="password"
                  error={errors.currentPassword?.message}
                  {...register('currentPassword')}
                />

                <AppInput
                  id="new-pass"
                  label="New Password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  error={errors.newPassword?.message}
                  {...register('newPassword')}
                />

                <AppInput
                  id="conf-new-pass"
                  label="Confirm New Password"
                  type="password"
                  error={errors.confirmNewPassword?.message}
                  {...register('confirmNewPassword')}
                />

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <AppButton type="submit" variant="primary" size="md" isLoading={isSubmitting}>
                    Update Password
                  </AppButton>
                  <AppButton type="button" variant="outlined" size="md" onClick={() => reset()}>
                    Reset
                  </AppButton>
                </div>
              </form>

              <div style={{ marginTop: '32px', borderTop: '1px solid var(--color-border)', paddingTop: '24px' }}>
                <h3 className={styles.sectionTitle}>Active Sessions</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '16px' }}>
                  Manage the devices and browsers that are currently logged in to your account
                </p>

                {isLoadingSessions ? (
                  <div style={{ padding: '12px 0', color: 'var(--color-text-secondary)' }}>Loading active sessions...</div>
                ) : sessions.length === 0 ? (
                  <div style={{ padding: '12px 0', color: 'var(--color-text-secondary)' }}>No active sessions found.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px', maxWidth: '500px' }}>
                    {sessions.map((sess) => (
                      <div key={sess.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        backgroundColor: 'var(--color-bg-card)'
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>Session #{sess.id}</span>
                            {sess.isCurrent && (
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: '#E3F2FD',
                                color: '#1565C0',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                              }}>Current Session</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                            Created: {new Date(sess.createdAt).toLocaleString()}
                          </div>
                        </div>
                        {!sess.isCurrent && (
                          <AppButton variant="secondary" size="sm" onClick={() => handleRevokeSession(sess.id)}>
                            Revoke
                          </AppButton>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};

export default SettingsPage;
