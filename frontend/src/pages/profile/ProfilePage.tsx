import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MdPerson, MdEmail, MdWork, MdLocationOn, MdCalendarToday } from 'react-icons/md';

import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import Toast from '../../components/common/Toast';
import ActivityTimeline from '../../components/dashboard/ActivityTimeline';
import { MOCK_ACTIVITIES } from '../../utils/mockDashboardData';
import styles from './Profile.module.css';

const profileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.email('Please enter a valid email address'),
  jobTitle: z.string().min(1, 'Job title is required'),
  department: z.string().min(1, 'Department is required'),
  bio: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'activity'>('profile');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: 'Izza Eiman',
      email: 'izzaeiman0@gmail.com',
      jobTitle: 'Software Engineer',
      department: '.NET Fullstack Cohort 9',
      bio: 'Building high-performance SaaS applications with React 19, TypeScript, Vite, and ASP.NET Core Web API.',
    },
  });

  const handleSaveProfile = async () => {
    // TODO: Connect to ASP.NET Core Web API → await userService.updateProfile();
    await new Promise((res) => setTimeout(res, 600));
    setToastMessage('Profile information updated successfully!');
  };

  return (
    <div className={styles.page}>
      {/* ── Cover & Header Card ───────────────────────────────────────────── */}
      <div className={styles.coverHeader}>
        <div className={styles.coverBanner} />
        <div className={styles.profileInfoRow}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px' }}>
            <div className={styles.avatarWrap}>
              <img
                src="https://i.pravatar.cc/150?img=68"
                alt="Izza Eiman"
                className={styles.avatar}
              />
            </div>
            <div className={styles.userMeta}>
              <h1 className={styles.userName}>Izza Eiman</h1>
              <div className={styles.userSub}>
                <span>
                  <MdWork size={14} style={{ verticalAlign: 'middle' }} /> Software Engineer (.NET Cohort 9)
                </span>
                <span>
                  <MdLocationOn size={14} style={{ verticalAlign: 'middle' }} /> Islamabad, Pakistan
                </span>
                <span>
                  <MdCalendarToday size={14} style={{ verticalAlign: 'middle' }} /> Joined July 2026
                </span>
              </div>
            </div>
          </div>

          <AppButton variant="outlined" size="sm" onClick={() => setToastMessage('Avatar edit modal (UI Demo)')}>
            Change Avatar
          </AppButton>
        </div>
      </div>

      {/* ── Navigation Tabs ───────────────────────────────────────────────── */}
      <div className={styles.tabsBar}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile Details
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'activity' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          My Activity Timeline
        </button>
      </div>

      {/* ── Tab Content ───────────────────────────────────────────────────── */}
      {activeTab === 'profile' ? (
        <div className={styles.card}>
          <form onSubmit={handleSubmit(handleSaveProfile)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className={styles.formGrid}>
              <AppInput
                id="prof-name"
                label="Full Name"
                leftIcon={<MdPerson />}
                error={errors.fullName?.message}
                {...register('fullName')}
              />

              <AppInput
                id="prof-email"
                label="Email Address"
                type="email"
                leftIcon={<MdEmail />}
                error={errors.email?.message}
                {...register('email')}
              />

              <AppInput
                id="prof-title"
                label="Job Title"
                leftIcon={<MdWork />}
                error={errors.jobTitle?.message}
                {...register('jobTitle')}
              />

              <AppInput
                id="prof-dept"
                label="Department / Program"
                error={errors.department?.message}
                {...register('department')}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#444', display: 'block', marginBottom: '6px' }}>
                Professional Bio
              </label>
              <textarea
                style={{
                  width: '100%',
                  minHeight: '90px',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: '1.5px solid #DDDDDD',
                  fontFamily: 'var(--font-family)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
                {...register('bio')}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <AppButton type="submit" variant="primary" size="md" isLoading={isSubmitting}>
                Save Changes
              </AppButton>
            </div>
          </form>
        </div>
      ) : (
        <ActivityTimeline activities={MOCK_ACTIVITIES} />
      )}

      {/* Toast */}
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};

export default ProfilePage;
