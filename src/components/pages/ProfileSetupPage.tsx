import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { useAuth } from '../auth/AuthContext';
import { profileService } from '../../services/profileService';
import { ProfileFormData } from '../../types/profile.types';
import ProfileForm from '../profile/ProfileForm';
import { CheckCircle, User } from 'lucide-react';
import { isAdminUser } from '../../utils/userUtils';

const ProfileSetupPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { getClass } = useTypography();
  const { userProfile, refreshUserProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect admin users away from profile setup
  React.useEffect(() => {
    if (isAdminUser(userProfile)) {
      console.log('ProfileSetupPage: Admin user detected, redirecting to admin dashboard');
      window.location.hash = '#admin/dashboard';
    }
  }, [userProfile]);

  // Don't render anything for admin users while redirecting
  if (isAdminUser(userProfile)) {
    return (
      <div className="min-h-screen bg-[#110D16] flex items-center justify-center px-4">
        <div className="glass-container rounded-2xl p-8 text-center max-w-md mx-auto">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-white">Redirecting to admin dashboard...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (formData: ProfileFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await profileService.createProfileFromForm(formData);
      await refreshUserProfile();
      setIsComplete(true);
      
      // Redirect to home after a short delay
      setTimeout(() => {
        window.location.hash = '#';
      }, 2000);
    } catch (error: any) {
      console.error('Profile setup error:', error);
      setError(error.message || t('profile.errors.setupFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-[#110D16] flex items-center justify-center px-4">
        <div className="glass-container rounded-2xl p-8 text-center max-w-md mx-auto">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className={`text-2xl ${getClass('header')} text-white mb-4`}>
            {t('profile.setupComplete')}
          </h2>
          <p className={`text-white/80 ${getClass('body')} mb-6`}>
            {t('profile.setupCompleteMessage')}
          </p>
          <div className="loading-spinner mx-auto"></div>
          <p className={`text-sm text-white/60 mt-2 ${getClass('menu')}`}>
            {t('profile.redirecting')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#110D16] pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-3xl ${getClass('header')} text-white mb-2`}>
            {t('profile.setupTitle')}
          </h1>
          <p className={`text-white/80 text-lg ${getClass('subtitle')}`}>
            {t('profile.setupSubtitle')}
          </p>
        </div>

        {/* Form Container */}
        <div className="glass-container rounded-2xl p-8 max-w-2xl mx-auto max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
              <p className={`text-red-400 text-center ${getClass('body')}`}>{error}</p>
            </div>
          )}

          <ProfileForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Info Section */}
        <div className="mt-8 text-center max-w-2xl mx-auto">
          <div className="glass-container rounded-xl p-6">
            <h3 className={`text-lg ${getClass('header')} text-white mb-3`}>
              {t('profile.whyProfileNeeded')}
            </h3>
            <ul className={`text-white/80 text-sm space-y-2 text-left max-w-md mx-auto ${getClass('body')}`}>
              <li className="flex items-start space-x-2">
                <span className="text-[#FCB283] mt-1">•</span>
                <span>{t('profile.reason1')}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-[#FCB283] mt-1">•</span>
                <span>{t('profile.reason2')}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-[#FCB283] mt-1">•</span>
                <span>{t('profile.reason3')}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
