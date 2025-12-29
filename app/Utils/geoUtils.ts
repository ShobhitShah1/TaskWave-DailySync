import { GetCenterBetweenPoints, GetZoomLevelForPoints } from '@Types/Interface';
import * as Location from 'expo-location';

export const MIN_DISTANCE_METERS = 100;

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
  options?: {
    paddingPercent?: number;
    mapWidth?: number;
    mapHeight?: number;
    minZoom?: number;
    maxZoom?: number;
  },
): { center: { latitude: number; longitude: number }; zoomLevel: number } {
  const paddingPercent = options?.paddingPercent ?? 0.1; // 10% default
  const mapWidth = options?.mapWidth ?? 400;
  const mapHeight = options?.mapHeight ?? 600;
  const minZoom = options?.minZoom ?? 2;
  const maxZoom = options?.maxZoom ?? 18;

  // Calculate bounds
  const minLat = Math.min(pointA.latitude, pointB.latitude);
  const maxLat = Math.max(pointA.latitude, pointB.latitude);
  const minLng = Math.min(pointA.longitude, pointB.longitude);
  const maxLng = Math.max(pointA.longitude, pointB.longitude);

  // Calculate distances
  const latDiff = maxLat - minLat;
  const lngDiff = maxLng - minLng;

  // Apply dynamic padding based on distance
  const latPadding = Math.max(latDiff * paddingPercent, 0.001); // Minimum padding
  const lngPadding = Math.max(lngDiff * paddingPercent, 0.001);

  // Adjusted bounds with padding
  const paddedMinLat = minLat - latPadding;
  const paddedMaxLat = maxLat + latPadding;
  const paddedMinLng = minLng - lngPadding;
  const paddedMaxLng = maxLng + lngPadding;

  // Center calculation
  const centerLat = (paddedMinLat + paddedMaxLat) / 2;
  const centerLng = (paddedMinLng + paddedMaxLng) / 2;

  // Improved zoom calculation
  const EARTH_CIRCUMFERENCE = 40075017; // meters
  const TILE_SIZE = 256;

  // Calculate the ground resolution needed for each dimension
  const latSpan = paddedMaxLat - paddedMinLat;
  const lngSpan = paddedMaxLng - paddedMinLng;

  // Convert latitude span to meters (approximate)
  const latSpanMeters = latSpan * (EARTH_CIRCUMFERENCE / 360);

  // Convert longitude span to meters at this latitude
  const avgLat = (centerLat * Math.PI) / 180;
  const lngSpanMeters = lngSpan * (EARTH_CIRCUMFERENCE / 360) * Math.cos(avgLat);

  // Calculate zoom levels for each dimension
  const latZoom = Math.log2((mapHeight * EARTH_CIRCUMFERENCE) / (latSpanMeters * TILE_SIZE));
  const lngZoom = Math.log2((mapWidth * EARTH_CIRCUMFERENCE) / (lngSpanMeters * TILE_SIZE));

  // Use the more restrictive zoom level
  let zoomLevel = Math.min(latZoom, lngZoom);

  // Apply constraints
  zoomLevel = Math.max(minZoom, Math.min(maxZoom, zoomLevel));

  // Round to reasonable precision
  zoomLevel = Math.round(zoomLevel * 100) / 100;

  // Fallback for invalid calculations
  if (!isFinite(zoomLevel) || isNaN(zoomLevel)) {
    zoomLevel = minZoom;
  }

  return {
    center: { latitude: centerLat, longitude: centerLng },
    zoomLevel,
  };
}

export function getDistanceBetweenPoints(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number },
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.latitude * Math.PI) / 180) *
      Math.cos((point2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

// Adaptive zoom based on distance
export function getAdaptiveZoomLevel(distance: number): number {
  if (distance < 1) return 15; // Very close
  if (distance < 5) return 13; // Close
  if (distance < 25) return 11; // Medium
  if (distance < 100) return 9; // Far
  if (distance < 500) return 7; // Very far
  if (distance < 2000) return 5; // Continental
  return 3; // Global
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
