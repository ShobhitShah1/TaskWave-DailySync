import { AD_PLACEMENTS } from '@Constants/MonetizationConfig';
import { useMonetization } from '@Hooks/useMonetization';
import { showInterstitialAd } from '@Services/InterstitialAdService';
import { useCallback, useState } from 'react';

export const useInterstitialAd = () => {
  const { adsEnabled } = useMonetization();
  const [isInterstitialLoading, setIsInterstitialLoading] = useState(false);

  const showAd = useCallback(
    async (options?: { ignoreSchedulePlacement?: boolean }) => {
      if (
        !adsEnabled ||
        (!options?.ignoreSchedulePlacement && !AD_PLACEMENTS.interstitialBeforeSchedule)
      ) {
        return false;
      }

      setIsInterstitialLoading(true);

      try {
        return await showInterstitialAd();
      } finally {
        setIsInterstitialLoading(false);
      }
    },
    [adsEnabled],
  );

  return { isInterstitialLoading, showAd };
};
