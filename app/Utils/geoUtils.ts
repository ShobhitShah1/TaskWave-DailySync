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
