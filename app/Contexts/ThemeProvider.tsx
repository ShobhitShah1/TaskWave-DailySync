import { MMKV } from "react-native-mmkv";
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

interface AppContextProps {
  children: ReactNode;
}

type Theme = "light" | "dark";

interface AppContextType {
  theme: Theme;
  toggleTheme: (newTheme: Theme) => void;
}

export const storage = new MMKV();

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<AppContextProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    storeTheme();
  }, []);

  const storeTheme = async () => {
    try {
      const storedTheme = storage.getString("themeMode");
      const MyTheme: Theme = (storedTheme as Theme) || "light";
      setTheme(MyTheme);
    } catch (error: any) {
      throw new Error("Error storing theme mode: " + error.message);
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

  const contextValue: AppContextType = { theme, toggleTheme };

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
