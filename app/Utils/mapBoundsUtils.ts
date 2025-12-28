import { GeoLatLng } from '@Types/Interface';

/**
 * Calculate the center point between two locations
 */
export const calculateCenter = (point1: GeoLatLng, point2: GeoLatLng): [number, number] => {
  return [(point1.longitude + point2.longitude) / 2, (point1.latitude + point2.latitude) / 2];
};

/**
 * Calculate distance in kilometers between two points using Haversine formula
 */
export const calculateDistance = (point1: GeoLatLng, point2: GeoLatLng): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.latitude * Math.PI) / 180) *
      Math.cos((point2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculate appropriate zoom level based on distance between two points
 * This mimics Google Maps behavior
 */
export const calculateZoomForDistance = (distanceKm: number): number => {
  // Approximate zoom levels based on distance
  // These values are calibrated to show both points with good padding
  if (distanceKm > 2000) return 3;
  if (distanceKm > 1000) return 4;
  if (distanceKm > 500) return 5;
  if (distanceKm > 200) return 6;
  if (distanceKm > 100) return 7;
  if (distanceKm > 50) return 8;
  if (distanceKm > 25) return 9;
  if (distanceKm > 10) return 10;
  if (distanceKm > 5) return 11;
  if (distanceKm > 2) return 12;
  if (distanceKm > 1) return 13;
  if (distanceKm > 0.5) return 14;
  if (distanceKm > 0.2) return 15;
  if (distanceKm > 0.1) return 16;
  return 17;
};

/**
 * Fit map camera to show both user location and target location
 * Uses setCamera with calculated center and zoom for reliable behavior
 */
export const fitMapToLocations = (
  cameraRef: React.RefObject<any>,
  userLocation: GeoLatLng,
  targetLocation: GeoLatLng,
  options: {
    paddingTop?: number;
    paddingRight?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    animationDuration?: number;
  } = {},
): void => {
  if (!cameraRef.current) return;

  const { animationDuration = 800 } = options;

  // Calculate distance between points
  const distance = calculateDistance(userLocation, targetLocation);

  // Calculate center point
  const center = calculateCenter(userLocation, targetLocation);

  // Get appropriate zoom level (subtract 1 to add padding)
  const zoom = Math.max(3, calculateZoomForDistance(distance) - 1);

  // Use setCamera for reliable behavior
  cameraRef.current.setCamera({
    centerCoordinate: center,
    zoomLevel: zoom,
    animationDuration,
    animationMode: 'flyTo',
  });
};

/**
 * Alternative method using flyTo for smoother animation
 */
export const flyToFitLocations = (
  cameraRef: React.RefObject<any>,
  userLocation: GeoLatLng,
  targetLocation: GeoLatLng,
  animationDuration: number = 1000,
): void => {
  if (!cameraRef.current) return;

  const distance = calculateDistance(userLocation, targetLocation);
  const center = calculateCenter(userLocation, targetLocation);
  const zoom = Math.max(3, calculateZoomForDistance(distance) - 1);

  // First fly to center, then adjust zoom
  cameraRef.current.flyTo(center, animationDuration);

  // Set zoom after a short delay to ensure smooth animation
  setTimeout(() => {
    if (cameraRef.current) {
      cameraRef.current.zoomTo(zoom, animationDuration / 2);
    }
  }, animationDuration / 2);
};
