import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  MdOutlinePalette,
  MdNotificationsNone,
  MdLockOutline,
  MdLanguage,
  MdInfoOutline,
} from 'react-icons/md';

import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import AppSelect from '../../components/ui/AppSelect';
import Toast from '../../components/common/Toast';
import useTheme from '../../hooks/useTheme';
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

  const [activeTab, setActiveTab] = useState<'appearance' | 'notifications' | 'security' | 'regional'>('appearance');

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  const [language, setLanguage] = useState('en-US');
  const [timezone, setTimezone] = useState('America/New_York');

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

  const handleChangePassword = async () => {
    await new Promise((res) => setTimeout(res, 400));
    reset();
    setToastMessage('Coming Soon — Password modification pending ASP.NET Core API integration');
  };

  const handleSaveSettings = () => {
    setToastMessage('Settings preferences updated for current session.');
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
        <div className={styles.navCard} role="tablist" aria-label="Settings categories">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'appearance'}
            className={`${styles.navItem} ${activeTab === 'appearance' ? styles.navActive : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            <MdOutlinePalette size={18} />
            <span>Appearance & Theme</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'notifications'}
            className={`${styles.navItem} ${activeTab === 'notifications' ? styles.navActive : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <MdNotificationsNone size={18} />
            <span>Notification Preferences</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'security'}
            className={`${styles.navItem} ${activeTab === 'security' ? styles.navActive : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <MdLockOutline size={18} />
            <span>Password & Security</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'regional'}
            className={`${styles.navItem} ${activeTab === 'regional' ? styles.navActive : ''}`}
            onClick={() => setActiveTab('regional')}
          >
            <MdLanguage size={18} />
            <span>Language & Region</span>
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

              <div className={styles.pendingBanner}>
                <MdInfoOutline size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                <span>Backend Integration Pending — Password modifications will connect to ASP.NET Core Identity API.</span>
              </div>

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
            </div>
          )}

          {activeTab === 'regional' && (
            <div>
              <h3 className={styles.sectionTitle}>Language & Region</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '420px' }}>
                <AppSelect
                  id="sel-lang"
                  label="Display Language"
                  options={[
                    { value: 'en-US', label: 'English (United States)' },
                    { value: 'en-GB', label: 'English (United Kingdom)' },
                    { value: 'ur-PK', label: 'Urdu (Pakistan)' },
                  ]}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                />

                <AppSelect
                  id="sel-tz"
                  label="Time Zone"
                  options={[
                    { value: 'America/New_York', label: 'Eastern Time (America/New_York)' },
                    { value: 'Asia/Karachi', label: '(GMT+05:00) Islamabad, Karachi' },
                    { value: 'UTC', label: '(GMT+00:00) UTC' },
                  ]}
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                />

                <div style={{ marginTop: '12px' }}>
                  <AppButton variant="primary" size="md" onClick={handleSaveSettings}>
                    Save Localization
                  </AppButton>
                </div>
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
