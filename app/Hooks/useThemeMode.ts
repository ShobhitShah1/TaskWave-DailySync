import { DarkThemeColors, LightThemeColors } from '@Constants/Theme';
import { useAppContext } from '@Contexts/ThemeProvider';

const useThemeColors = () => {
  const { theme } = useAppContext();

  return theme === 'light' ? LightThemeColors : DarkThemeColors;
};

export default useThemeColors;
