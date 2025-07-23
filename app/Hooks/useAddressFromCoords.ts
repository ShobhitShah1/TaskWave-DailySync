import { GeoLatLng } from '@Types/Interface';
import { getAddressFromCoords, AddressDetails } from '@Utils/geoUtils';
import { useEffect, useState } from 'react';

export function useAddressFromCoords(coords: GeoLatLng | null) {
  const [addressDetails, setAddressDetails] = useState<AddressDetails>({ address: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetch = async () => {
      if (coords) {
        setLoading(true);
        const details = await getAddressFromCoords(coords.latitude, coords.longitude);

        if (isMounted) {
          setAddressDetails(details);
        }
        setLoading(false);
      } else {
        setAddressDetails({ address: '' });
        setLoading(false);
      }
    };

    fetch();

    return () => {
      isMounted = false;
    };
  }, [coords]);

  return { addressDetails, address: addressDetails?.address || '', loading };
}
