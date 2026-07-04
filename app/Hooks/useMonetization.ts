import { MonetizationContext } from '@Contexts/MonetizationProvider';
import { useContext } from 'react';

export const useMonetization = () => {
  const context = useContext(MonetizationContext);

  if (!context) {
    throw new Error('useMonetization must be used within a MonetizationProvider.');
  }

  return context;
};
