import { StatusBar } from "expo-status-bar";
import React, { memo } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import { useAppContext } from "../../Contexts/ThemeProvider";
import useNotificationIconColors from "../../Hooks/useNotificationIconColors";
import useThemeColors from "../../Hooks/useThemeMode";
import {
  NotificationCategory,
  NotificationType,
  remindersCategoriesType,
} from "../../Types/Interface";
import { getCategories } from "../../Utils/getCategories";
import RenderCategoryItem from "./RenderCategoryItem";

interface RenderSheetViewProps {
  categories: NotificationCategory[];
  onCategoryClick: (
    category: remindersCategoriesType,
    isSelected: boolean
  ) => void;
  selectedCategory: NotificationType;
  setSelectedCategory: (category: NotificationType) => void;
}

const RenderSheetView = ({
  categories,
  onCategoryClick,
  selectedCategory,
  setSelectedCategory,
}: RenderSheetViewProps) => {
  const { theme } = useAppContext();
  const colors = useThemeColors();

  const initialCategories = getCategories(colors);

  return (
    <View>
      <StatusBar
        translucent
        backgroundColor={colors.background}
        style={theme === "dark" ? "light" : "dark"}
      />
      <View style={styles.sheetSuggestionView}>
        {initialCategories?.map((res) => {
          const notificationColors = useNotificationIconColors(res.type);

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
                  backgroundColor: !isSelected
                    ? notificationColors.backgroundColor
                    : selectedCategory === "gmail"
                    ? notificationColors.backgroundColor
                    : "transparent",
                  opacity:
                    theme === "dark" && isSelected
                      ? 1
                      : theme === "light"
                      ? 1
                      : 0.5,
                },
              ]}
            >
              <Image
                resizeMode="contain"
                tintColor={
                  selectedCategory !== "gmail" && res.type === "gmail"
                    ? colors.white
                    : undefined
                }
                source={isSelected ? res.glowIcon : res.icon}
                style={[
                  styles.sheetSuggestionImage,
                  {
                    width: isSelected ? "135%" : "55%",
                    height: isSelected ? "135%" : "55%",
                    overflow: "visible",
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
      <Animated.FlatList
        numColumns={2}
        entering={FadeIn}
        layout={LinearTransition.springify().damping(80).stiffness(200)}
        itemLayoutAnimation={LinearTransition.springify()
          .damping(80)
          .stiffness(200)}
        data={categories}
        renderItem={({ item }) => (
          <RenderCategoryItem
            item={item}
            onCategoryClick={(category) => onCategoryClick(category, false)}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        )}
        keyExtractor={(item) => item?.id?.toString()}
        contentContainerStyle={{ rowGap: 15, paddingBottom: 90 }}
        columnWrapperStyle={{ justifyContent: "space-between" }}
      />
    </View>
  );
};

export default memo(RenderSheetView);

const styles = StyleSheet.create({
  sheetSuggestionView: {
    alignSelf: "center",
    marginBottom: 20,
    marginTop: 5,
    gap: 15,
    flexDirection: "row",
    overflow: "visible",
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
});
