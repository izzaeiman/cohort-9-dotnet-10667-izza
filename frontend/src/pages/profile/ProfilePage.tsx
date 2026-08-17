import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  MdPerson,
  MdEmail,
  MdWork,
  MdInfoOutline,
  MdDevices,
} from 'react-icons/md';

import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import Toast from '../../components/common/Toast';
import PageLoader from '../../components/common/PageLoader';
import ActivityTimeline from '../../components/dashboard/ActivityTimeline';

import { profileService, type ProfileDto } from '../../services/profileService';
import { INITIAL_ACTIVITIES } from '../../data/activity';
import styles from './Profile.module.css';

const profileSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const ProfilePage = () => {
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const loadProfile = () => {
    setIsLoading(true);
    setError(null);
    profileService.getProfile()
      .then((data) => {
        setProfile(data);
        reset({
          name: data.name,
          email: data.email,
        });
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load your profile. Please try again.');
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadProfile();
  }, [reset]);

  const handleSaveProfile = async (data: ProfileFormData) => {
    try {
      const updated = await profileService.updateProfile({
        name: data.name,
        email: data.email,
      });
      setProfile(updated);
      setToastMessage('Profile information updated successfully!');
    } catch (err) {
      setToastMessage('Failed to update profile.');
    }
  };

  if (isLoading) return <PageLoader />;

  if (error) {
    return (
      <div className={styles.page} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '20px' }}>
        <div style={{ color: '#ef4444', fontSize: '1.2rem', textAlign: 'center' }}>{error}</div>
        <AppButton onClick={loadProfile} variant="primary">Retry</AppButton>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className={styles.page}>
      {/* ── Cover & Header Card ───────────────────────────────────────────── */}
      <div className={styles.coverHeader}>
        <div className={styles.coverBanner} />
        <div className={styles.profileInfoRow}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '20px' }}>
            <div className={styles.avatarWrap}>
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random`}
                alt={`${profile.name} avatar`}
                className={styles.avatar}
              />
            </div>
            <div className={styles.userMeta}>
              <h1 className={styles.userName}>{profile.name}</h1>
              <div className={styles.userSub}>
                <span>
                  <MdWork size={14} style={{ verticalAlign: 'middle' }} /> {profile.role}
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
      <div className={styles.tabsBar} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'profile'}
          className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile Details
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'activity'}
          className={`${styles.tabBtn} ${activeTab === 'activity' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          My Activity Timeline
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'security'}
          className={`${styles.tabBtn} ${activeTab === 'security' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Sessions & Security
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
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <AppButton type="submit" variant="primary" size="md" isLoading={isSubmitting}>
                Save Profile
              </AppButton>
            </div>
          </form>
        </div>
      ) : activeTab === 'activity' ? (
        <ActivityTimeline activities={INITIAL_ACTIVITIES} />
      ) : (
        <div className={styles.card} style={{ gap: '16px' }}>
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
              <div style={{ fontSize: '0.78rem', color: '#666' }}>Windows • Chrome • (Active Now)</div>
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
