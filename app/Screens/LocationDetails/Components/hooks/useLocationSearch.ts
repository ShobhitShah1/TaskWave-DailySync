import { NominatimResult } from '@Types/Interface';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseLocationSearchProps {
  value: string;
  onResultSelect?: (result: NominatimResult) => void;
  debounceMs?: number;
  minQueryLength?: number;
  maxResults?: number;
  language?: string;
  countryCode?: string;
}

interface LocationService {
  name: string;
  fetch: (query: string, options?: any) => Promise<NominatimResult[]>;
  priority: number;
}

// Optimized fetch functions with better error handling and caching
const fetchNominatim = async (
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'LocationSearchApp/1.0',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();
    const data = JSON.parse(text);

    return Array.isArray(data) ? data : [];
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

const fetchPhoton = async (
  query: string,
  options: { limit?: number; language?: string } = {},
): Promise<NominatimResult[]> => {
  const params = new URLSearchParams({
    q: query,
    limit: (options.limit || 10).toString(),
    ...(options.language && { lang: options.language }),
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`https://photon.komoot.io/api/?${params}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

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
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

const fetchMapbox = async (
  query: string,
  options: { limit?: number; countryCode?: string; language?: string } = {},
): Promise<NominatimResult[]> => {
  // Note: Requires MAPBOX_ACCESS_TOKEN environment variable
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) throw new Error('Mapbox token not available');

  const params = new URLSearchParams({
    q: query,
    limit: (options.limit || 10).toString(),
    access_token: token,
    ...(options.countryCode && { country: options.countryCode }),
    ...(options.language && { language: options.language }),
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`,
      {
        signal: controller.signal,
      },
    );
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const features = data.features || [];

    return features.map((f: any) => ({
      display_name: f.place_name,
      lat: f.center[1].toString(),
      lon: f.center[0].toString(),
      importance: f.relevance || 0.5,
      type: f.place_type?.[0] || 'unknown',
      bbox: f.bbox,
    }));
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

// Simple in-memory cache
const cache = new Map<string, { data: NominatimResult[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCached = (key: string): NominatimResult[] | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCache = (key: string, data: NominatimResult[]): void => {
  cache.set(key, { data, timestamp: Date.now() });

  // Clean old entries if cache gets too large
  if (cache.size > 100) {
    const oldestKey = cache.keys().next().value;
    if (typeof oldestKey === 'string') {
      cache.delete(oldestKey);
    }
  }
};

export function useLocationSearch({
  value,
  onResultSelect,
  debounceMs = 800,
  minQueryLength = 2,
  maxResults = 10,
  language = 'en',
  countryCode,
}: UseLocationSearchProps) {
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // Service priority order (higher priority tried first)
  const services: LocationService[] = [
    { name: 'nominatim', fetch: fetchNominatim, priority: 1 },
    { name: 'photon', fetch: fetchPhoton, priority: 2 },
    { name: 'mapbox', fetch: fetchMapbox, priority: 3 },
  ];

  const searchLocations = useCallback(
    async (query: string) => {
      if (query.length < minQueryLength) {
        setResults([]);
        setLoading(false);
        return;
      }

      // Check cache first
      const cacheKey = `${query}:${language}:${countryCode}`;
      const cached = getCached(cacheKey);
      if (cached) {
        setResults(cached.slice(0, maxResults));
        setLoading(false);
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setLoading(true);
      setError(null);

      const options = {
        limit: maxResults,
        countryCode,
        language,
      };

      // Try services in priority order
      for (const service of services.sort((a, b) => a.priority - b.priority)) {
        try {
          const data = await service.fetch(query, options);

          if (data && data.length > 0) {
            const limitedResults = data.slice(0, maxResults);
            setResults(limitedResults);
            setCache(cacheKey, limitedResults);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn(`${service.name} failed:`, err);
          // Continue to next service
        }
      }

      // If all services failed
      setResults([]);
      setError('Unable to search locations. Please try again.');
      setLoading(false);
    },
    [minQueryLength, maxResults, language, countryCode],
  );

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!value?.trim()) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(value.length >= minQueryLength);

    // Debounce the search
    timeoutRef.current = setTimeout(() => {
      searchLocations(value.trim());
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [value, searchLocations, debounceMs, minQueryLength]);

  const handleSelect = useCallback(
    (item: NominatimResult) => {
      onResultSelect?.(item);
    },
    [onResultSelect],
  );

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  const retry = useCallback(() => {
    if (value?.trim()) {
      searchLocations(value.trim());
    }
  }, [value, searchLocations]);

  return {
    results,
    loading,
    error,
    handleSelect,
    clearResults,
    retry,
  };
}

// import { NominatimResult } from '@Types/Interface';
// import { useCallback, useEffect, useRef, useState } from 'react';

// interface UseLocationSearchProps {
//   value: string;
//   onResultSelect?: (result: NominatimResult) => void;
//   debounceMs?: number;
//   minQueryLength?: number;
//   maxResults?: number;
// }

// // Enhanced Nominatim with India-specific parameters
// const fetchNominatimIndia = async (
//   query: string,
//   options: any = {},
// ): Promise<NominatimResult[]> => {
//   const params = new URLSearchParams({
//     format: 'json',
//     q: query,
//     limit: (options.limit || 15).toString(),
//     addressdetails: '1',
//     countrycodes: 'in', // Restrict to India
//     'accept-language': 'en,hi', // English and Hindi
//     dedupe: '0', // Don't deduplicate to get more results
//     extratags: '1',
//     namedetails: '1',
//   });

//   const controller = new AbortController();
//   const timeoutId = setTimeout(() => controller.abort(), 10000);

//   try {
//     const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
//       signal: controller.signal,
//       headers: {
//         'User-Agent': 'IndianLocationSearch/1.0',
//         Accept: 'application/json',
//       },
//     });
//     clearTimeout(timeoutId);

//     if (!res.ok) throw new Error(`HTTP ${res.status}`);

//     const data = await res.json();
//     return Array.isArray(data)
//       ? data.map((item) => ({
//           ...item,
//           display_name: formatIndianAddress(item),
//           importance: calculateIndianRelevance(item, query),
//         }))
//       : [];
//   } catch (error) {
//     clearTimeout(timeoutId);
//     throw error;
//   }
// };

// // Photon with India optimization
// const fetchPhotonIndia = async (query: string, options: any = {}): Promise<NominatimResult[]> => {
//   const params = new URLSearchParams({
//     q: query,
//     limit: (options.limit || 15).toString(),
//     lang: 'en',
//     bbox: '68.1766451354,7.96553477623,97.4025614766,35.4940095078', // India bounding box
//   });

//   const controller = new AbortController();
//   const timeoutId = setTimeout(() => controller.abort(), 8000);

//   try {
//     const res = await fetch(`https://photon.komoot.io/api/?${params}`, {
//       signal: controller.signal,
//     });
//     clearTimeout(timeoutId);

//     if (!res.ok) throw new Error(`HTTP ${res.status}`);

//     const data = await res.json();
//     const features = data.features || [];

//     return features
//       .filter((f: any) => f.properties.country === 'India') // Ensure India only
//       .map((f: any) => ({
//         display_name: formatPhotonIndianAddress(f.properties),
//         lat: f.geometry.coordinates[1].toString(),
//         lon: f.geometry.coordinates[0].toString(),
//         importance: calculatePhotonRelevance(f.properties, query),
//         type: f.properties.type || 'unknown',
//         osm_type: f.properties.osm_type,
//         osm_id: f.properties.osm_id,
//         address: {
//           city: f.properties.city || f.properties.locality,
//           state: f.properties.state,
//           country: f.properties.country,
//           postcode: f.properties.postcode,
//           district: f.properties.district,
//         },
//       }));
//   } catch (error) {
//     clearTimeout(timeoutId);
//     throw error;
//   }
// };

// // OpenStreetMap Overpass API for detailed Indian data
// const fetchOverpassIndia = async (query: string, options: any = {}): Promise<NominatimResult[]> => {
//   const overpassQuery = `
//     [out:json][timeout:10];
//     (
//       node["name"~"${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"i]["place"]["place"!="farm"]["place"!="isolated_dwelling"](country:IN);
//       way["name"~"${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"i]["place"]["place"!="farm"]["place"!="isolated_dwelling"](country:IN);
//       relation["name"~"${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"i]["place"]["place"!="farm"]["place"!="isolated_dwelling"](country:IN);
//     );
//     out center ${options.limit || 10};
//   `;

//   const controller = new AbortController();
//   const timeoutId = setTimeout(() => controller.abort(), 15000);

//   try {
//     const res = await fetch('https://overpass-api.de/api/interpreter', {
//       method: 'POST',
//       body: overpassQuery,
//       signal: controller.signal,
//       headers: {
//         'Content-Type': 'text/plain',
//       },
//     });
//     clearTimeout(timeoutId);

//     if (!res.ok) throw new Error(`HTTP ${res.status}`);

//     const data = await res.json();
//     const elements = data.elements || [];

//     return elements
//       .map((element: any) => {
//         const lat = element.lat || element.center?.lat || 0;
//         const lon = element.lon || element.center?.lon || 0;

//         return {
//           display_name: formatOverpassAddress(element.tags, query),
//           lat: lat.toString(),
//           lon: lon.toString(),
//           importance: calculateOverpassRelevance(element.tags, query),
//           type: element.tags?.place || 'unknown',
//           osm_type: element.type,
//           osm_id: element.id,
//           address: extractIndianAddress(element.tags),
//         };
//       })
//       .filter((item) => item.lat !== '0' && item.lon !== '0');
//   } catch (error) {
//     clearTimeout(timeoutId);
//     throw error;
//   }
// };

// // Indian address formatting functions
// const formatIndianAddress = (item: any): string => {
//   const parts = [];

//   if (item.name) parts.push(item.name);
//   if (item.address?.suburb && item.address.suburb !== item.name) parts.push(item.address.suburb);
//   if (item.address?.city && item.address.city !== item.name) parts.push(item.address.city);
//   if (item.address?.state_district && item.address.state_district !== item.address.city)
//     parts.push(item.address.state_district);
//   if (item.address?.state) parts.push(item.address.state);
//   if (item.address?.postcode) parts.push(item.address.postcode);

//   return parts.filter(Boolean).join(', ') || item.display_name;
// };

// const formatPhotonIndianAddress = (props: any): string => {
//   const parts = [];

//   if (props.name) parts.push(props.name);
//   if (props.locality && props.locality !== props.name) parts.push(props.locality);
//   if (props.city && props.city !== props.name && props.city !== props.locality)
//     parts.push(props.city);
//   if (props.district && props.district !== props.city) parts.push(props.district);
//   if (props.state) parts.push(props.state);
//   if (props.postcode) parts.push(props.postcode);

//   return parts.filter(Boolean).join(', ');
// };

// const formatOverpassAddress = (tags: any, query: string): string => {
//   const parts = [];

//   if (tags.name) parts.push(tags.name);
//   if (tags['name:hi'] && !parts.includes(tags['name:hi'])) parts.push(`(${tags['name:hi']})`);
//   if (tags.locality && tags.locality !== tags.name) parts.push(tags.locality);
//   if (tags.city && tags.city !== tags.name) parts.push(tags.city);
//   if (tags.district && tags.district !== tags.city) parts.push(tags.district);
//   if (tags.state) parts.push(tags.state);

//   return parts.filter(Boolean).join(', ');
// };

// // Relevance calculation for Indian locations
// const calculateIndianRelevance = (item: any, query: string): number => {
//   let score = parseFloat(item.importance || '0.5');
//   const lowerQuery = query.toLowerCase();
//   const name = (item.name || '').toLowerCase();
//   const displayName = (item.display_name || '').toLowerCase();

//   // Boost exact matches
//   if (name === lowerQuery) score += 0.3;
//   else if (name.startsWith(lowerQuery)) score += 0.2;
//   else if (name.includes(lowerQuery)) score += 0.1;

//   // Boost major Indian cities
//   const majorCities = [
//     'mumbai',
//     'delhi',
//     'bangalore',
//     'hyderabad',
//     'chennai',
//     'kolkata',
//     'pune',
//     'ahmedabad',
//     'surat',
//     'jaipur',
//   ];
//   if (majorCities.some((city) => displayName.includes(city))) score += 0.15;

//   // Boost based on place type
//   const placeType = item.type || item.class || '';
//   if (placeType === 'city') score += 0.2;
//   else if (placeType === 'town') score += 0.15;
//   else if (placeType === 'village') score += 0.1;

//   return Math.min(score, 1.0);
// };

// const calculatePhotonRelevance = (props: any, query: string): number => {
//   let score = 0.5;
//   const lowerQuery = query.toLowerCase();
//   const name = (props.name || '').toLowerCase();

//   if (name === lowerQuery) score = 0.9;
//   else if (name.startsWith(lowerQuery)) score = 0.8;
//   else if (name.includes(lowerQuery)) score = 0.6;

//   // Boost cities and towns
//   if (props.type === 'city') score += 0.2;
//   else if (props.type === 'town') score += 0.15;

//   return Math.min(score, 1.0);
// };

// const calculateOverpassRelevance = (tags: any, query: string): number => {
//   let score = 0.6;
//   const lowerQuery = query.toLowerCase();
//   const name = (tags.name || '').toLowerCase();
//   const hindiName = (tags['name:hi'] || '').toLowerCase();

//   if (name === lowerQuery || hindiName === lowerQuery) score = 0.95;
//   else if (name.startsWith(lowerQuery) || hindiName.startsWith(lowerQuery)) score = 0.85;
//   else if (name.includes(lowerQuery) || hindiName.includes(lowerQuery)) score = 0.7;

//   // Boost based on place importance
//   const place = tags.place || '';
//   if (place === 'city') score += 0.25;
//   else if (place === 'town') score += 0.2;
//   else if (place === 'village') score += 0.15;
//   else if (place === 'suburb') score += 0.1;

//   return Math.min(score, 1.0);
// };

// const extractIndianAddress = (tags: any): any => {
//   return {
//     city: tags.city || tags['addr:city'],
//     state: tags.state || tags['addr:state'],
//     district: tags.district || tags['addr:district'],
//     postcode: tags.postcode || tags['addr:postcode'],
//     country: 'India',
//   };
// };

// // Enhanced caching with Indian location optimization
// const cache = new Map<string, { data: NominatimResult[]; timestamp: number }>();
// const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for better caching

// const getCached = (key: string): NominatimResult[] | null => {
//   const cached = cache.get(key);
//   if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
//     return cached.data;
//   }
//   cache.delete(key);
//   return null;
// };

// const setCache = (key: string, data: NominatimResult[]): void => {
//   cache.set(key, { data, timestamp: Date.now() });

//   // Clean old entries
//   if (cache.size > 200) {
//     const entries = Array.from(cache.entries());
//     entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
//     entries.slice(0, 50).forEach(([key]) => cache.delete(key));
//   }
// };

// export function useLocationSearch({
//   value,
//   onResultSelect,
//   debounceMs = 600,
//   minQueryLength = 2,
//   maxResults = 15,
// }: UseLocationSearchProps) {
//   const [results, setResults] = useState<NominatimResult[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const abortControllerRef = useRef<AbortController | null>(null);
//   const timeoutRef = useRef<NodeJS.Timeout | null>(null);

//   const searchIndianLocations = useCallback(
//     async (query: string) => {
//       if (query.length < minQueryLength) {
//         setResults([]);
//         setLoading(false);
//         return;
//       }

//       // Check cache first
//       const cacheKey = `india:${query.toLowerCase()}`;
//       const cached = getCached(cacheKey);
//       if (cached) {
//         setResults(cached.slice(0, maxResults));
//         setLoading(false);
//         return;
//       }

//       // Cancel previous request
//       if (abortControllerRef.current) {
//         abortControllerRef.current.abort();
//       }

//       abortControllerRef.current = new AbortController();
//       setLoading(true);
//       setError(null);

//       const allResults = new Map<string, NominatimResult>();
//       const services = [
//         { name: 'nominatim', fetch: fetchNominatimIndia, weight: 1.0 },
//         { name: 'photon', fetch: fetchPhotonIndia, weight: 0.9 },
//         { name: 'overpass', fetch: fetchOverpassIndia, weight: 0.8 },
//       ];

//       // Try all services in parallel for better coverage
//       const promises = services.map(async (service) => {
//         try {
//           const data = await service.fetch(query, { limit: 8 });
//           return { service: service.name, data, weight: service.weight };
//         } catch (error) {
//           console.warn(`${service.name} failed:`, error);
//           return { service: service.name, data: [], weight: service.weight };
//         }
//       });

//       try {
//         const serviceResults = await Promise.allSettled(promises);

//         serviceResults.forEach((result) => {
//           if (result.status === 'fulfilled' && result.value.data.length > 0) {
//             result.value.data.forEach((item: NominatimResult) => {
//               const key = `${parseFloat(item.lat).toFixed(4)},${parseFloat(item.lon).toFixed(4)}`;

//               if (!allResults.has(key)) {
//                 // Adjust importance based on service weight
//                 const adjustedItem = {
//                   ...item,
//                   importance: (item.importance || 0.5) * result.value.weight,
//                 };
//                 allResults.set(key, adjustedItem);
//               }
//             });
//           }
//         });

//         // Sort by relevance and limit results
//         const sortedResults = Array.from(allResults.values())
//           .sort((a, b) => (b.importance || 0) - (a.importance || 0))
//           .slice(0, maxResults);

//         setResults(sortedResults);
//         setCache(cacheKey, sortedResults);

//         if (sortedResults.length === 0) {
//           setError('No locations found. Try a different search term.');
//         }
//       } catch (err) {
//         setError('Unable to search locations. Please try again.');
//         setResults([]);
//       } finally {
//         setLoading(false);
//       }
//     },
//     [minQueryLength, maxResults],
//   );

//   useEffect(() => {
//     // Clear previous timeout
//     if (timeoutRef.current) {
//       clearTimeout(timeoutRef.current);
//     }

//     if (!value?.trim()) {
//       setResults([]);
//       setLoading(false);
//       setError(null);
//       return;
//     }

//     setLoading(value.length >= minQueryLength);

//     // Debounce the search
//     timeoutRef.current = setTimeout(() => {
//       searchIndianLocations(value.trim());
//     }, debounceMs);

//     return () => {
//       if (timeoutRef.current) {
//         clearTimeout(timeoutRef.current);
//       }
//       if (abortControllerRef.current) {
//         abortControllerRef.current.abort();
//       }
//     };
//   }, [value, searchIndianLocations, debounceMs, minQueryLength]);

//   const handleSelect = useCallback(
//     (item: NominatimResult) => {
//       onResultSelect?.(item);
//     },
//     [onResultSelect],
//   );

//   const clearResults = useCallback(() => {
//     setResults([]);
//     setError(null);
//   }, []);

//   const retry = useCallback(() => {
//     if (value?.trim()) {
//       // Clear cache for this query and retry
//       const cacheKey = `india:${value.toLowerCase()}`;
//       cache.delete(cacheKey);
//       searchIndianLocations(value.trim());
//     }
//   }, [value, searchIndianLocations]);

//   return {
//     results,
//     loading,
//     error,
//     handleSelect,
//     clearResults,
//     retry,
//   };
// }
