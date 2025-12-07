import React, { createContext, useContext, useState, useEffect } from 'react';
import SettingsService from '../services/SettingsService';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    shopName: 'HaruShop',
    logo: '',
    phone: '',
    email: '',
    address: '',
    description: '',
    bannerImages: [],
    socialMedia: {
      facebook: '',
      instagram: '',
      youtube: '',
      tiktok: ''
    },
    businessHours: {
      monday: { open: '08:00', close: '22:00', isOpen: true },
      tuesday: { open: '08:00', close: '22:00', isOpen: true },
      wednesday: { open: '08:00', close: '22:00', isOpen: true },
      thursday: { open: '08:00', close: '22:00', isOpen: true },
      friday: { open: '08:00', close: '22:00', isOpen: true },
      saturday: { open: '08:00', close: '22:00', isOpen: true },
      sunday: { open: '08:00', close: '22:00', isOpen: true }
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const settingsService = new SettingsService();

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await settingsService.getPublicSettings();
      if (data) {
        setSettings(data);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshSettings = () => {
    loadSettings();
  };

  // Get image URL
  const getImageUrl = (filename) => {
    return settingsService.getImageUrl(filename);
  };

  // Get logo URL
  const getLogoUrl = () => {
    return settings.logo ? settingsService.getLogoUrl(settings.logo) : null;
  };

  // Get banner URLs
  const getBannerUrls = () => {
    return settings.bannerImages ? settingsService.getBannerUrls(settings.bannerImages) : [];
  };

  // Get formatted business hours
  const getFormattedBusinessHours = () => {
    const days = {
      monday: 'Thứ 2',
      tuesday: 'Thứ 3',
      wednesday: 'Thứ 4',
      thursday: 'Thứ 5',
      friday: 'Thứ 6',
      saturday: 'Thứ 7',
      sunday: 'Chủ nhật'
    };

    return Object.keys(settings.businessHours).map(day => ({
      day: days[day],
      isOpen: settings.businessHours[day].isOpen,
      hours: settings.businessHours[day].isOpen 
        ? `${settings.businessHours[day].open} - ${settings.businessHours[day].close}`
        : 'Đóng cửa'
    }));
  };

  // Get current day business hours
  const getCurrentDayHours = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' });
    return settings.businessHours[today] || { isOpen: false, open: '08:00', close: '22:00' };
  };

  // Check if shop is currently open
  const isShopOpen = () => {
    const currentDay = getCurrentDayHours();
    if (!currentDay.isOpen) return false;

    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    return currentTime >= currentDay.open && currentTime <= currentDay.close;
  };

  const value = {
    settings,
    loading,
    error,
    refreshSettings,
    getImageUrl,
    getLogoUrl,
    getBannerUrls,
    getFormattedBusinessHours,
    getCurrentDayHours,
    isShopOpen
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;


