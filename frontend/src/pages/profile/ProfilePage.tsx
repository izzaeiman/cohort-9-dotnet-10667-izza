import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  MdPerson,
  MdEmail,
  MdWork,
  MdPhone,
  MdLocationOn,
  MdCalendarToday,
  MdInfoOutline,
  MdDevices,
} from 'react-icons/md';

import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import Toast from '../../components/common/Toast';
import PageLoader from '../../components/common/PageLoader';
import ActivityTimeline from '../../components/dashboard/ActivityTimeline';

import { profileService } from '../../services/profileService';
import { INITIAL_ACTIVITIES } from '../../data/activity';
import type { UserItem } from '../../data/users';
import styles from './Profile.module.css';

const profileSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  department: z.string().min(1, 'Department is required'),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const ProfilePage = () => {
  const [profile, setProfile] = useState<UserItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'activity' | 'security'>('profile');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    let isMounted = true;
    profileService.getProfile().then((data) => {
      if (isMounted) {
        setProfile(data);
        reset({
          name: data.name,
          email: data.email,
          department: data.department,
          phone: data.phone || '',
          bio: data.bio || '',
        });
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [reset]);

  const handleSaveProfile = async (data: ProfileFormData) => {
    const updated = await profileService.updateProfile({
      name: data.name,
      email: data.email,
      department: data.department,
      phone: data.phone,
      bio: data.bio,
    });
    setProfile(updated);
    setToastMessage('Profile information updated successfully!');
  };

  if (isLoading || !profile) return <PageLoader />;

  return (
    <div className={styles.page}>
      {/* ── Cover & Header Card ───────────────────────────────────────────── */}
      <div className={styles.coverHeader}>
        <div className={styles.coverBanner} />
        <div className={styles.profileInfoRow}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '20px' }}>
            <div className={styles.avatarWrap}>
              <img
                src={profile.avatar}
                alt={`${profile.name} avatar`}
                className={styles.avatar}
              />
            </div>
            <div className={styles.userMeta}>
              <h1 className={styles.userName}>{profile.name}</h1>
              <div className={styles.userSub}>
                <span>
                  <MdWork size={14} style={{ verticalAlign: 'middle' }} /> {profile.role} ({profile.department})
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

          <AppButton
            variant="outlined"
            size="sm"
            onClick={() => setToastMessage('Avatar upload placeholder — Image picker integration pending.')}
          >
            Upload Avatar
          </AppButton>
        </div>
      </div>

      {/* ── Navigation Tabs ───────────────────────────────────────────────── */}
      <div className={styles.tabsBar} role="tablist" aria-label="Profile section tabs">
        <button
          type="button"
          role="tab"
          id="tab-profile"
          aria-controls="panel-profile"
          aria-selected={activeTab === 'profile'}
          tabIndex={activeTab === 'profile' ? 0 : -1}
          className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile Details
        </button>
        <button
          type="button"
          role="tab"
          id="tab-activity"
          aria-controls="panel-activity"
          aria-selected={activeTab === 'activity'}
          tabIndex={activeTab === 'activity' ? 0 : -1}
          className={`${styles.tabBtn} ${activeTab === 'activity' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          My Activity Timeline
        </button>
        <button
          type="button"
          role="tab"
          id="tab-security"
          aria-controls="panel-security"
          aria-selected={activeTab === 'security'}
          tabIndex={activeTab === 'security' ? 0 : -1}
          className={`${styles.tabBtn} ${activeTab === 'security' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Sessions & Security
        </button>
      </div>

      {/* ── Tab Content ───────────────────────────────────────────────────── */}
      {activeTab === 'profile' ? (
        <div id="panel-profile" role="tabpanel" aria-labelledby="tab-profile" className={styles.card}>
          <form onSubmit={handleSubmit(handleSaveProfile)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className={styles.formGrid}>
              <AppInput
                id="prof-name"
                label="Full Name"
                leftIcon={<MdPerson />}
                error={errors.name?.message}
                {...register('name')}
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
                id="prof-dept"
                label="Department / Program"
                leftIcon={<MdWork />}
                error={errors.department?.message}
                {...register('department')}
              />

              <AppInput
                id="prof-phone"
                label="Phone Number"
                leftIcon={<MdPhone />}
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>

            <div>
              <label htmlFor="prof-bio" className={styles.bioLabel}>
                Professional Biography
              </label>
              <textarea
                id="prof-bio"
                className={styles.bioTextarea}
                {...register('bio')}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <AppButton type="submit" variant="primary" size="md" isLoading={isSubmitting}>
                Save Profile
              </AppButton>
            </div>
          </form>
        </div>
      ) : activeTab === 'activity' ? (
        <div id="panel-activity" role="tabpanel" aria-labelledby="tab-activity">
          <ActivityTimeline activities={INITIAL_ACTIVITIES} />
        </div>
      ) : (
        <div id="panel-security" role="tabpanel" aria-labelledby="tab-security" className={styles.card} style={{ gap: '16px' }}>
          <h3 className={styles.sectionHeading} style={{ margin: 0 }}>
            Active Sessions & Security
          </h3>

          <div
            style={{
              background: '#FFF8E1',
              border: '1px solid rgba(255, 193, 7, 0.4)',
              borderRadius: '12px',
              padding: '14px 16px',
              fontSize: '0.875rem',
              color: '#7F5000',
              fontWeight: 600,
            }}
          >
            <MdInfoOutline size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Backend integration pending — Password modifications and active session revocation require ASP.NET Core Identity API integration.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#F8F8F8', borderRadius: '12px' }}>
            <MdDevices size={24} color="#FF7A1A" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Current Browser Session</div>
              <div style={{ fontSize: '0.78rem', color: '#666' }}>Windows • Chrome • Islamabad, Pakistan (Active Now)</div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};

export default ProfilePage;
