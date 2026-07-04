import { FONTS, SIZE } from '@Constants/Theme';
import { useMonetization } from '@Hooks/useMonetization';
import useThemeColors from '@Hooks/useThemeMode';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Product } from 'expo-iap';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { SafeAreaView } from 'react-native-safe-area-context';

const SubscriptionScreen = () => {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const { isConfigured, isLoading, isPremium, products, purchaseProduct, restorePurchases } =
    useMonetization();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const style = styles();
  const activeProduct = selectedProduct || products[0] || null;
  const benefits = useMemo(
    () => [
      'No fullscreen ads before alarms or reminders',
      'One-time purchase, no monthly plan',
      'Works on this device and links when you sign in',
    ],
    [],
  );

  const handlePurchase = async () => {
    if (!activeProduct) {
      showMessage({ message: 'No subscription product is configured yet.', type: 'warning' });
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

  return (
    <SafeAreaView style={style.container}>
      <ScrollView contentContainerStyle={style.content} showsVerticalScrollIndicator={false}>
        <View style={style.topRow}>
          <View style={style.headerCopy}>
            <Text style={style.headerTitle}>Remove ads</Text>
          </View>
          <Pressable hitSlop={10} onPress={() => navigation.goBack()} style={style.closeButton}>
            <Ionicons name="close" size={20} color={colors.text} />
          </Pressable>
        </View>

        <View style={style.heroCard}>
          <View style={style.badge}>
            <MaterialCommunityIcons name="crown" size={30} color={colors.white} />
          </View>
          <Text style={style.title}>Remove ads from DailySync</Text>
          <Text style={style.subtitle}>
            Keep the app clean when you schedule alarms, reminders, and other actions.
          </Text>
        </View>

        <View style={style.body}>
          <View style={style.benefitList}>
            {benefits.map((benefit) => (
              <View key={benefit} style={style.benefitRow}>
                <View style={style.checkIcon}>
                  <Ionicons name="checkmark" size={15} color={colors.white} />
                </View>
                <Text style={style.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          {isLoading ? (
            <View style={style.statusBox}>
              <ActivityIndicator color={colors.darkBlue} />
            </View>
          ) : isPremium ? (
            <View style={style.statusBox}>
              <Ionicons name="shield-checkmark" size={26} color={colors.darkBlue} />
              <Text style={style.statusTitle}>Ads removed</Text>
              <Text style={style.statusText}>This device already has the remove ads purchase.</Text>
            </View>
          ) : !isConfigured || !products.length ? (
            <View style={[style.statusBox, style.statusBoxCentered]}>
              <Ionicons name="bag-handle" size={26} color={colors.darkBlue} />
              <Text style={style.statusTitle}>No product found</Text>
              <Text style={style.statusText}>No purchase option is available right now.</Text>
            </View>
          ) : (
            <View style={style.packageList}>
              {products.map((product) => {
                const selected = activeProduct?.id === product.id;

                return (
                  <Pressable
                    key={product.id}
                    onPress={() => setSelectedProduct(product)}
                    style={[style.packageCard, selected && style.packageCardSelected]}
                  >
                    <View style={style.packageText}>
                      <Text style={style.packageTitle}>{product.title}</Text>
                      <Text style={style.packageSubtitle}>{product.description}</Text>
                    </View>
                    <View style={style.pricePill}>
                      <Text style={style.packagePrice}>{product.displayPrice}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View style={style.footer}>
          <Pressable
            disabled={isSubmitting || isPremium || !activeProduct}
            onPress={handlePurchase}
            style={[
              style.primaryButton,
              {
                backgroundColor:
                  isSubmitting || isPremium || !activeProduct
                    ? colors.lightContact
                    : colors.darkBlue,
              },
            ]}
          >
            <Text style={style.primaryButtonText}>
              {isPremium ? 'Ads removed' : activeProduct ? 'Remove ads' : 'Unavailable'}
            </Text>
          </Pressable>

          <Pressable disabled={isSubmitting} onPress={handleRestore} style={style.restoreButton}>
            <Text style={[style.restoreText, { color: colors.darkBlue }]}>Restore purchase</Text>
          </Pressable>
        </View>
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
    content: {
      width: SIZE.appContainWidth,
      alignSelf: 'center',
      flexGrow: 1,
      paddingTop: 16,
      paddingBottom: 0,
    },
    topRow: {
      minHeight: 40,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerCopy: {
      flex: 1,
      gap: 0,
      paddingRight: 12,
    },
    headerTitle: {
      color: colors.text,
      fontSize: 18,
      fontFamily: FONTS.SemiBold,
    },
    closeButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.previewBackground,
    },
    body: {
      gap: 22,
      marginVertical: 10,
    },
    heroCard: {
      gap: 14,
      alignItems: 'center',
      paddingVertical: 26,
      paddingHorizontal: 20,
      borderRadius: 20,
      backgroundColor: colors.darkBlue,
      marginVertical: 10,
    },
    badge: {
      width: 62,
      height: 62,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
    },
    title: {
      color: colors.white,
      fontSize: 25,
      fontFamily: FONTS.Bold,
      textAlign: 'center',
    },
    subtitle: {
      color: 'rgba(255, 255, 255, 0.78)',
      fontSize: 15,
      lineHeight: 18,
      fontFamily: FONTS.Medium,
      textAlign: 'center',
      paddingHorizontal: 2,
    },
    footer: {
      marginTop: 'auto',
      gap: 12,
      paddingTop: 20,
      paddingBottom: 12,
    },
    benefitList: {
      gap: 15,
      paddingVertical: 5,
    },
    benefitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 0,
    },
    checkIcon: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.darkBlue,
    },
    benefitText: {
      color: colors.text,
      fontSize: 15,
      fontFamily: FONTS.Medium,
    },
    statusBox: {
      minHeight: 96,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: colors.darkBlue,
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 18,
      backgroundColor: colors.previewBackground,
    },
    statusBoxCentered: {
      minHeight: 116,
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
    },
    statusTitle: {
      color: colors.text,
      fontFamily: FONTS.SemiBold,
      fontSize: 16,
    },
    statusText: {
      color: colors.grayTitle,
      fontFamily: FONTS.Medium,
      textAlign: 'center',
    },
    packageList: {
      gap: 16,
    },
    packageCard: {
      minHeight: 82,
      borderWidth: 1,
      borderColor: colors.borderColor,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      backgroundColor: colors.previewBackground,
    },
    packageCardSelected: {
      borderColor: colors.darkBlue,
      backgroundColor: colors.previewBackground,
    },
    packageText: {
      flex: 1,
      gap: 1,
    },
    packageTitle: {
      color: colors.text,
      fontSize: 16,
      fontFamily: FONTS.SemiBold,
    },
    packageSubtitle: {
      color: colors.grayTitle,
      fontSize: 13,
      fontFamily: FONTS.Medium,
    },
    packagePrice: {
      color: colors.white,
      fontSize: 14,
      fontFamily: FONTS.Bold,
    },
    pricePill: {
      minHeight: 36,
      paddingHorizontal: 12,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.darkBlue,
    },
    primaryButton: {
      height: 54,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonText: {
      color: colors.white,
      fontSize: 16,
      fontFamily: FONTS.Bold,
    },
    restoreButton: {
      alignItems: 'center',
      paddingVertical: 0,
    },
    restoreText: {
      fontSize: 15,
      fontFamily: FONTS.SemiBold,
    },
  });
};

export default SubscriptionScreen;
