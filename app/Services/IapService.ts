import { PREMIUM_PRODUCT_IDS } from '@Constants/MonetizationConfig';
import { storage } from '@Contexts/ThemeProvider';
import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';

export interface PurchaseRecord {
  accountId?: string | null;
  accountEmail?: string | null;
  deviceId: string;
  platform?: 'ios' | 'android' | 'web';
  productId: string;
  provider?: string | null;
  purchaseTime: number;
  purchaseToken?: string | null;
  transactionId: string;
}

interface IapStoreState {
  purchases: PurchaseRecord[];
  purchasedProductIds: string[];
  addPurchase: (purchase: PurchaseRecord) => void;
  isPurchased: (productId: string) => boolean;
  linkPurchasesToAccount: (account: {
    accountId?: string | null;
    accountEmail?: string | null;
    deviceId: string;
    provider?: string | null;
  }) => void;
  restorePurchases: (purchases: PurchaseRecord[]) => void;
  clearPurchases: () => void;
}

const mmkvStorage: StateStorage = {
  getItem: (name) => storage.getString(name) ?? null,
  removeItem: (name) => storage.delete(name),
  setItem: (name, value) => storage.set(name, value),
};

const dedupePurchases = (purchases: PurchaseRecord[]) => {
  const records = new Map<string, PurchaseRecord>();

  purchases.forEach((purchase) => {
    records.set(`${purchase.productId}:${purchase.transactionId}`, purchase);
  });

  return Array.from(records.values());
};

export const useIapStore = create<IapStoreState>()(
  persist(
    (set, get) => ({
      purchases: [],
      purchasedProductIds: [],
      addPurchase: (purchase) => {
        const purchases = dedupePurchases([...get().purchases, purchase]);
        set({
          purchases,
          purchasedProductIds: Array.from(new Set(purchases.map((item) => item.productId))),
        });
      },
      isPurchased: (productId) => get().purchasedProductIds.includes(productId),
      linkPurchasesToAccount: (account) => {
        const purchases = get().purchases.map((purchase) => ({
          ...purchase,
          accountId: account.accountId ?? purchase.accountId ?? null,
          accountEmail: account.accountEmail ?? purchase.accountEmail ?? null,
          deviceId: account.deviceId,
          provider: account.provider ?? purchase.provider ?? null,
        }));

        set({
          purchases,
          purchasedProductIds: Array.from(new Set(purchases.map((item) => item.productId))),
        });
      },
      restorePurchases: (purchases) => {
        const restoredPurchases = dedupePurchases(purchases);
        set({
          purchases: restoredPurchases,
          purchasedProductIds: Array.from(
            new Set(restoredPurchases.map((purchase) => purchase.productId)),
          ),
        });
      },
      clearPurchases: () => {
        set({
          purchases: [],
          purchasedProductIds: [],
        });
      },
    }),
    {
      name: 'iap-storage',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);

export const isPremiumProductId = (productId: string) => {
  return PREMIUM_PRODUCT_IDS.includes(productId);
};

export const getProductSKUs = () => {
  return Array.from(
    new Set(PREMIUM_PRODUCT_IDS.filter((productId) => productId.trim().length > 0)),
  );
};
