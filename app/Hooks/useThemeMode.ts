import { useAppContext } from "../Contexts/ThemeProvider";
import { DarkThemeColors, LightThemeColors } from "../Constants/Theme";

const useThemeColors = () => {
  const { theme } = useAppContext();

  return theme === "light" ? LightThemeColors : DarkThemeColors;
};

export default useThemeColors;
