import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  MdPerson,
  MdEmail,
  MdWork,
  MdInfoOutline,
} from 'react-icons/md';

import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import Toast from '../../components/common/Toast';
import PageLoader from '../../components/common/PageLoader';
import ActivityTimeline from '../../components/dashboard/ActivityTimeline';

import useAuth from '../../hooks/useAuth';
import { profileService, type ProfileDto } from '../../services/profileService';
import { INITIAL_ACTIVITIES } from '../../data/activity';
import styles from './Profile.module.css';

const profileSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const getAvatarUrl = (avatarPath?: string, name?: string) => {
  if (!avatarPath) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random`;
  }
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }
  const backendBase = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 'http://localhost:5000';
  return `${backendBase}${avatarPath}`;
};

export const ProfilePage = () => {
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'activity'>('profile');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updateUserAvatar } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setToastMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const api = (await import('../../services/api')).default;
      const res = await api.post('/uploads/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data?.avatarUrl) {
        const newAvatarUrl = res.data.avatarUrl;
        setProfile((prev) => prev ? { ...prev, avatar: newAvatarUrl } : null);
        updateUserAvatar(newAvatarUrl);
        setToastMessage('Avatar updated successfully!');
      }
    } catch (err: any) {
      setToastMessage(err.response?.data?.message || 'Failed to upload avatar.');
    } finally {
      setIsUploading(false);
    }
  };

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
            <div
              className={styles.avatarWrap}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              style={{ cursor: isUploading ? 'not-allowed' : 'pointer', position: 'relative' }}
              title="Click to change photo"
            >
              <img
                src={getAvatarUrl(profile.avatar, profile.name)}
                alt={`${profile.name} avatar`}
                className={styles.avatar}
                style={{ opacity: isUploading ? 0.5 : 1 }}
              />
              {isUploading && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.3)',
                  color: '#fff',
                  borderRadius: '50%',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>
                  Uploading...
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
                accept="image/*"
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
          Activity (Sample Data)
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
      ) : null }

      {/* Toast */}
      {toastMessage && (
        <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};

export default ProfilePage;
