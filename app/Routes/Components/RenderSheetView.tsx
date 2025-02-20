import { StatusBar } from "expo-status-bar";
import React, { memo } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SequencedTransition,
} from "react-native-reanimated";
import { useAppContext } from "../../Contexts/ThemeProvider";
import useThemeColors from "../../Hooks/useThemeMode";
import { RenderSheetViewProps } from "../../Types/Interface";
import { getCategories } from "../../Utils/getCategories";
import RenderCategoryItem from "./RenderCategoryItem";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ITEM_WIDTH = SCREEN_WIDTH / 2 - 24;

const RenderSheetView = ({
  categories,
  onCategoryClick,
  selectedCategory,
  setSelectedCategory,
}: RenderSheetViewProps) => {
  const { theme } = useAppContext();
  const colors = useThemeColors();

  const initialCategories = getCategories(colors);

  const createRows = (items: any) => {
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
  };

  const rows = createRows(categories);

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor={colors.background}
        style={theme === "dark" ? "light" : "dark"}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.contentContainerStyle}
      >
        {initialCategories?.map((res) => {
          const isSelected = res.type === selectedCategory;

          return (
            <Pressable
              onPress={() => {
                onCategoryClick(res, true);
                setSelectedCategory(res.type);
              }}
              key={res.id}
              style={[
                styles.sheetSuggestionImageView,
                {
                  opacity:
                    (theme === "dark" && isSelected) || theme === "light"
                      ? 1
                      : 0.5,
                },
              ]}
            >
              <Animated.Image
                entering={FadeIn.delay(100 * res.id)}
                resizeMode="contain"
                fadeDuration={300}
                source={isSelected ? res.glowIcon : res.icon}
                style={[
                  styles.sheetSuggestionImage,
                  {
                    width: isSelected ? "160%" : "155%",
                    height: isSelected ? "160%" : "155%",
                    overflow: "visible",
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.gridContainer}>
        {rows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {row.map((item, itemIndex) =>
              item ? (
                <Animated.View
                  key={item?.id?.toString()}
                  layout={SequencedTransition}
                  exiting={FadeOut}
                  style={styles.itemContainer}
                >
                  <RenderCategoryItem
                    item={item}
                    index={itemIndex}
                    onCategoryClick={(category) =>
                      onCategoryClick(category, false)
                    }
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                  />
                </Animated.View>
              ) : (
                <Animated.View
                  key={`empty-${rowIndex}-${itemIndex}`}
                  style={styles.emptyItem}
                  layout={SequencedTransition}
                />
              )
            )}
          </View>
        ))}
      </View>
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
    columnGap: 13,
    paddingTop: 5,
    paddingBottom: 15,
    alignItems: "center",
    justifyContent: "center",
    alignContent: "center",
  },
  sheetSuggestionImageView: {
    width: 35,
    height: 35,
    elevation: 5,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    borderRadius: 500,
    justifyContent: "center",
    overflow: "visible",
  },
  sheetSuggestionImage: {
    alignSelf: "center",
  },
  gridContainer: {
    paddingTop: 10,
    paddingBottom: 90,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    width: "100%",
  },
  itemContainer: {
    width: ITEM_WIDTH,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    overflow: "hidden",
  },
  emptyItem: {
    width: ITEM_WIDTH,
  },
});
