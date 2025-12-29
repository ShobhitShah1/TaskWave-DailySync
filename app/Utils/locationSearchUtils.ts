import { NominatimResult } from '@Types/Interface';

const CACHE_DURATION = 5 * 60 * 1000;
const cache = new Map<string, { data: NominatimResult[]; timestamp: number }>();

export const getCachedResults = (key: string): NominatimResult[] | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

export const setCachedResults = (key: string, data: NominatimResult[]): void => {
  cache.set(key, { data, timestamp: Date.now() });
  if (cache.size > 100) {
    const oldestKey = cache.keys().next().value;
    if (typeof oldestKey === 'string') {
      cache.delete(oldestKey);
    }
  }
};

export const clearLocationCache = (): void => {
  cache.clear();
};

const createFetchWithTimeout = (timeoutMs: number = 8000) => {
  return async (url: string, options?: RequestInit): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  };
};

const fetchWithTimeout = createFetchWithTimeout();

export const searchNominatim = async (
  query: string,
  options: { limit?: number; countryCode?: string; language?: string } = {},
): Promise<NominatimResult[]> => {
  const params = new URLSearchParams({
    format: 'json',
    q: query,
    limit: (options.limit || 10).toString(),
    addressdetails: '1',
    ...(options.countryCode && { countrycodes: options.countryCode }),
    ...(options.language && { 'accept-language': options.language }),
  });

  const res = await fetchWithTimeout(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'User-Agent': 'DailySyncApp/1.0' },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const searchPhoton = async (
  query: string,
  options: { limit?: number; language?: string; bbox?: string } = {},
): Promise<NominatimResult[]> => {
  const params = new URLSearchParams({
    q: query,
    limit: (options.limit || 10).toString(),
    ...(options.language && { lang: options.language }),
    ...(options.bbox && { bbox: options.bbox }),
  });

  const res = await fetchWithTimeout(`https://photon.komoot.io/api/?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  const features = data.features || [];

  return features.map((f: any) => ({
    display_name: [
      f.properties.name,
      f.properties.city || f.properties.locality,
      f.properties.state,
      f.properties.country,
    ]
      .filter(Boolean)
      .join(', '),
    lat: f.geometry.coordinates[1].toString(),
    lon: f.geometry.coordinates[0].toString(),
    importance: f.properties.importance || 0.5,
    type: f.properties.type || 'unknown',
    osm_type: f.properties.osm_type,
    osm_id: f.properties.osm_id,
  }));
};

export const searchLocationIQ = async (
  query: string,
  apiKey: string,
  options: { limit?: number; countryCode?: string } = {},
): Promise<NominatimResult[]> => {
  if (!apiKey) return [];

  const params = new URLSearchParams({
    key: apiKey,
    q: query,
    format: 'json',
    limit: (options.limit || 10).toString(),
    ...(options.countryCode && { countrycodes: options.countryCode }),
  });

  const res = await fetchWithTimeout(`https://us1.locationiq.com/v1/search.php?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const searchGeocodeMaps = async (
  query: string,
  options: { limit?: number } = {},
): Promise<NominatimResult[]> => {
  const params = new URLSearchParams({
    q: query,
    limit: (options.limit || 10).toString(),
    format: 'json',
  });

  const res = await fetchWithTimeout(`https://geocode.maps.co/search?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export interface LocationSearchOptions {
  limit?: number;
  language?: string;
  countryCode?: string;
  bbox?: string;
}

export const searchLocationsMultiProvider = async (
  query: string,
  options: LocationSearchOptions = {},
): Promise<NominatimResult[]> => {
  const cacheKey = `${query}:${options.language}:${options.countryCode}`;
  const cached = getCachedResults(cacheKey);
  if (cached) return cached;

  const providers = [
    () => searchPhoton(query, options),
    () => searchNominatim(query, options),
    () => searchGeocodeMaps(query, options),
  ];

  for (const provider of providers) {
    try {
      const results = await provider();
      if (results && results.length > 0) {
        const limited = results.slice(0, options.limit || 10);
        setCachedResults(cacheKey, limited);
        return limited;
      }
    } catch (error) {
      continue;
    }
  }

  return [];
};

export const getLocationIconName = (displayName: string): string => {
  const lower = displayName.toLowerCase();

  const iconMap: Record<string, string[]> = {
    'restaurant-outline': ['restaurant', 'cafe', 'food', 'dining'],
    'medical-outline': ['hospital', 'clinic', 'medical'],
    'school-outline': ['school', 'university', 'college', 'education'],
    'leaf-outline': ['park', 'garden', 'nature'],
    'storefront-outline': ['mall', 'shopping', 'store', 'market'],
    'airplane-outline': ['airport', 'terminal'],
    'train-outline': ['station', 'metro', 'bus', 'transport'],
    'bed-outline': ['hotel', 'resort', 'accommodation'],
    'card-outline': ['bank', 'atm', 'financial'],
    'car-outline': ['gas', 'fuel', 'petrol'],
  };

  for (const [icon, keywords] of Object.entries(iconMap)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return icon;
    }
  }

  return 'location-outline';
};

export const formatCoordinates = (lat: string | number, lon: string | number): string => {
  return `${parseFloat(String(lat)).toFixed(3)}, ${parseFloat(String(lon)).toFixed(3)}`;
};

export const getLocationName = (displayName: string): string => {
  return displayName.split(',')[0] || displayName;
};
