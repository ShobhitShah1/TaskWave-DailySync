import { GeoLatLng } from '@Types/Interface';
import { getAddressFromCoords, AddressDetails } from '@Utils/geoUtils';
import { useEffect, useMemo, useState } from 'react';

export function useAddressFromCoords(coords: GeoLatLng | null) {
  const [addressDetails, setAddressDetails] = useState<AddressDetails>({
    address: '',
    area: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetch = async () => {
      if (coords) {
        setLoading(true);
        try {
          const details = await getAddressFromCoords(coords.latitude, coords.longitude);
          if (isMounted && details) {
            setAddressDetails({
              address: details.address || '',
              area: details.area || '',
              city: details.city || '',
              state: details.state || '',
              country: details.country || '',
              postalCode: details.postalCode || '',
            });
          }
        } catch (err) {
          console.error('Error fetching address:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setAddressDetails({
          address: '',
          area: '',
          city: '',
          state: '',
          country: '',
          postalCode: '',
        });
        setLoading(false);
      }
    };

    fetch();

    return () => {
      isMounted = false;
    };
  }, [coords]);

  const formattedAddress = useMemo(() => {
    return addressDetails?.address?.trim() || '';
  }, [addressDetails]);

  const locationLabel = useMemo(() => {
    return (
      [addressDetails?.area, addressDetails?.city, addressDetails?.state, addressDetails?.country]
        .filter(Boolean)
        .join(', ') || ''
    );
  }, [addressDetails]);

  const shortLocationLabel = useMemo(() => {
    const { area, city, state, country } = addressDetails;

    // Try to keep it within 2 parts, prefer city + state or area + city
    if (area && city) return `${area}, ${city}`;
    if (city && state) return `${city}, ${state}`;
    if (state && country) return `${state}, ${country}`;
    if (city) return city;
    if (state) return state;
    if (country) return country;

    return '';
  }, [addressDetails]);

  return {
    addressDetails,
    address: addressDetails?.address || '',
    loading,
    formattedAddress,
    locationLabel,
    shortLocationLabel,
  };
}
