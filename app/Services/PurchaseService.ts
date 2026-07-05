import { apiClient, toApiError } from '@Services/ApiClient';
import { PurchaseRecord } from '@Services/IapService';

interface ApiResponse<T> {
  status: 'success' | 'error';
  message: string;
  data: T;
}

type PurchasesResponseBody = ApiResponse<PurchaseRecord[]>;
type PurchaseResponseBody = ApiResponse<PurchaseRecord[]>;

export const purchaseApi = {
  getPurchases: async () => {
    try {
      const response = await apiClient.get<PurchasesResponseBody>('/api/purchases');
      return response.data.data;
    } catch (error) {
      throw toApiError(error);
    }
  },
  syncPurchase: async (purchase: PurchaseRecord) => {
    try {
      const response = await apiClient.post<PurchaseResponseBody>('/api/purchases', purchase);
      return response.data.data;
    } catch (error) {
      throw toApiError(error);
    }
  },
};
