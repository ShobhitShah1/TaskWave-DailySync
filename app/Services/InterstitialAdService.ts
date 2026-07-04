import { getInterstitialAdUnitId } from '@Constants/MonetizationConfig';
import { AdEventType, InterstitialAd } from 'react-native-google-mobile-ads';
import { ensureMobileAdsInitialized } from './MobileAdsService';

const AD_LOAD_TIMEOUT_MS = 4500;

let activeInterstitialPromise: Promise<boolean> | null = null;

export const showInterstitialAd = async () => {
  if (activeInterstitialPromise) {
    return activeInterstitialPromise;
  }

  activeInterstitialPromise = loadAndShowInterstitialAd().finally(() => {
    activeInterstitialPromise = null;
  });

  return activeInterstitialPromise;
};

const loadAndShowInterstitialAd = async () => {
  try {
    await ensureMobileAdsInitialized();

    const interstitial = InterstitialAd.createForAdRequest(getInterstitialAdUnitId(), {
      requestNonPersonalizedAdsOnly: true,
    });

    return await new Promise<boolean>((resolve) => {
      let settled = false;
      const cleanupCallbacks: Array<() => void> = [];

      const finish = (shown: boolean) => {
        if (settled) {
          return;
        }

        settled = true;
        cleanupCallbacks.forEach((cleanup) => cleanup());
        resolve(shown);
      };

      cleanupCallbacks.push(
        interstitial.addAdEventListener(AdEventType.LOADED, () => {
          interstitial.show().catch(() => finish(false));
        }),
      );

      cleanupCallbacks.push(
        interstitial.addAdEventListener(AdEventType.CLOSED, () => finish(true)),
      );

      cleanupCallbacks.push(
        interstitial.addAdEventListener(AdEventType.ERROR, () => finish(false)),
      );

      const timeout = setTimeout(() => finish(false), AD_LOAD_TIMEOUT_MS);
      cleanupCallbacks.push(() => clearTimeout(timeout));

      interstitial.load();
    });
  } catch {
    return false;
  }
};
