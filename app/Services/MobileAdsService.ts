import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';

let initializePromise: Promise<void> | null = null;
let initialized = false;

export const ensureMobileAdsInitialized = async () => {
  if (!initializePromise) {
    initializePromise = mobileAds()
      .setRequestConfiguration({
        maxAdContentRating: MaxAdContentRating.PG,
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
      })
      .then(() => mobileAds().initialize())
      .then(() => {
        initialized = true;
      })
      .catch((error) => {
        initializePromise = null;
        initialized = false;
        throw error;
      });
  }

  return initializePromise;
};

export const hasMobileAdsInitialized = () => initialized;
