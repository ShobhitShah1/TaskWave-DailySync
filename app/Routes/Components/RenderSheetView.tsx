import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { useAppContext } from '@Contexts/ThemeProvider';
import { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import useThemeColors from '@Hooks/useThemeMode';
import { NotificationType, RenderSheetViewProps } from '@Types/Interface';
import { getCategories } from '@Utils/getCategories';
import RenderCategoryItem from './RenderCategoryItem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = SCREEN_WIDTH / 2 - 24;

const RenderSheetView = ({
  categories,
  onCategoryClick,
  selectedCategory,
  setSelectedCategory,
}: RenderSheetViewProps) => {
  const { theme } = useAppContext();
  const colors = useThemeColors();
  const [sortedCategories, setSortedCategories] = useState(categories);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousSelectedRef = useRef(selectedCategory);

  const initialCategories = getCategories(colors);

  // Improved shift to top function with animation control
  const shiftToTop = useCallback(
    (selectedType: string) => {
      if (isAnimating || previousSelectedRef.current === selectedType) return;

      setIsAnimating(true);

      // Delay the state update to allow for smoother animation
      setTimeout(() => {
        const selectedItems = categories.filter((cat) => cat.type === selectedType);
        const otherItems = categories.filter((cat) => cat.type !== selectedType);

        const newOrder = [...selectedItems, ...otherItems];
        setSortedCategories(newOrder);
        previousSelectedRef.current = selectedType as NotificationType;

        // Reset animation flag after layout settles
        setTimeout(() => setIsAnimating(false), 300);
      }, 50);
    },
    [categories, isAnimating],
  );

  // Handle category click with debouncing
  const handleCategoryClick = useCallback(
    (category: any, isTopCategory: boolean) => {
      if (isAnimating) return;

      if (isTopCategory && category.type !== selectedCategory) {
        shiftToTop(category.type);
      }
      onCategoryClick(category, isTopCategory);
      setSelectedCategory(category.type);
    },
    [shiftToTop, onCategoryClick, setSelectedCategory, selectedCategory, isAnimating],
  );

  // Create rows for grid layout with stable keys
  const createRows = useCallback((items: any[]) => {
    const rows = [];
    for (let i = 0; i < items.length; i += 2) {
      const row = [items[i]];
      if (i + 1 < items.length) {
        row.push(items[i + 1]);
      } else {
        row.push(null);
      }
      rows.push(row);
    }
    return rows;
  }, []);

  const rows = useMemo(() => createRows(sortedCategories), [sortedCategories, createRows]);

  return (
    <BottomSheetView style={styles.container}>
      {/* Top Category Selection */}
      <BottomSheetScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.contentContainerStyle}
      >
        {initialCategories?.map((res, index) => {
          const isSelected = res.type === selectedCategory;

          return (
            <Pressable
              onPress={() => handleCategoryClick(res, true)}
              key={res.id}
              style={[
                styles.sheetSuggestionImageView,
                {
                  opacity: (theme === 'dark' && isSelected) || theme === 'light' ? 1 : 0.5,
                },
              ]}
              disabled={isAnimating}
            >
              <Animated.Image
                entering={FadeIn.delay(100 * index)}
                resizeMode="contain"
                fadeDuration={300}
                source={isSelected ? res.glowIcon : res.icon}
                style={[
                  styles.sheetSuggestionImage,
                  {
                    width: isSelected ? '160%' : '155%',
                    height: isSelected ? '160%' : '155%',
                    overflow: 'visible',
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </BottomSheetScrollView>

      {/* Grid Container */}
      <BottomSheetView style={styles.gridContainer}>
        {rows.map((row, rowIndex) => (
          <BottomSheetView key={`row-${rowIndex}`} style={styles.row}>
            {row.map((item, itemIndex) =>
              item ? (
                <Animated.View
                  key={`${item?.id} + ${itemIndex}`}
                  layout={LinearTransition.springify().damping(15).stiffness(100)}
                  style={styles.itemContainer}
                >
                  <RenderCategoryItem
                    item={item}
                    index={itemIndex}
                    onCategoryClick={(category) => handleCategoryClick(category, false)}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                  />
                </Animated.View>
              ) : (
                <View key={`empty-${rowIndex}-${itemIndex}`} style={styles.emptyItem} />
              ),
            )}
          </BottomSheetView>
        ))}
      </BottomSheetView>
    </BottomSheetView>
  );
};

export default memo(RenderSheetView);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainerStyle: {
    flexGrow: 1,
    columnGap: 13,
    paddingTop: 5,
    paddingBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    alignContent: 'center',
  },
  sheetSuggestionImageView: {
    width: 35,
    height: 35,
    elevation: 5,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    borderRadius: 500,
    justifyContent: 'center',
    overflow: 'visible',
  },
  sheetSuggestionImage: {
    alignSelf: 'center',
  },
  gridContainer: {
    paddingTop: 10,
    paddingBottom: 90,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    width: '100%',
  },
  itemContainer: {
    width: ITEM_WIDTH,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  emptyItem: {
    width: ITEM_WIDTH,
  },
});
