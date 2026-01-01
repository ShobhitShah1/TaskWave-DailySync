import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from './ThemeProvider';

// ============================================================================
// Constants
// ============================================================================
const SETTINGS_KEYS = {
  LOCATION_RADIUS: 'settings_location_radius',
} as const;

export const DEFAULT_LOCATION_RADIUS = 100; // Default 100 meters
export const MIN_LOCATION_RADIUS = 50; // Minimum 50 meters
export const MAX_LOCATION_RADIUS = 5000; // Maximum 5 kilometers

// Predefined radius options for the picker
export const RADIUS_OPTIONS = [
  { label: '50m', value: 50 },
  { label: '100m', value: 100 },
  { label: '200m', value: 200 },
  { label: '300m', value: 300 },
  { label: '500m', value: 500 },
  { label: '1km', value: 1000 },
  { label: '2km', value: 2000 },
  { label: '5km', value: 5000 },
];

// ============================================================================
// Types
// ============================================================================
interface SettingsContextType {
  locationRadius: number;
  setLocationRadius: (radius: number) => void;
}

interface SettingsProviderProps {
  children: ReactNode;
}

// ============================================================================
// Context
// ============================================================================
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================
export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [locationRadius, setLocationRadiusState] = useState<number>(() => {
    try {
      const stored = storage.getNumber(SETTINGS_KEYS.LOCATION_RADIUS);
      return stored ?? DEFAULT_LOCATION_RADIUS;
    } catch {
      return DEFAULT_LOCATION_RADIUS;
    }
  });

  const setLocationRadius = (radius: number) => {
    // Clamp the value between min and max
    const clampedRadius = Math.max(MIN_LOCATION_RADIUS, Math.min(MAX_LOCATION_RADIUS, radius));
    try {
      storage.set(SETTINGS_KEYS.LOCATION_RADIUS, clampedRadius);
      setLocationRadiusState(clampedRadius);
    } catch (error) {
      console.error('Error saving location radius setting:', error);
    }
  };

  const contextValue: SettingsContextType = {
    locationRadius,
    setLocationRadius,
  };

  return <SettingsContext.Provider value={contextValue}>{children}</SettingsContext.Provider>;
};

// ============================================================================
// Hook
// ============================================================================
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// ============================================================================
// Utility function to get radius without hook (for services)
// ============================================================================
export const getStoredLocationRadius = (): number => {
  try {
    const stored = storage.getNumber(SETTINGS_KEYS.LOCATION_RADIUS);
    return stored ?? DEFAULT_LOCATION_RADIUS;
  } catch {
    return DEFAULT_LOCATION_RADIUS;
  }
};

export default SettingsProvider;
