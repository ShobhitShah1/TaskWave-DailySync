import {
  getProductSKUs,
  isPremiumProductId,
  PurchaseRecord,
  useIapStore,
} from '@Services/IapService';
import { ensureMobileAdsInitialized } from '@Services/MobileAdsService';
import { useAuth } from '@Hooks/useAuth';
import { getOrCreateDeviceId } from '@Utils/deviceIdentity';
import { Product, Purchase, useIAP } from 'expo-iap';
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

interface MonetizationContextValue {
  adsEnabled: boolean;
  isConfigured: boolean;
  isLoading: boolean;
  isPremium: boolean;
  products: Product[];
  purchaseProduct: (product: Product) => Promise<void>;
  restorePurchases: () => Promise<void>;
  refreshPurchases: () => Promise<void>;
}

const MonetizationContext = createContext<MonetizationContextValue | undefined>(undefined);

const getTransactionId = (purchase: Purchase) => {
  return (
    purchase.id || purchase.purchaseToken || `${purchase.productId}:${purchase.transactionDate}`
  );
};

const getPurchaseRecord = (
  purchase: Purchase,
  identity: {
    accountEmail?: string | null;
    accountId?: string | null;
    deviceId: string;
    provider?: string | null;
  },
): PurchaseRecord => ({
  accountEmail: identity.accountEmail ?? null,
  accountId: identity.accountId ?? null,
  deviceId: identity.deviceId,
  productId: purchase.productId,
  provider: identity.provider ?? null,
  purchaseTime: purchase.transactionDate || Date.now(),
  purchaseToken: purchase.purchaseToken ?? null,
  transactionId: getTransactionId(purchase),
});

export const MonetizationProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { auth } = useAuth();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const productSKUs = useMemo(getProductSKUs, []);
  const isConfigured = productSKUs.length > 0;
  const purchasedProductIds = useIapStore((state) => state.purchasedProductIds);
  const addPurchase = useIapStore((state) => state.addPurchase);
  const linkPurchasesToAccount = useIapStore((state) => state.linkPurchasesToAccount);

  const identity = useMemo(
    () => ({
      accountEmail: auth?.user.provider === 'google' ? auth.user.email : null,
      accountId: auth?.user.provider === 'google' ? auth.user.id : null,
      deviceId: deviceId || '',
      provider: auth?.user.provider ?? 'guest',
    }),
    [auth?.user.email, auth?.user.id, auth?.user.provider, deviceId],
  );

  const {
    connected,
    products,
    availablePurchases,
    fetchProducts,
    finishTransaction,
    getAvailablePurchases,
    requestPurchase,
    restorePurchases: restoreStorePurchases,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      const currentDeviceId = deviceId || (await getOrCreateDeviceId());
      const currentIdentity = { ...identity, deviceId: currentDeviceId };

      if (isPremiumProductId(purchase.productId)) {
        addPurchase(getPurchaseRecord(purchase, currentIdentity));
      }

      await finishTransaction({ purchase, isConsumable: false });
    },
  });

  useEffect(() => {
    ensureMobileAdsInitialized().catch(() => undefined);

    getOrCreateDeviceId()
      .then(setDeviceId)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!deviceId) {
      return;
    }

    linkPurchasesToAccount(identity);
  }, [deviceId, identity, linkPurchasesToAccount]);

  useEffect(() => {
    if (!connected || !isConfigured) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    Promise.all([
      fetchProducts({ skus: productSKUs, type: 'in-app' }),
      getAvailablePurchases({ onlyIncludeActiveItemsIOS: true }),
    ])
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
  }, [connected, fetchProducts, getAvailablePurchases, isConfigured, productSKUs]);

  useEffect(() => {
    if (!deviceId) {
      return;
    }

    availablePurchases.forEach((purchase) => {
      if (isPremiumProductId(purchase.productId)) {
        addPurchase(getPurchaseRecord(purchase, identity));
      }
    });
  }, [addPurchase, availablePurchases, deviceId, identity]);

  const purchaseProduct = useCallback(
    async (product: Product) => {
      const currentDeviceId = deviceId || (await getOrCreateDeviceId());
      const requestIdentity = {
        accountId: identity.accountId ?? undefined,
        deviceId: currentDeviceId,
      };

      await requestPurchase({
        type: 'in-app',
        request: {
          apple: {
            appAccountToken: requestIdentity.accountId ?? requestIdentity.deviceId,
            sku: product.id,
          },
          google: {
            obfuscatedAccountId: requestIdentity.accountId ?? requestIdentity.deviceId,
            obfuscatedProfileId: requestIdentity.deviceId,
            skus: [product.id],
          },
        },
      });
    },
    [deviceId, identity.accountId, requestPurchase],
  );

  const refreshPurchases = useCallback(async () => {
    if (!connected) {
      return;
    }

    await getAvailablePurchases({ onlyIncludeActiveItemsIOS: true });
  }, [connected, getAvailablePurchases]);

  const restorePurchases = useCallback(async () => {
    if (!connected) {
      return;
    }

    await restoreStorePurchases({ onlyIncludeActiveItemsIOS: true });
    await refreshPurchases();
  }, [connected, refreshPurchases, restoreStorePurchases]);

  const hasLocalPremium = purchasedProductIds.some(isPremiumProductId);
  const isPremium = hasLocalPremium;

  const value = useMemo<MonetizationContextValue>(
    () => ({
      adsEnabled: Platform.OS !== 'web' && !isPremium,
      isConfigured,
      isLoading,
      isPremium,
      products: products.filter((product) => isPremiumProductId(product.id)),
      purchaseProduct,
      refreshPurchases,
      restorePurchases,
    }),
    [
      isConfigured,
      isLoading,
      isPremium,
      purchaseProduct,
      refreshPurchases,
      restorePurchases,
      products,
    ],
  );

  return <MonetizationContext.Provider value={value}>{children}</MonetizationContext.Provider>;
};

export { MonetizationContext };
