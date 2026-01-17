import React, { useState, useEffect } from 'react';
import { useMultiAuth } from '@/contexts/MultiAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Save, 
  Loader2,
  Building2,
  Calendar,
  CheckCircle,
  XCircle,
  MapPin,
  Hash
} from 'lucide-react';
import { traderApi } from '@/lib/mediationApi';
import showToast from '@/lib/toast';

const TraderSettings = () => {
  const { getAuth } = useMultiAuth();
  const { t, language } = useLanguage();
  const { user } = getAuth('trader');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    country: '',
    city: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await traderApi.getTraderById(user.id);
      const trader = response.data.data || response.data;
      setProfileData({
        name: trader.name || '',
        email: trader.email || '',
        phone: trader.phone || '',
        companyName: trader.companyName || '',
        country: trader.country || '',
        city: trader.city || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      showToast.error(
        t('mediation.trader.loadProfileFailed') || 'Failed to load profile',
        error.response?.data?.message || 'Please try again'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    if (!profileData.name || !profileData.companyName) {
      showToast.error(
        t('mediation.trader.validationError') || 'Validation Error',
        t('mediation.trader.requiredFields') || 'Please fill in all required fields'
      );
      return;
    }

    try {
      setSaving(true);
      // Use auth updateProfile endpoint which supports traders
      const { authApi } = await import('@/lib/stockshipApi');
      await authApi.updateProfile({
        name: profileData.name,
        phone: profileData.phone,
        country: profileData.country,
        city: profileData.city
      });
      
      // Update company name using traderApi if available
      try {
        await traderApi.updateTrader(user.id, {
          companyName: profileData.companyName
        });
      } catch (err) {
        console.warn('Could not update company name:', err);
        // Continue even if company name update fails
      }
      
      showToast.success(
        t('mediation.trader.profileUpdated') || 'Profile Updated',
        t('mediation.trader.profileUpdatedSuccess') || 'Your profile has been updated successfully'
      );
      // Update user in context
      loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast.error(
        t('mediation.trader.updateFailed') || 'Failed to update profile',
        error.response?.data?.message || 'Please try again'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      showToast.error(
        t('mediation.trader.validationError') || 'Validation Error',
        t('mediation.trader.allPasswordFieldsRequired') || 'Please fill in all password fields'
      );
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast.error(
        t('mediation.trader.passwordMismatch') || 'Password Mismatch',
        t('mediation.trader.passwordMismatchDesc') || 'New password and confirm password do not match'
      );
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showToast.error(
        t('mediation.trader.passwordTooShort') || 'Password Too Short',
        t('mediation.trader.passwordTooShortDesc') || 'Password must be at least 6 characters'
      );
      return;
    }

    try {
      setSaving(true);
      // Use auth changePassword endpoint if available
      const { stockshipApi } = await import('@/lib/stockshipApi');
      try {
        await stockshipApi.put('/auth/change-password', {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        });
      } catch (err) {
        // If change-password endpoint doesn't exist, try using updateProfile with password
        if (err.response?.status === 404) {
          await stockshipApi.put('/auth/profile', {
            currentPassword: passwordData.currentPassword,
            password: passwordData.newPassword
          });
        } else {
          throw err;
        }
      }
      showToast.success(
        t('mediation.trader.passwordChanged') || 'Password Changed',
        t('mediation.trader.passwordChangedSuccess') || 'Your password has been changed successfully'
      );
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      showToast.error(
        t('mediation.trader.changePasswordFailed') || 'Failed to change password',
        error.response?.data?.message || 'Please check your current password and try again'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('mediation.trader.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: t('mediation.trader.profile') || 'Profile', icon: User },
    { id: 'password', label: t('mediation.trader.password') || 'Password', icon: Lock }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {t('common.settings') || 'Settings'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('mediation.trader.settingsDesc') || 'Manage your account settings and preferences'}
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600" />
              {t('mediation.trader.profileInformation') || 'Profile Information'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Trader Code (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.traders.traderCode') || 'Trader Code'}
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={user?.traderCode || 'N/A'}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('mediation.trader.traderCodeDesc') || 'Trader code cannot be changed'}
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.common.name') || 'Name'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
                    placeholder={t('mediation.trader.namePlaceholder') || 'Enter your name'}
                  />
                </div>
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.traders.companyName') || 'Company Name'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="companyName"
                    value={profileData.companyName}
                    onChange={handleProfileChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
                    placeholder={t('mediation.trader.companyNamePlaceholder') || 'Enter your company name'}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.common.email') || 'Email'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    required
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    placeholder={t('mediation.common.emailPlaceholder') || 'Enter your email'}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('mediation.trader.emailCannotBeChanged') || 'Email cannot be changed'}
                </p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.common.phone') || 'Phone'}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
                    placeholder={t('mediation.common.phonePlaceholder') || 'Enter your phone number'}
                  />
                </div>
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.common.country') || 'Country'}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="country"
                    value={profileData.country}
                    onChange={handleProfileChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
                    placeholder={t('mediation.common.countryPlaceholder') || 'Enter your country'}
                  />
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.common.city') || 'City'}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="city"
                    value={profileData.city}
                    onChange={handleProfileChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
                    placeholder={t('mediation.common.cityPlaceholder') || 'Enter your city'}
                  />
                </div>
              </div>

              {/* Created At (Read-only) */}
              {user?.createdAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('mediation.common.createdAt') || 'Member Since'}
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={new Date(user.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('mediation.trader.saving') || 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {t('common.save') || 'Save Changes'}
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-gray-600" />
              {t('mediation.trader.changePassword') || 'Change Password'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-6">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.trader.currentPassword') || 'Current Password'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
                    placeholder={t('mediation.trader.currentPasswordPlaceholder') || 'Enter your current password'}
                  />
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.trader.newPassword') || 'New Password'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
                    placeholder={t('mediation.trader.newPasswordPlaceholder') || 'Enter your new password (min 6 characters)'}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('mediation.trader.passwordMinLength') || 'Password must be at least 6 characters'}
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.trader.confirmPassword') || 'Confirm New Password'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
                    placeholder={t('mediation.trader.confirmPasswordPlaceholder') || 'Confirm your new password'}
                  />
                </div>
                {passwordData.newPassword && passwordData.confirmPassword && (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${
                    passwordData.newPassword === passwordData.confirmPassword ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {passwordData.newPassword === passwordData.confirmPassword ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        {t('mediation.trader.passwordsMatch') || 'Passwords match'}
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        {t('mediation.trader.passwordsDoNotMatch') || 'Passwords do not match'}
                      </>
                    )}
                  </p>
                )}
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={saving || passwordData.newPassword !== passwordData.confirmPassword}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('mediation.trader.changing') || 'Changing...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {t('mediation.trader.changePassword') || 'Change Password'}
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

export default TraderSettings;

