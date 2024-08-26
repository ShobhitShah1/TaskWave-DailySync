import React, { useCallback, useMemo } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AssetsPath from "../../Global/AssetsPath";
import { FONTS } from "../../Global/Theme";
import useNotificationIconColors from "../../Hooks/useNotificationIconColors";
import useThemeColors from "../../Theme/useThemeMode";
import { NotificationType } from "../../Types/Interface";
import { categoriesType } from "../BottomTab";

interface CategoryItemType {
  item: categoriesType;
  setSelectedCategory: (category: string) => void;
  selectedCategory: string;
}

const RenderCategoryItem = ({
  item,
  selectedCategory,
  setSelectedCategory,
}: CategoryItemType) => {
  const { typeColor } = useNotificationIconColors(
    item.type as NotificationType
  );
  const colors = useThemeColors();

  const isSelected = useMemo(
    () => selectedCategory.toLowerCase() === item.title.toLowerCase(),
    [selectedCategory]
  );

  const onCategoryClick = useCallback(() => {
    setSelectedCategory(item.title);
  }, []);

  return (
    <Pressable
      style={[
        styles.pressableContainer,
        { borderColor: isSelected ? typeColor : colors.borderColor },
      ]}
      onPress={onCategoryClick}
    >
      <ImageBackground
        resizeMode="cover"
        tintColor={isSelected ? typeColor : undefined}
        source={AssetsPath.ic_categoryFrame}
        style={styles.imageBackground}
      >
        <View style={styles.innerContainer}>
          <View style={styles.iconContainer}>
            <Image
              resizeMode="contain"
              tintColor={item.type === "gmail" ? undefined : typeColor}
              source={item.icon}
              style={styles.icon}
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
    borderWidth: 0.5,
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
