import { AD_PLACEMENTS, getInlineAdUnitId } from '@Constants/MonetizationConfig';
import { useMonetization } from '@Hooks/useMonetization';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

const InlineListAd = () => {
  const { adsEnabled } = useMonetization();

  if (!adsEnabled || !AD_PLACEMENTS.inlineListAd) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={getInlineAdUnitId()}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 56,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default memo(InlineListAd);
