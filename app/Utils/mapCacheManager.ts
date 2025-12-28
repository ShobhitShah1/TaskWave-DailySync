/**
 * Map Cache Manager for MapLibre
 * Handles ambient cache configuration and offline pack downloads
 * to reduce blank spots and improve map loading performance
 */

import { OfflineManager } from '@maplibre/maplibre-react-native';
import { GeoLatLng } from '@Types/Interface';

// Cache size in bytes (50MB for ambient cache)
const AMBIENT_CACHE_SIZE = 50 * 1024 * 1024;

// Flag to track initialization
let isInitialized = false;

// Active download subscriptions
const activeSubscriptions: Map<string, any> = new Map();

/**
 * Initialize the ambient cache for faster tile loading
 * Call this once when the app starts or before showing the map
 * The ambient cache stores tiles that were viewed during normal map usage
 */
export const initializeMapCache = async (): Promise<void> => {
  if (isInitialized) {
    console.log('[MapCache] Already initialized, skipping');
    return;
  }

  try {
    // Set a larger ambient cache size for better performance
    // This helps reduce blank spots by caching more tiles
    await OfflineManager.setMaximumAmbientCacheSize(AMBIENT_CACHE_SIZE);
    isInitialized = true;
    console.log(
      '[MapCache] Ambient cache initialized with size:',
      AMBIENT_CACHE_SIZE / 1024 / 1024,
      'MB',
    );
  } catch (error) {
    console.warn('[MapCache] Failed to initialize ambient cache:', error);
  }
};

/**
 * Download offline pack for a specific location with progress logging
 * @param location - Center location for the pack
 * @param styleURL - Map style URL (as string)
 * @param radiusKm - Radius in kilometers to download around the location
 */
export const downloadOfflinePack = async (
  location: GeoLatLng,
  styleURL: string,
  radiusKm: number = 1,
  packName?: string,
): Promise<string | null> => {
  const name = packName || `pack_${Date.now()}`;

  // Convert km to degrees (rough approximation: 1 degree ≈ 111km)
  const radiusDegrees = radiusKm / 111;

  // Bounds as [southwest, northeast] corners - each as [longitude, latitude]
  const bounds: [[number, number], [number, number]] = [
    [location.longitude - radiusDegrees, location.latitude - radiusDegrees], // Southwest [minLon, minLat]
    [location.longitude + radiusDegrees, location.latitude + radiusDegrees], // Northeast [maxLon, maxLat]
  ];

  console.log('[MapCache] Starting offline pack download:', name);
  console.log('[MapCache] Location:', location.latitude.toFixed(4), location.longitude.toFixed(4));
  console.log('[MapCache] Radius:', radiusKm, 'km');
  console.log(
    '[MapCache] Bounds:',
    bounds
      .flat()
      .map((b) => b.toFixed(4))
      .join(', '),
  );

  try {
    // Create the offline pack
    await OfflineManager.createPack(
      {
        name,
        styleURL,
        bounds,
        minZoom: 10,
        maxZoom: 17,
      },
      (pack, status) => {
        // Progress callback
        const percentage = status.percentage?.toFixed(1) || '0';
        const completed = status.completedResourceCount || 0;
        const required = status.requiredResourceCount || 0;

        console.log(
          `[MapCache] Download progress: ${percentage}% (${completed}/${required} resources)`,
        );

        if (status.percentage === 100) {
          console.log('[MapCache] Offline pack download complete:', name);
        }
      },
      (pack, error) => {
        // Error callback
        console.error('[MapCache] Offline pack error:', error);
      },
    );

    console.log('[MapCache] Pack created:', name);
    return name;
  } catch (error) {
    console.error('[MapCache] Failed to create offline pack:', error);
    return null;
  }
};

/**
 * Download tiles around user's current location
 */
export const downloadTilesForLocation = async (
  location: GeoLatLng,
  theme: 'light' | 'dark',
): Promise<string | null> => {
  // For custom JSON styles, we need to use a tile URL
  // OpenFreeMap tiles URL
  const styleURL = 'https://tiles.openfreemap.org/planet';

  console.log('[MapCache] Downloading tiles for current location...');
  console.log('[MapCache] Theme:', theme);

  return downloadOfflinePack(location, styleURL, 1, `location_${theme}_${Date.now()}`);
};

/**
 * Clear the ambient cache to free up storage
 */
export const clearMapCache = async (): Promise<void> => {
  try {
    await OfflineManager.clearAmbientCache();
    console.log('[MapCache] Ambient cache cleared');
  } catch (error) {
    console.warn('[MapCache] Failed to clear cache:', error);
  }
};

/**
 * Invalidate and refresh cached tiles
 * Useful when tiles might be outdated
 */
export const refreshMapCache = async (): Promise<void> => {
  try {
    await OfflineManager.invalidateAmbientCache();
    console.log('[MapCache] Cache invalidated for refresh');
  } catch (error) {
    console.warn('[MapCache] Failed to refresh cache:', error);
  }
};

/**
 * Get list of all offline packs with details
 */
export const getOfflinePacks = async () => {
  try {
    const packs = await OfflineManager.getPacks();
    console.log('[MapCache] Found', packs?.length || 0, 'offline packs');

    if (packs && packs.length > 0) {
      packs.forEach((pack: any, index: number) => {
        console.log(`[MapCache]   ${index + 1}. ${pack.name || 'unnamed'}`);
      });
    }

    return packs;
  } catch (error) {
    console.warn('[MapCache] Failed to get packs:', error);
    return [];
  }
};

/**
 * Delete a specific offline pack
 */
export const deleteOfflinePack = async (packName: string): Promise<boolean> => {
  try {
    await OfflineManager.deletePack(packName);
    console.log('[MapCache] Deleted pack:', packName);
    return true;
  } catch (error) {
    console.warn('[MapCache] Failed to delete pack:', error);
    return false;
  }
};

/**
 * Delete all offline packs
 */
export const deleteAllOfflinePacks = async (): Promise<void> => {
  try {
    const packs = await getOfflinePacks();
    if (packs && packs.length > 0) {
      for (const pack of packs) {
        if (pack.name) {
          await deleteOfflinePack(pack.name);
        }
      }
      console.log('[MapCache] All offline packs deleted');
    }
  } catch (error) {
    console.warn('[MapCache] Failed to delete all packs:', error);
  }
};

export default {
  initializeMapCache,
  downloadOfflinePack,
  downloadTilesForLocation,
  clearMapCache,
  refreshMapCache,
  getOfflinePacks,
  deleteOfflinePack,
  deleteAllOfflinePacks,
};
