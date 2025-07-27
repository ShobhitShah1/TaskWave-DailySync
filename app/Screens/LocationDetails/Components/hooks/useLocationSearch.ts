import { NominatimResult } from '@Types/Interface';
import { useEffect, useState, useCallback } from 'react';
import { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface UseLocationSearchProps {
  value: string;
  onResultSelect?: (result: NominatimResult) => void;
}

const fetchNominatim = async (query: string): Promise<NominatimResult[]> => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Nominatim blocked or returned non-JSON');
  }
};

const fetchPhoton = async (query: string): Promise<NominatimResult[]> => {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  const data = await res.json();
  return (data.features || []).map((f: any) => ({
    display_name: [f.properties.name, f.properties.city, f.properties.country]
      .filter(Boolean)
      .join(', '),
    lat: f.geometry.coordinates[1].toString(),
    lon: f.geometry.coordinates[0].toString(),
  }));
};

export function useLocationSearch({ value, onResultSelect }: UseLocationSearchProps) {
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const dropdownAnim = useSharedValue(0);

  useEffect(() => {
    // if (value.length < 3) {
    //   setResults([]);
    //   setShowResults(false);
    //   dropdownAnim.value = withTiming(0, { duration: 120 });
    //   return;
    // }

    setLoading(true);

    const timeout = setTimeout(() => {
      (async () => {
        try {
          let data = await fetchNominatim(value);
          setResults(data);
          setShowResults(true);
        } catch (e) {
          try {
            let data = await fetchPhoton(value);
            setResults(data);
            setShowResults(true);
          } catch (err) {
            setResults([]);
            setShowResults(false);
          }
        } finally {
          setLoading(false);
        }
      })();
    }, 1200);
    return () => clearTimeout(timeout);
  }, [value]);

  useEffect(() => {
    if (showResults && (results.length > 0 || loading)) {
      dropdownAnim.value = withTiming(1, { duration: 180 });
    } else {
      dropdownAnim.value = withTiming(0, { duration: 120 });
    }
  }, [showResults, results.length, loading]);

  const handleSelect = useCallback(
    (item: NominatimResult) => {
      setShowResults(false);
      onResultSelect && onResultSelect(item);
    },
    [onResultSelect],
  );

  const dropdownAnimStyle = useAnimatedStyle(() => ({
    opacity: dropdownAnim.value,
    transform: [{ scaleY: 0.95 + 0.05 * dropdownAnim.value }],
  }));

  return { results, loading, showResults, dropdownAnimStyle, handleSelect };
}
