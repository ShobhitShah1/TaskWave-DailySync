import { AD_PLACEMENTS } from '@Constants/MonetizationConfig';
import { useInterstitialAd } from '@Hooks/useInterstitialAd';
import React, { memo, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

const DelayedInterstitialAd = () => {
  const { showAd } = useInterstitialAd();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastShownAtRef = useRef(0);
  const shownCountRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!AD_PLACEMENTS.delayedAppOpenInterstitial) {
      return undefined;
    }

    const clearScheduledAd = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const scheduleAd = (delayMs: number) => {
      clearScheduledAd();

      timeoutRef.current = setTimeout(async () => {
        const now = Date.now();

        if (
          appStateRef.current !== 'active' ||
          shownCountRef.current >= AD_PLACEMENTS.delayedAppOpenMaxPerSession ||
          now - lastShownAtRef.current < AD_PLACEMENTS.delayedAppOpenCooldownMs ||
          Math.random() > AD_PLACEMENTS.delayedAppOpenChance
        ) {
          return;
        }

        const shown = await showAd({ ignoreSchedulePlacement: true });
        if (shown) {
          lastShownAtRef.current = Date.now();
          shownCountRef.current += 1;
        }
      }, delayMs);
    };

    scheduleAd(AD_PLACEMENTS.delayedAppOpenInitialDelayMs);

    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasBackground =
        appStateRef.current === 'background' || appStateRef.current === 'inactive';
      appStateRef.current = nextState;

      if (wasBackground && nextState === 'active') {
        scheduleAd(AD_PLACEMENTS.delayedAppOpenResumeDelayMs);
      }
    });

    return () => {
      clearScheduledAd();
      subscription.remove();
    };
  }, [showAd]);

  return null;
};

export default memo(DelayedInterstitialAd);
