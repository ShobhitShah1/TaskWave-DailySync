import React, { FC, memo, useCallback, useMemo } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';

import AssetsPath from '@Constants/AssetsPath';
import { useAppContext } from '@Contexts/ThemeProvider';
import useNotificationIconColors from '@Hooks/useNotificationIconColors';
import useThemeColors from '@Hooks/useThemeMode';
import { headerInterface, NotificationType } from '@Types/Interface';
import { getCategories } from '@Utils/getCategories';
import styles from '../styles';
import { FilterButton } from './FilterButton';

const RenderHeaderView: FC<headerInterface> = ({
  selectedFilter,
  setSelectedFilter,
  notificationsState,
  setFullScreenPreview,
}) => {
  const style = styles();
  const colors = useThemeColors();
  const { theme } = useAppContext();
  const initialCategories = getCategories(colors);

  const handleSelectFilter = useCallback(
    (filter: NotificationType) => setSelectedFilter(filter),
    [setSelectedFilter],
  );

  const handleFullScreenPreview = useCallback(() => {
    if (notificationsState.allByDate.length > 0) {
      setFullScreenPreview(true);
    }
  }, [notificationsState, setFullScreenPreview]);

  const selectedColor = useMemo(
    () => (selectedFilter === 'all' ? colors.text : colors.grayTitle),
    [selectedFilter, theme],
  );

  return (
    <View style={style.renderHeaderContainer}>
      <View style={style.renderHeaderTitleView}>
        <Text style={style.headerScheduleText}>Schedule</Text>
      </View>

      <View style={style.renderHeaderListContainer}>
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={style.categoryFlatListContainContainer}
          >
            <Pressable
              hitSlop={4}
              style={[style.filterAllBtn, { backgroundColor: colors.background }]}
              onPress={() => setSelectedFilter('all')}
            >
              <Text style={[style.filterAllText, { color: selectedColor }]}>All</Text>
            </Pressable>

            {initialCategories.map((res) => {
              const getColor = useNotificationIconColors(res.type as NotificationType);
              return (
                <FilterButton
                  data={res}
                  key={res.id}
                  selectedFilter={selectedFilter}
                  onPress={() => handleSelectFilter(res.type as NotificationType)}
                  backgroundColor={getColor?.backgroundColor || ''}
                />
              );
            })}
          </ScrollView>
        </View>
        <Pressable hitSlop={4} style={style.fullscreenButton} onPress={handleFullScreenPreview}>
          <Image
            resizeMode="contain"
            tintColor={theme === 'light' ? colors.sms : colors.text}
            source={AssetsPath.ic_fullScreen}
            style={style.fullScreenIcon}
          />
        </Pressable>
      </View>
    </View>
  );
};

export default memo(RenderHeaderView);
