import * as SystemUI from "expo-system-ui";
import React, { createContext, useContext, useEffect, useState } from "react";
import { MMKV } from "react-native-mmkv";
import {
  AppContextProps,
  AppContextType,
  Theme,
  ViewMode,
} from "../Types/Interface";

export const storage = new MMKV();

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<AppContextProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>("dark");
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const storedViewMode = storage.getString("viewMode");
    return (storedViewMode as ViewMode) || "list";
  });

  useEffect(() => {
    // setThemeBasedOnTime();
    storeViewMode();
    storeTheme();
  }, []);

  // useEffect(() => {
  //   const unSubscribe = AppState.addEventListener("change", (nextAppState) => {
  //     if (nextAppState === "active") {
  //       setThemeBasedOnTime();
  //     }
  //   });

  //   return () => unSubscribe.remove();
  // }, []);

  // const setThemeBasedOnTime = () => {
  //   const currentHour = new Date().getHours();

  //   const currentTheme: Theme =
  //     currentHour >= 6 && currentHour < 18 ? "light" : "dark";
  //   setTheme(currentTheme);

  //   storage.set("themeMode", currentTheme);
  // };

  const storeTheme = async () => {
    try {
      const storedTheme = storage.getString("themeMode");
      const MyTheme: Theme = (storedTheme as Theme) || "light";
      await SystemUI.setBackgroundColorAsync(
        MyTheme === "light" ? "#ffffff" : "#303334"
      );
      setTheme(MyTheme);
    } catch (error: any) {
      throw new Error("Error storing theme mode: " + error.message);
    }
  };

  const storeViewMode = () => {
    try {
      const storedViewMode = storage.getString("viewMode");
      if (storedViewMode) {
        setViewMode(storedViewMode as ViewMode);
      }
    } catch (error: any) {
      throw new Error("Error storing view mode: " + error?.message);
    }
  };

  const toggleViewMode = async (newMode: ViewMode) => {
    try {
      storage.set("viewMode", newMode);
      setViewMode(newMode);
    } catch (error: any) {
      throw new Error("Error storing view mode: " + error?.message);
    }
  };

  const toggleTheme = async (newTheme: Theme) => {
    try {
      storage.set("themeMode", newTheme);
      storeTheme();
    } catch (error: any) {
      throw new Error("Error storing theme mode: " + error?.message);
    }
  };

  const contextValue: AppContextType = {
    theme,
    toggleTheme,
    viewMode,
    toggleViewMode,
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
