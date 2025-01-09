import { StatusBar } from "expo-status-bar";
import React, { memo } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import { useAppContext } from "../../Contexts/ThemeProvider";
import useThemeColors from "../../Hooks/useThemeMode";
import {
  NotificationCategory,
  NotificationType,
  remindersCategoriesType,
} from "../../Types/Interface";
import { getCategories } from "../../Utils/getCategories";
import RenderCategoryItem from "./RenderCategoryItem";
import useNotificationIconColors from "../../Hooks/useNotificationIconColors";

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
                    : notificationColors.createViewColor,
                  borderColor: isSelected
                    ? notificationColors.createViewColor || "#3366FF"
                    : "transparent",
                  overflow: "visible",
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
                source={res.icon}
                tintColor={
                  isSelected && res.type === "gmail" ? undefined : colors.white
                }
                style={styles.sheetSuggestionImage}
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
        keyExtractor={(item, index) => index?.toString()}
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
    gap: 15,
    flexDirection: "row",
    overflow: "hidden",
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
  },
  sheetSuggestionImage: {
    width: "55%",
    height: "55%",
    alignSelf: "center",
  },
});
