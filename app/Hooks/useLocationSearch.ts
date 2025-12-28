import { NominatimResult } from '@Types/Interface';
import { searchLocationsMultiProvider, LocationSearchOptions } from '@Utils/locationSearchUtils';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseLocationSearchProps {
  value: string;
  debounceMs?: number;
  minQueryLength?: number;
  maxResults?: number;
  language?: string;
  countryCode?: string;
}

interface UseLocationSearchReturn {
  results: NominatimResult[];
  loading: boolean;
  error: string | null;
  clearResults: () => void;
  retry: () => void;
}

export function useLocationSearch({
  value,
  debounceMs = 600,
  minQueryLength = 2,
  maxResults = 10,
  language = 'en',
  countryCode,
}: UseLocationSearchProps): UseLocationSearchReturn {
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef(false);

  const search = useCallback(
    async (query: string) => {
      if (query.length < minQueryLength) {
        setResults([]);
        setLoading(false);
        return;
      }

      abortRef.current = false;
      setLoading(true);
      setError(null);

      try {
        const options: LocationSearchOptions = {
          limit: maxResults,
          language,
          countryCode,
        };

        const data = await searchLocationsMultiProvider(query, options);

        if (abortRef.current) return;

        setResults(data);
        if (data.length === 0) {
          setError('No locations found');
        }
      } catch (err) {
        if (!abortRef.current) {
          setError('Unable to search locations');
          setResults([]);
        }
      } finally {
        if (!abortRef.current) {
          setLoading(false);
        }
      }
    },
    [minQueryLength, maxResults, language, countryCode],
  );

  useEffect(() => {
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

    timeoutRef.current = setTimeout(() => {
      search(value.trim());
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      abortRef.current = true;
    };
  }, [value, search, debounceMs, minQueryLength]);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  const retry = useCallback(() => {
    if (value?.trim()) {
      search(value.trim());
    }
  }, [value, search]);

  return { results, loading, error, clearResults, retry };
}
