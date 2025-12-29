import React, { memo, useMemo } from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

import AssetsPath from '@Constants/AssetsPath';
import { FONTS } from '@Constants/Theme';
import useThemeColors from '@Hooks/useThemeMode';
import { CategoryItemType } from '@Types/Interface';

const RenderCategoryItem = ({
  item,
  index,
  selectedCategory,
  setSelectedCategory,
  onCategoryClick,
}: CategoryItemType) => {
  const colors = useThemeColors();

  const isSelected = useMemo(
    () => selectedCategory && selectedCategory?.toLowerCase() === item?.type?.toLowerCase(),
    [selectedCategory],
  );

  const borderColor = isSelected
    ? item?.type === 'gmail'
      ? item?.color?.dark
      : item?.color?.primary
    : colors.borderColor;

  const borderShadow = isSelected
    ? item?.type === 'gmail'
      ? item?.color?.dark
      : item?.color?.primary
    : 'transparent';

  return (
    <View
      style={[styles.pressableContainer, { borderColor, boxShadow: `0px 0px 6px ${borderShadow}` }]}
    >
      <Pressable
        style={{ flex: 1 }}
        onPress={() => {
          onCategoryClick(item);
          setSelectedCategory(item.type);
        }}
      >
        <ImageBackground
          resizeMode="cover"
          tintColor={
            isSelected
              ? item?.type === 'gmail'
                ? item?.color?.dark
                : item?.color?.primary
              : 'rgba(171, 171, 171, 1)'
          }
          source={AssetsPath.ic_categoryFrame}
          style={styles.imageBackground}
        >
          <View style={styles.innerContainer}>
            <View style={styles.iconContainer}>
              <Image source={item.normalIcon} style={styles.icon} resizeMode="contain" />
            </View>

            <View style={styles.textContainer}>
              <Text style={[styles.titleText, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.descriptionText, { color: colors.text }]}>
                {item.description}
              </Text>
            </View>
          </View>
        </ImageBackground>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  pressableContainer: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    borderWidth: 0.5,
  },
  imageBackground: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    justifyContent: 'center',
  },
  innerContainer: {
    paddingHorizontal: 15,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 500,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px -3px 4px -2px #0A0909B2 inset',
  },
  icon: {
    width: 55,
    height: 55,
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

export default memo(RenderCategoryItem);
