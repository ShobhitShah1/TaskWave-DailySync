import {
  getProductSKUs,
  isPremiumProductId,
  PurchaseRecord,
  useIapStore,
} from '@Services/IapService';
import { ensureMobileAdsInitialized } from '@Services/MobileAdsService';
import { purchaseApi } from '@Services/PurchaseService';
import { useAuth } from '@Hooks/useAuth';
import { getOrCreateDeviceId } from '@Utils/deviceIdentity';
import {
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  Product,
  purchaseErrorListener,
  Purchase,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases as restoreStorePurchases,
} from 'expo-iap';
import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  platform: Platform.OS as 'ios' | 'android' | 'web',
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
  const [connected, setConnected] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [availablePurchases, setAvailablePurchases] = useState<Purchase[]>([]);
  const productSKUs = useMemo(getProductSKUs, []);
  const isConfigured = productSKUs.length > 0;
  const purchasedProductIds = useIapStore((state) => state.purchasedProductIds);
  const purchases = useIapStore((state) => state.purchases);
  const addPurchase = useIapStore((state) => state.addPurchase);
  const linkPurchasesToAccount = useIapStore((state) => state.linkPurchasesToAccount);
  const syncedPurchaseKeysRef = useRef<Set<string>>(new Set());

  const getPurchaseKey = useCallback((purchase: PurchaseRecord) => {
    return `${purchase.productId}:${purchase.transactionId}`;
  }, []);

  const identity = useMemo(
    () => ({
      accountEmail: auth?.user.provider === 'google' ? auth.user.email : null,
      accountId: auth?.user.provider === 'google' ? auth.user.id : null,
      deviceId: deviceId || '',
      provider: auth?.user.provider ?? 'guest',
    }),
    [auth?.user.email, auth?.user.id, auth?.user.provider, deviceId],
  );

  const handlePurchaseSuccess = useCallback(
    async (purchase: Purchase) => {
      const currentDeviceId = deviceId || (await getOrCreateDeviceId());
      const currentIdentity = { ...identity, deviceId: currentDeviceId };

      if (isPremiumProductId(purchase.productId)) {
        const purchaseRecord = getPurchaseRecord(purchase, currentIdentity);
        addPurchase(purchaseRecord);
        purchaseApi
          .syncPurchase(purchaseRecord)
          .then(() => syncedPurchaseKeysRef.current.add(getPurchaseKey(purchaseRecord)))
          .catch(() => undefined);
      }

      await finishTransaction({ purchase, isConsumable: false });
    },
    [addPurchase, deviceId, getPurchaseKey, identity],
  );

  const ensureIapConnection = useCallback(async () => {
    if (Platform.OS === 'web') {
      return false;
    }

    if (connected) {
      return true;
    }

    try {
      const isConnected = await initConnection();
      setConnected(isConnected);
      return isConnected;
    } catch {
      setConnected(false);
      return false;
    }
  }, [connected]);

  useEffect(() => {
    ensureMobileAdsInitialized().catch(() => undefined);

    getOrCreateDeviceId()
      .then(setDeviceId)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const purchaseSubscription = purchaseUpdatedListener((purchase) => {
      handlePurchaseSuccess(purchase).catch(() => undefined);
    });

    const errorSubscription = purchaseErrorListener(() => undefined);

    return () => {
      purchaseSubscription.remove();
      errorSubscription.remove();
      endConnection()
        .then(() => setConnected(false))
        .catch(() => undefined);
    };
  }, [handlePurchaseSuccess]);

  useEffect(() => {
    if (!deviceId) {
      return;
    }

    linkPurchasesToAccount(identity);
  }, [deviceId, identity, linkPurchasesToAccount]);

  useEffect(() => {
    if (!auth?.accessToken || !deviceId) {
      return;
    }

    let isMounted = true;

    const syncBackendPurchases = async () => {
      try {
        const backendPurchases = await purchaseApi.getPurchases();

        if (!isMounted) {
          return;
        }

        backendPurchases.forEach((purchase) => {
          syncedPurchaseKeysRef.current.add(getPurchaseKey(purchase));
          if (isPremiumProductId(purchase.productId)) {
            addPurchase(purchase);
          }
        });
      } catch {}

      const currentPurchases = useIapStore.getState().purchases;
      await Promise.allSettled(
        currentPurchases
          .filter((purchase) => isPremiumProductId(purchase.productId))
          .filter((purchase) => !syncedPurchaseKeysRef.current.has(getPurchaseKey(purchase)))
          .map(async (purchase) => {
            await purchaseApi.syncPurchase(purchase);
            syncedPurchaseKeysRef.current.add(getPurchaseKey(purchase));
          }),
      );
    };

    syncBackendPurchases();

    return () => {
      isMounted = false;
    };
  }, [addPurchase, auth?.accessToken, deviceId, getPurchaseKey, purchases.length]);

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadStoreData = async () => {
      setIsLoading(true);

      try {
        const isConnected = await ensureIapConnection();
        if (!isConnected) {
          return;
        }

        const [storeProducts, storePurchases] = await Promise.all([
          fetchProducts({ skus: productSKUs, type: 'in-app' }),
          getAvailablePurchases({ onlyIncludeActiveItemsIOS: true }),
        ]);

        if (!isMounted) {
          return;
        }

        setProducts(
          (storeProducts || []).filter(
            (product): product is Product =>
              product.type === 'in-app' && isPremiumProductId(product.id),
          ),
        );
        setAvailablePurchases(storePurchases || []);
      } catch {
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadStoreData();

    return () => {
      isMounted = false;
    };
  }, [ensureIapConnection, isConfigured, productSKUs]);

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
      const isConnected = await ensureIapConnection();
      if (!isConnected) {
        throw new Error('Store is not available right now.');
      }

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
    [deviceId, ensureIapConnection, identity.accountId],
  );

  const refreshPurchases = useCallback(async () => {
    const isConnected = await ensureIapConnection();
    if (!isConnected) {
      return;
    }

    const storePurchases = await getAvailablePurchases({ onlyIncludeActiveItemsIOS: true });
    setAvailablePurchases(storePurchases || []);
  }, [ensureIapConnection]);

  const restorePurchases = useCallback(async () => {
    const isConnected = await ensureIapConnection();
    if (!isConnected) {
      return;
    }

    await restoreStorePurchases();
    await refreshPurchases();
  }, [ensureIapConnection, refreshPurchases]);

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
