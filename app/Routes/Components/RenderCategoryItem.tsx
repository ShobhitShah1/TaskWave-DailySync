import React, { useCallback, useMemo } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  LayoutAnimation,
  UIManager,
  Platform,
} from "react-native";
import AssetsPath from "../../Global/AssetsPath";
import { FONTS } from "../../Global/Theme";
import useNotificationIconColors from "../../Hooks/useNotificationIconColors";
import useThemeColors from "../../Theme/useThemeMode";
import { NotificationType } from "../../Types/Interface";
import { categoriesType } from "../BottomTab";
import { useAppContext } from "../../Contexts/ThemeProvider";

interface CategoryItemType {
  item: categoriesType;
  setSelectedCategory: (category: NotificationType) => void;
  selectedCategory: NotificationType | null | undefined;
  categories: categoriesType[];
  setCategories: (categories: categoriesType[]) => void;
}

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const RenderCategoryItem = ({
  item,
  selectedCategory,
  setSelectedCategory,
  categories,
  setCategories,
}: CategoryItemType) => {
  const colors = useThemeColors();
  const { theme } = useAppContext();
  const { typeColor, createViewColor } = useNotificationIconColors(item.type);

  const isSelected = useMemo(
    () =>
      selectedCategory &&
      selectedCategory?.toLowerCase() === item?.type?.toLowerCase(),
    [selectedCategory]
  );

  const onCategoryClick = useCallback(() => {
    // Animate the layout change
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    // Move the selected category to the first position
    const newCategories = categories.filter((cat) => cat.type !== item.type);
    setCategories([item, ...newCategories]);

    setSelectedCategory(item.type);
  }, [item, categories]);

  return (
    <Pressable
      style={[
        styles.pressableContainer,
        {
          borderColor: isSelected ? createViewColor : colors.borderColor,
        },
      ]}
      onPress={onCategoryClick}
    >
      <ImageBackground
        resizeMode="cover"
        tintColor={
          isSelected ? typeColor : theme === "light" ? "#8B8E8E" : undefined
        }
        source={AssetsPath.ic_categoryFrame}
        style={styles.imageBackground}
      >
        <View style={styles.innerContainer}>
          <View style={styles.iconContainer}>
            <Image
              source={item.icon}
              style={styles.icon}
              resizeMode="contain"
              tintColor={item.type === "gmail" ? undefined : typeColor}
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.titleText, { color: colors.text }]}>
              {item.title}
            </Text>
            <Text style={[styles.descriptionText, { color: colors.text }]}>
              {item.description}
            </Text>
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressableContainer: {
    width: "48%",
    height: 180,
    borderRadius: 10,
    borderWidth: 1,
  },
  imageBackground: {
    width: "100%",
    height: "100%",
    borderRadius: 15,
    justifyContent: "center",
  },
  innerContainer: {
    paddingHorizontal: 15,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 500,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: 25,
    height: 25,
  },
  textContainer: {
    marginVertical: 10,
  },
  titleText: {
    fontFamily: FONTS.Medium,
    fontSize: 20,
    marginVertical: 5,
    marginBottom: 10,
  },
  descriptionText: {
    fontFamily: FONTS.Regular,
    fontSize: 14.5,
  },
});

export default RenderCategoryItem;
