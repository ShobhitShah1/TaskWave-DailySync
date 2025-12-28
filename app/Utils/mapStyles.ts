import darkMapStyle from '@Constants/map-style-dark.json';
import lightMapStyle from '@Constants/map-style-light.json';

// Both themes use custom styles matching app colors
// No more yellow roads - clean white/gray roads with blue motorways

export type MapTheme = 'light' | 'dark';

export const getMapStyleUrl = (theme: 'light' | 'dark'): object => {
  return theme === 'dark' ? darkMapStyle : lightMapStyle;
};
