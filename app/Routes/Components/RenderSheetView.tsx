import { useAppContext } from '@Contexts/ThemeProvider';
import useThemeColors from '@Hooks/useThemeMode';
import {
  NotificationCategory,
  NotificationType,
  RenderSheetViewProps,
  remindersCategoriesType,
} from '@Types/Interface';
import { getCategories } from '@Utils/getCategories';
import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Dimensions, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import RenderCategoryItem from './RenderCategoryItem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = SCREEN_WIDTH / 2 - 22;
const ITEM_GAP = 12;

const smoothLayout = LinearTransition.springify();

const RenderSheetView = ({
  categories,
  onCategoryClick,
  selectedCategory,
  setSelectedCategory,
}: RenderSheetViewProps) => {
  const { theme } = useAppContext();
  const colors = useThemeColors();
  const [sortedCategories, setSortedCategories] = useState<NotificationCategory[]>(categories);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousSelectedRef = useRef<NotificationType | null>(selectedCategory);

  const initialCategories = useMemo(() => getCategories(colors), [colors]);

  const shiftToTop = useCallback(
    (selectedType: NotificationType) => {
      if (isAnimating || previousSelectedRef.current === selectedType) return;

      setIsAnimating(true);
      previousSelectedRef.current = selectedType;

      const selectedItems = categories.filter((cat) => cat.type === selectedType);
      const otherItems = categories.filter((cat) => cat.type !== selectedType);
      setSortedCategories([...selectedItems, ...otherItems]);

      setTimeout(() => setIsAnimating(false), 500);
    },
    [categories, isAnimating],
  );

  const handleTopCategoryClick = useCallback(
    (category: NotificationCategory) => {
      if (isAnimating) return;

      if (category.type !== selectedCategory) {
        shiftToTop(category.type);
      }
      onCategoryClick(category as remindersCategoriesType, true);
      setSelectedCategory(category.type);
    },
    [shiftToTop, onCategoryClick, setSelectedCategory, selectedCategory, isAnimating],
  );

  const handleGridCategoryClick = useCallback(
    (category: remindersCategoriesType) => {
      if (isAnimating) return;
      onCategoryClick(category, false);
    },
    [onCategoryClick, isAnimating],
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.contentContainerStyle}
      >
        {initialCategories.map((item) => {
          const isSelected = item.type === selectedCategory;
          return (
            <Pressable
              key={item.id}
              onPress={() => handleTopCategoryClick(item)}
              style={[
                styles.sheetSuggestionImageView,
                {
                  opacity: (theme === 'dark' && isSelected) || theme === 'light' ? 1 : 0.5,
                },
              ]}
              disabled={isAnimating}
            >
              <Image
                resizeMode="contain"
                source={item.glowIcon}
                style={[
                  styles.sheetSuggestionImage,
                  {
                    width: isSelected ? '160%' : '155%',
                    height: isSelected ? '160%' : '155%',
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </ScrollView>

      <Animated.View style={styles.gridContainer} layout={smoothLayout}>
        {sortedCategories.map((item, index) => (
          <Animated.View key={item.id} style={styles.itemContainer} layout={smoothLayout}>
            <RenderCategoryItem
              item={item as remindersCategoriesType}
              index={index}
              onCategoryClick={handleGridCategoryClick}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />
          </Animated.View>
        ))}
      </Animated.View>
    </View>
  );
};

export default memo(RenderSheetView);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainerStyle: {
    flexGrow: 1,
    columnGap: 8,
    paddingTop: 5,
    paddingBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
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
    overflow: 'visible',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 20,
    gap: ITEM_GAP,
  },
  itemContainer: {
    width: ITEM_WIDTH,
    marginBottom: 3,
  },
});
