import { GeoLatLng } from '@Types/Interface';
import { Feature, LineString } from 'geojson';

const OSRM_API_URL = 'https://router.project-osrm.org/route/v1/driving';

export const fetchRoute = async (
  start: GeoLatLng,
  end: GeoLatLng,
): Promise<Feature<LineString> | null> => {
  try {
    const url = `${OSRM_API_URL}/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      return {
        type: 'Feature',
        properties: {
          distance: data.routes[0].distance,
          duration: data.routes[0].duration,
        },
        geometry: data.routes[0].geometry,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching route:', error);
    return null;
  }
};
