import { useMemo } from 'react';

import { categoriesConfig } from '@Constants/CategoryConfig';
import { NotificationColor } from '@Types/Interface';
import useThemeColors from './useThemeMode';

const useNotificationIconColors = (notificationType: string): NotificationColor => {
  const colors = useThemeColors();

  const colorMap = useMemo(() => {
    const config = categoriesConfig(colors);
    return config.reduce<Record<string, NotificationColor>>((map, category) => {
      map[category.type] = {
        backgroundColor: category.color.background,
        typeColor: category.color.primary,
        iconColor: category.color.dark,
        createViewColor:
          category?.type === 'gmail'
            ? category.color.lightDark || category.color.background
            : category.color.primary,
        icon: category.icon,
        history_icon: category.history_icon,
      };
      return map;
    }, {});
  }, [colors]);

  if (!colorMap[notificationType]) {
    throw new Error(`No color configuration found for notification type: ${notificationType}`);
  }

  return colorMap[notificationType];
};

export default useNotificationIconColors;
