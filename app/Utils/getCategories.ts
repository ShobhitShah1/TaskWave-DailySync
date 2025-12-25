import { categoriesConfig } from '@Constants/CategoryConfig';
import { LightThemeColors } from '@Constants/Theme';

export const getCategories = (colors: typeof LightThemeColors, theme: 'light' | 'dark') =>
  categoriesConfig(colors, theme);
