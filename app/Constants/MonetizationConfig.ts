import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

export const USE_TEST_ADS = false;

export const REMOVE_ADS_PRODUCT_ID = 'com.dailysync.remove_ads_lifetime';
export const PREMIUM_PRODUCT_IDS = [REMOVE_ADS_PRODUCT_ID];

export const ADMOB_APP_IDS = {
  android: 'ca-app-pub-9745099446260761~7380225743',
  ios: 'ca-app-pub-9745099446260761~7380225743',
};

const PRODUCTION_INTERSTITIAL_UNIT_IDS = {
  android: 'ca-app-pub-9745099446260761/8862873970',
  ios: 'ca-app-pub-9745099446260761/8862873970',
};

const PRODUCTION_INLINE_AD_UNIT_IDS = {
  android: 'ca-app-pub-9745099446260761/8862873970',
  ios: 'ca-app-pub-9745099446260761/8862873970',
};

export const AD_PLACEMENTS = {
  interstitialBeforeSchedule: true,
  inlineListAd: true,
  inlineListAdAfterItemCount: 1,
  delayedAppOpenInterstitial: true,
  delayedAppOpenInitialDelayMs: 45000,
  delayedAppOpenResumeDelayMs: 20000,
  delayedAppOpenCooldownMs: 180000,
  delayedAppOpenChance: 0.45,
  delayedAppOpenMaxPerSession: 2,
};

export const getInterstitialAdUnitId = () => {
  if (USE_TEST_ADS || __DEV__) {
    return TestIds.INTERSTITIAL;
  }

  const adUnitId =
    Platform.OS === 'ios'
      ? PRODUCTION_INTERSTITIAL_UNIT_IDS.ios
      : PRODUCTION_INTERSTITIAL_UNIT_IDS.android;

  return adUnitId || TestIds.INTERSTITIAL;
};

export const getInlineAdUnitId = () => {
  if (USE_TEST_ADS || __DEV__) {
    return TestIds.BANNER;
  }

  const adUnitId =
    Platform.OS === 'ios'
      ? PRODUCTION_INLINE_AD_UNIT_IDS.ios
      : PRODUCTION_INLINE_AD_UNIT_IDS.android;

  return adUnitId || TestIds.BANNER;
};

export const hasStoreProductsConfigured = () => {
  return PREMIUM_PRODUCT_IDS.some((productId) => productId.trim().length > 0);
};
