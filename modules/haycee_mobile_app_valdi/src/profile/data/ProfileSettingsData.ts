export type SettingsDestinationKind = 'personal-info' | 'security' | 'notifications' | 'language' | 'appearance' | 'privacy';
export type SettingsLanguage = 'fr' | 'en' | 'es' | 'pt';
export type SettingsAppearance = 'light' | 'dark';

export interface ProfileSettingsValues {
  displayName: string;
  email: string;
  phone: string;
  biometricEnabled: boolean;
  twoFactorEnabled: boolean;
  notificationPush: boolean;
  notificationOrders: boolean;
  notificationLives: boolean;
  notificationMessages: boolean;
  notificationPromotions: boolean;
  notificationEmail: boolean;
  notificationSms: boolean;
  language: SettingsLanguage;
  appearance: SettingsAppearance;
}

export const DEFAULT_PROFILE_SETTINGS: ProfileSettingsValues = {
  displayName: '',
  email: '',
  phone: '',
  biometricEnabled: false,
  twoFactorEnabled: false,
  notificationPush: true,
  notificationOrders: true,
  notificationLives: true,
  notificationMessages: true,
  notificationPromotions: false,
  notificationEmail: false,
  notificationSms: false,
  language: 'fr',
  appearance: 'light',
};
