import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  MdOutlinePalette,
  MdNotificationsNone,
  MdLockOutline,
  MdLanguage,
} from 'react-icons/md';

import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import AppSelect from '../../components/ui/AppSelect';
import Toast from '../../components/common/Toast';
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
  const [activeTab, setActiveTab] = useState<'appearance' | 'notifications' | 'security' | 'regional'>('appearance');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  const [language, setLanguage] = useState('en-US');
  const [timezone, setTimezone] = useState('Asia/Karachi');

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

  const handleChangePassword = async () => {
    // TODO: Connect to ASP.NET Core Web API → await userService.changePassword(data);
    await new Promise((res) => setTimeout(res, 700));
    reset();
    setToastMessage('Password updated successfully!');
  };

  const handleSaveSettings = () => {
    // TODO: Save preferences to local/server
    setToastMessage('Settings preferences saved!');
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
        <div className={styles.navCard}>
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
          <button
            type="button"
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
              <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '16px' }}>
                Customize how WorkFlow looks on your screen
              </p>

              <div className={styles.toggleRow}>
                <div className={styles.toggleInfo}>
                  <span className={styles.toggleLabel}>Dark Mode (Theme Toggle)</span>
                  <span className={styles.toggleSub}>Switch between light and dark UI themes</span>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={isDarkMode}
                    onChange={(e) => setIsDarkMode(e.target.checked)}
                  />
                  <span className={styles.slider} />
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
                  <span className={styles.toggleLabel}>Email Task Reminders</span>
                  <span className={styles.toggleSub}>Receive email alerts for task assignments and deadlines</span>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                  />
                  <span className={styles.slider} />
                </label>
              </div>

              <div className={styles.toggleRow}>
                <div className={styles.toggleInfo}>
                  <span className={styles.toggleLabel}>Desktop Push Notifications</span>
                  <span className={styles.toggleSub}>Show browser popups when comments or reviews are posted</span>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={pushAlerts}
                    onChange={(e) => setPushAlerts(e.target.checked)}
                  />
                  <span className={styles.slider} />
                </label>
              </div>

              <div className={styles.toggleRow}>
                <div className={styles.toggleInfo}>
                  <span className={styles.toggleLabel}>Weekly Summary Digest</span>
                  <span className={styles.toggleSub}>Receive a weekly productivity report on Mondays</span>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={weeklyDigest}
                    onChange={(e) => setWeeklyDigest(e.target.checked)}
                  />
                  <span className={styles.slider} />
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
                    { value: 'Asia/Karachi', label: '(GMT+05:00) Islamabad, Karachi' },
                    { value: 'UTC', label: '(GMT+00:00) UTC' },
                    { value: 'America/New_York', label: '(GMT-05:00) Eastern Time' },
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
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};

export default SettingsPage;
