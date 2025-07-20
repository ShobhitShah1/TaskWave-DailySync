import { GetCenterBetweenPoints, GetZoomLevelForPoints } from '@Types/Interface';

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
