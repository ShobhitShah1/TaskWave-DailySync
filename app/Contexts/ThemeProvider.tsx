/* eslint-disable @typescript-eslint/no-explicit-any */
import { setStatusBarStyle } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { MMKV } from 'react-native-mmkv';

import { AppContextProps, AppContextType, Theme, ViewMode } from '../Types/Interface';

export const storage = new MMKV();

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<AppContextProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const storedViewMode = storage.getString('viewMode');
    return (storedViewMode as ViewMode) || 'list';
  });

  useEffect(() => {
    storeViewMode();
    storeTheme();
  }, []);

  const storeTheme = async () => {
    try {
      const storedTheme = storage.getString('themeMode');
      const MyTheme: Theme = (storedTheme as Theme) || 'dark';
      setTheme(MyTheme);
    } catch (error: any) {
      throw new Error('Error storing theme mode: ' + error.message);
    }
  };

  const storeViewMode = () => {
    try {
      const storedViewMode = storage.getString('viewMode');
      if (storedViewMode) {
        setViewMode(storedViewMode as ViewMode);
      }
    } catch (error: any) {
      throw new Error('Error storing view mode: ' + error?.message);
    }
  };

  const toggleViewMode = async (newMode: ViewMode) => {
    try {
      storage.set('viewMode', newMode);
      setViewMode(newMode);
    } catch (error: any) {
      throw new Error('Error storing view mode: ' + error?.message);
    }
  };

  const toggleTheme = async (newTheme: Theme) => {
    try {
      storage.set('themeMode', newTheme);
      storeTheme();

      setStatusBarStyle(newTheme === 'dark' ? 'light' : 'dark');
      SystemUI.setBackgroundColorAsync(newTheme === 'dark' ? '#303334' : '#ffffff');
    } catch (error: any) {
      throw new Error('Error storing theme mode: ' + error?.message);
    }
  };

  const contextValue: AppContextType = {
    theme,
    toggleTheme,
    viewMode,
    toggleViewMode,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
