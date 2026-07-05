import { FONTS, SIZE } from '@Constants/Theme';
import { useMonetization } from '@Hooks/useMonetization';
import useThemeColors from '@Hooks/useThemeMode';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { SafeAreaView } from 'react-native-safe-area-context';

const purchaseCrown = require('../../../assets/Icons/purchase_crown.png');

const SubscriptionScreen = () => {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const { isConfigured, isLoading, isPremium, products, purchaseProduct, restorePurchases } =
    useMonetization();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const style = styles();
  const activeProduct = products[0] || null;
  const purchaseLabel = isPremium
    ? 'Ads removed'
    : activeProduct?.displayPrice
      ? `Remove ads - ${activeProduct.displayPrice}`
      : 'Remove ads';

  const features = useMemo(
    () => [
      {
        icon: 'bell-off-outline' as const,
        title: 'Ad-Free Experience',
        text: 'No fullscreen or inline ads before alarms and reminders.',
      },
      {
        icon: 'credit-card-outline' as const,
        title: 'One-Time Purchase',
        text: 'Pay once and keep DailySync clean forever.',
      },
      {
        icon: 'link-variant' as const,
        title: 'Device and Account Access',
        text: 'Works on this device and links when you sign in.',
      },
      {
        icon: 'restore' as const,
        title: 'Restore Anytime',
        text: 'Restore your remove-ads purchase whenever needed.',
      },
    ],
    [],
  );

  const handlePurchase = async () => {
    if (!activeProduct) {
      showMessage({ message: 'No purchase product is configured yet.', type: 'warning' });
      return;
    }

    try {
      setIsSubmitting(true);
      await purchaseProduct(activeProduct);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Purchase failed.';
      if (!/cancel/i.test(message)) {
        showMessage({ message, type: 'danger' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async () => {
    try {
      setIsSubmitting(true);
      await restorePurchases();
      showMessage({ message: 'Purchases restored.', type: 'success' });
    } catch (error) {
      showMessage({
        message: error instanceof Error ? error.message : 'Restore failed.',
        type: 'danger',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProductCard = () => {
    if (isLoading) {
      return (
        <View style={style.productCard}>
          <ActivityIndicator color={colors.darkBlue} />
        </View>
      );
    }

    if (isPremium) {
      return (
        <View style={style.productCard}>
          <Text style={style.productTitle}>Remove Ads Active</Text>
          <Text style={style.productDescription}>
            Your one-time purchase is active. Ads are removed across DailySync.
          </Text>
          <View style={style.activeState}>
            <Ionicons name="checkmark-circle" size={28} color={colors.darkBlue} />
            <Text style={style.activeStateText}>Ad-free access is enabled</Text>
          </View>
        </View>
      );
    }

    if (!isConfigured || !products.length || !activeProduct) {
      return (
        <View style={style.productCard}>
          <Text style={style.productTitle}>No product found</Text>
          <Text style={style.productDescription}>No purchase option is available right now.</Text>
        </View>
      );
    }

    return (
      <View style={style.productCard}>
        <Text style={style.productTitle}>Lifetime Remove Ads</Text>
        <View style={style.priceRow}>
          <Text style={style.priceText}>{activeProduct.displayPrice}</Text>
          <Text style={style.priceNote}>one-time</Text>
        </View>
        <Text style={style.productDescription}>
          One-time payment. Remove ads from alarms, reminders, scheduling, and list screens.
        </Text>

        <Pressable
          disabled={isSubmitting}
          onPress={handlePurchase}
          style={[style.primaryButton, isSubmitting && { backgroundColor: colors.lightContact }]}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Text style={style.primaryButtonText}>{purchaseLabel}</Text>
            </>
          )}
        </Pressable>

        <View style={style.purchaseMetaRow}>
          <View style={style.purchaseMetaItem}>
            <Ionicons name="card-outline" size={15} color={colors.grayTitle} />
            <Text style={style.purchaseMetaText}>One-time payment</Text>
          </View>
          <View style={style.purchaseMetaItem}>
            <MaterialCommunityIcons name="infinity" size={16} color={colors.grayTitle} />
            <Text style={style.purchaseMetaText}>Lifetime access</Text>
          </View>
          <View style={style.purchaseMetaItem}>
            <Ionicons name="refresh-circle-outline" size={16} color={colors.grayTitle} />
            <Text style={style.purchaseMetaText}>Restore anytime</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={style.container}>
      <View style={style.header}>
        <Pressable hitSlop={10} onPress={() => navigation.goBack()} style={style.backButton}>
          <Ionicons name="chevron-back" size={30} color={colors.text} />
        </Pressable>
        <Text style={style.headerTitle}>Go Ad-Free</Text>
      </View>

      <ScrollView contentContainerStyle={style.content} showsVerticalScrollIndicator={false}>
        <View style={style.hero}>
          <Image source={purchaseCrown} resizeMode="contain" style={style.crownImage} />
          <Text style={style.heroTitle}>Go Ad-Free. Forever.</Text>
          <Text style={style.heroSubtitle}>One-time payment. Lifetime remove ads access.</Text>
        </View>

        <View style={style.featurePanel}>
          {features.map((feature, index) => (
            <View
              key={feature.title}
              style={[style.featureRow, index === features.length - 1 && style.featureRowLast]}
            >
              <View style={style.featureIcon}>
                <MaterialCommunityIcons name={feature.icon} size={30} color={colors.white} />
              </View>
              <View style={style.featureCopy}>
                <Text style={style.featureTitle}>{feature.title}</Text>
                <Text style={style.featureText}>{feature.text}</Text>
              </View>
            </View>
          ))}
        </View>

        {renderProductCard()}

        <Pressable disabled={isSubmitting} onPress={handleRestore} style={style.restoreButton}>
          <Ionicons name="refresh-circle-outline" size={18} color={colors.darkBlue} />
          <Text style={style.restoreText}>Restore purchase</Text>
        </Pressable>

        <Text style={style.footerText}>
          Purchase removes ads only. Your reminders, alarms, and app data continue to work normally.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      width: SIZE.appContainWidth,
      minHeight: 54,
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    backButton: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      color: colors.text,
      fontSize: 24,
      fontFamily: FONTS.Bold,
    },
    content: {
      width: SIZE.appContainWidth,
      alignSelf: 'center',
      paddingTop: 16,
      paddingBottom: 24,
    },
    hero: {
      alignItems: 'center',
      marginBottom: 22,
    },
    crownImage: {
      width: 130,
      height: 130,
      marginBottom: 5,
    },
    heroTitle: {
      color: colors.text,
      fontSize: 26,
      lineHeight: 32,
      fontFamily: FONTS.Bold,
      textAlign: 'center',
    },
    heroSubtitle: {
      color: colors.grayTitle,
      fontSize: 16,
      lineHeight: 21,
      fontFamily: FONTS.Medium,
      textAlign: 'center',
    },
    featurePanel: {
      borderWidth: 1,
      borderColor: 'rgba(139, 142, 142, 0.22)',
      borderRadius: 18,
      paddingHorizontal: 16,
      backgroundColor: colors.previewBackground,
      marginBottom: 22,
    },
    featureRow: {
      minHeight: 90,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(139, 142, 142, 0.18)',
    },
    featureRowLast: {
      borderBottomWidth: 0,
    },
    featureIcon: {
      width: 58,
      height: 58,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.darkBlue,
    },
    featureCopy: {
      flex: 1,
      gap: 4,
    },
    featureTitle: {
      color: colors.text,
      fontSize: 16,
      lineHeight: 20,
      fontFamily: FONTS.SemiBold,
    },
    featureText: {
      color: colors.grayTitle,
      fontSize: 14,
      lineHeight: 19,
      fontFamily: FONTS.Medium,
    },
    productCard: {
      borderWidth: 1,
      borderColor: 'rgba(139, 142, 142, 0.24)',
      borderRadius: 18,
      padding: 18,
      backgroundColor: colors.previewBackground,
      marginBottom: 14,
    },
    productTitle: {
      color: colors.text,
      fontSize: 20,
      lineHeight: 25,
      fontFamily: FONTS.Bold,
      marginBottom: 8,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
      marginBottom: 8,
    },
    priceText: {
      color: colors.darkBlue,
      fontSize: 38,
      lineHeight: 44,
      fontFamily: FONTS.Bold,
    },
    priceNote: {
      color: colors.grayTitle,
      fontSize: 14,
      fontFamily: FONTS.Medium,
      marginBottom: 7,
    },
    productDescription: {
      color: colors.grayTitle,
      fontSize: 15,
      lineHeight: 21,
      fontFamily: FONTS.Medium,
      marginBottom: 18,
    },
    primaryButton: {
      minHeight: 58,
      borderRadius: 13,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: colors.darkBlue,
      marginBottom: 16,
    },
    primaryButtonText: {
      color: colors.white,
      fontSize: 17,
      fontFamily: FONTS.Bold,
      textAlign: 'center',
    },
    purchaseMetaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
      borderTopWidth: 1,
      borderTopColor: 'rgba(139, 142, 142, 0.18)',
      paddingTop: 14,
    },
    purchaseMetaItem: {
      flex: 1,
      alignItems: 'center',
      gap: 5,
    },
    purchaseMetaText: {
      color: colors.grayTitle,
      fontSize: 11.5,
      lineHeight: 15,
      fontFamily: FONTS.Medium,
      textAlign: 'center',
    },
    activeState: {
      minHeight: 56,
      borderRadius: 13,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      backgroundColor: 'rgba(64, 93, 240, 0.14)',
    },
    activeStateText: {
      color: colors.text,
      fontSize: 15,
      fontFamily: FONTS.SemiBold,
    },
    restoreButton: {
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    restoreText: {
      color: colors.darkBlue,
      fontSize: 15,
      fontFamily: FONTS.SemiBold,
    },
    footerText: {
      color: colors.grayTitle,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: FONTS.Medium,
      textAlign: 'center',
      marginTop: 6,
      paddingHorizontal: 18,
    },
  });
};

export default SubscriptionScreen;
