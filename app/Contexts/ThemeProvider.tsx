import { setStatusBarStyle } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { MMKV } from 'react-native-mmkv';

import { AppContextProps, AppContextType, Theme, ViewMode } from '@Types/Interface';

export const storage = new MMKV();

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const updateStatusBarAndSystemUI = (currentTheme: Theme) => {
  try {
    // Set status bar style based on theme
    setStatusBarStyle(currentTheme === 'dark' ? 'light' : 'dark');

    // Set system UI background color based on theme
    const backgroundColor = currentTheme === 'dark' ? '#303334' : '#ffffff';
    SystemUI.setBackgroundColorAsync(backgroundColor);
  } catch (error) {
    console.error('Error updating status bar and system UI:', error);
  }
};

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

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // App came to foreground, update status bar and system UI
        updateStatusBarAndSystemUI(theme);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [theme]);

  const storeTheme = async () => {
    try {
      const storedTheme = storage.getString('themeMode');
      const MyTheme: Theme = (storedTheme as Theme) || 'dark';
      setTheme(MyTheme);
      // Update status bar and system UI when theme is loaded
      updateStatusBarAndSystemUI(MyTheme);
    } catch (error) {
      console.error('Error storing theme mode:', error);
    }
  };

  const storeViewMode = () => {
    try {
      const storedViewMode = storage.getString('viewMode');
      if (storedViewMode) {
        setViewMode(storedViewMode as ViewMode);
      }
    } catch (error) {
      console.error('Error storing view mode:', error);
    }
  };

  const toggleViewMode = async (newMode: ViewMode) => {
    try {
      storage.set('viewMode', newMode);
      setViewMode(newMode);
    } catch (error) {
      console.error('Error storing view mode:', error);
    }
  };

  const toggleTheme = async (newTheme: Theme) => {
    try {
      storage.set('themeMode', newTheme);
      setTheme(newTheme);

      // Update status bar and system UI immediately when theme changes
      updateStatusBarAndSystemUI(newTheme);
    } catch (error) {
      console.error('Error storing theme mode:', error);
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
