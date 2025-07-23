import { GetCenterBetweenPoints, GetZoomLevelForPoints } from '@Types/Interface';
import * as Location from 'expo-location';

/**
 * Calculate the center point between two GeoLatLng coordinates.
 */
export const getCenterBetweenPoints: GetCenterBetweenPoints = (a, b) => ({
  latitude: (a.latitude + b.latitude) / 2,
  longitude: (a.longitude + b.longitude) / 2,
});

/**
 * Calculate the appropriate zoom level for two points based on their distance.
 * Returns a zoom level suitable for MapLibre/Mapbox.
 */
export const getZoomLevelForPoints: GetZoomLevelForPoints = (a, b) => {
  const latDiff = Math.abs(a.latitude - b.latitude);
  const lngDiff = Math.abs(a.longitude - b.longitude);
  const maxDiff = Math.max(latDiff, lngDiff);
  if (maxDiff > 0.01) return 12; // Far apart
  if (maxDiff > 0.001) return 14; // Medium distance
  return 16; // Close together
};

/**
 * Calculate the center and zoom level to fit two points on the map with padding.
 * Returns { center: { latitude, longitude }, zoomLevel }
 */
export function fitBoundsZoomLevel(
  pointA: { latitude: number; longitude: number },
  pointB: { latitude: number; longitude: number },
  options?: { padding?: number; mapWidth?: number; mapHeight?: number },
): { center: { latitude: number; longitude: number }; zoomLevel: number } {
  const padding = options?.padding ?? 0.02;
  const mapWidth = options?.mapWidth ?? 400; // px
  const mapHeight = options?.mapHeight ?? 250; // px
  // Calculate bounds
  const minLat = Math.min(pointA.latitude, pointB.latitude);
  const maxLat = Math.max(pointA.latitude, pointB.latitude);
  const minLng = Math.min(pointA.longitude, pointB.longitude);
  const maxLng = Math.max(pointA.longitude, pointB.longitude);
  // Center is the midpoint
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  // Mapbox/MapLibre zoom calculation
  const WORLD_DIM = 256;
  const ZOOM_MAX = 20;
  function latRad(lat: number) {
    const sin = Math.sin((lat * Math.PI) / 180);
    const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
    return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
  }
  function zoom(mapPx: number, worldPx: number, fraction: number) {
    return Math.log2(mapPx / worldPx / fraction);
  }
  const latFraction = (latRad(maxLat + padding / 2) - latRad(minLat - padding / 2)) / Math.PI;
  const lngFraction = (maxLng - minLng + padding) / 360;
  const latZoom = zoom(mapHeight, WORLD_DIM, latFraction);
  const lngZoom = zoom(mapWidth, WORLD_DIM, lngFraction);
  let zoomLevel = Math.min(latZoom, lngZoom, ZOOM_MAX);
  zoomLevel = Math.floor(zoomLevel * 100) / 100;
  if (!isFinite(zoomLevel) || zoomLevel < 2) zoomLevel = 2;
  return {
    center: { latitude: centerLat, longitude: centerLng },
    zoomLevel,
  };
}

export interface AddressDetails {
  address: string;
  city?: string;
  area?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export const getAddressFromCoords = async (
  latitude: number,
  longitude: number,
): Promise<AddressDetails> => {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (results && results.length > 0) {
      const addr = results[0];
      // Compose full address string
      const address = [
        addr.name, // House/Flat
        addr.street, // Street
        addr.district || addr.city, // Locality
        addr.city, // City
        addr.region, // State
        addr.postalCode, // Pincode
        addr.country, // Country
      ]
        .filter((v, i, arr) => v && arr.indexOf(v) === i) // skip empty and duplicates
        .join(', ');
      return {
        address,
        city: addr.city ?? undefined,
        area: addr.district ?? addr.subregion ?? addr.street ?? undefined,
        state: addr.region ?? undefined,
        postalCode: addr.postalCode ?? undefined,
        country: addr.country ?? undefined,
      };
    }
    return { address: '' };
  } catch {
    return { address: '' };
  }
};
