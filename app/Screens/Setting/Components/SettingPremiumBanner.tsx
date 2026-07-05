import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '@Constants/Theme';
import useThemeColors from '@Hooks/useThemeMode';
import React, { FC, memo } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

const purchaseBanner = require('../../../../assets/Images/purchase_banner.png');

interface SettingPremiumBannerProps {
  isPremium: boolean;
  onPress: () => void;
}

const SettingPremiumBanner: FC<SettingPremiumBannerProps> = ({ isPremium, onPress }) => {
  const colors = useThemeColors();
  const style = styles();

  return (
    <Pressable onPress={onPress} style={style.shell}>
      <ImageBackground
        source={purchaseBanner}
        resizeMode="cover"
        blurRadius={8}
        imageStyle={style.bannerImage}
        style={style.banner}
      >
        <View style={style.tint} />
        {isPremium ? (
          <View style={style.thankYouLayout}>
            <View style={style.thankYouTop}>
              <View style={style.thankYouIcon}>
                <Ionicons name="sparkles" size={22} color={colors.white} />
              </View>
              <View style={style.purchasedLayout}>
                <Text style={style.heading}>Thank You!</Text>
                <Text style={style.body}>You're now ad-free. Enjoy the best experience.</Text>
              </View>
              <View style={style.activePill}>
                <Ionicons name="checkmark-circle" size={14} color={colors.white} />
                <Text style={style.activePillText}>Active</Text>
              </View>
            </View>
            <View style={style.thankYouMetaRow}>
              <View style={style.thankYouMetaItem}>
                <Ionicons name="ban-outline" size={15} color={colors.white} />
                <Text style={style.thankYouMetaText}>Ads removed</Text>
              </View>
              <View style={style.thankYouMetaItem}>
                <Ionicons name="infinite-outline" size={16} color={colors.white} />
                <Text style={style.thankYouMetaText}>Lifetime</Text>
              </View>
              <View style={style.thankYouMetaItem}>
                <Ionicons name="refresh-circle-outline" size={16} color={colors.white} />
                <Text style={style.thankYouMetaText}>Restorable</Text>
              </View>
            </View>
          </View>
        ) : (
          <>
            <View style={style.upgradeTop}>
              <Text style={style.heading}>Go Ad-Free</Text>
              <View style={style.upgradeButton}>
                <Text style={style.upgradeButtonText}>Upgrade</Text>
                <Ionicons name="chevron-forward" size={15} color={colors.white} />
              </View>
            </View>
            <Text style={style.body}>
              Enjoy a clean, distraction-free experience across DailySync.
            </Text>
            <View style={style.metaRow}>
              <View style={style.metaItem}>
                <Ionicons name="ban-outline" size={16} color={colors.white} />
                <Text style={style.metaText}>No Ads</Text>
              </View>
              <View style={style.metaItem}>
                <Ionicons name="shield-checkmark-outline" size={16} color={colors.white} />
                <Text style={style.metaText}>Restorable</Text>
              </View>
              <View style={style.metaItem}>
                <Ionicons name="flash" size={16} color={colors.white} />
                <Text style={style.metaText}>One-time</Text>
              </View>
            </View>
          </>
        )}
      </ImageBackground>
    </Pressable>
  );
};

const styles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    shell: {
      overflow: 'hidden',
      minHeight: 122,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: 'rgba(64, 93, 240, 0.55)',
      backgroundColor: colors.previewBackground,
    },
    banner: {
      flex: 1,
      minHeight: 122,
      paddingVertical: 14,
      paddingHorizontal: 15,
      justifyContent: 'space-between',
    },
    bannerImage: {
      borderRadius: 18,
    },
    tint: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.34)',
    },
    upgradeTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    heading: {
      flex: 1,
      color: colors.white,
      fontSize: 20,
      lineHeight: 24,
      fontFamily: FONTS.Bold,
    },
    body: {
      color: 'rgba(255, 255, 255, 0.76)',
      fontSize: 12.5,
      lineHeight: 17,
      fontFamily: FONTS.Medium,
      marginTop: 4,
      paddingRight: 70,
    },
    upgradeButton: {
      minHeight: 30,
      borderRadius: 11,
      paddingHorizontal: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
    },
    upgradeButtonText: {
      color: colors.white,
      fontSize: 11.5,
      fontFamily: FONTS.Bold,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginTop: 13,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metaText: {
      color: 'rgba(255, 255, 255, 0.78)',
      fontSize: 11.5,
      fontFamily: FONTS.Medium,
    },
    thankYouLayout: {
      flex: 1,
      justifyContent: 'flex-start',
      gap: 12,
    },
    thankYouTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
    },
    thankYouIcon: {
      width: 48,
      height: 48,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(64, 93, 240, 0.7)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.16)',
    },
    purchasedLayout: {
      flex: 1,
      justifyContent: 'center',
    },
    activePill: {
      alignSelf: 'flex-start',
      minHeight: 27,
      borderRadius: 15,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(64, 93, 240, 0.36)',
    },
    activePillText: {
      color: '#7FA0FF',
      fontSize: 13,
      fontFamily: FONTS.Bold,
    },
    thankYouMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    thankYouMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    thankYouMetaText: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: 11.5,
      fontFamily: FONTS.Medium,
    },
  });
};

export default memo(SettingPremiumBanner);
