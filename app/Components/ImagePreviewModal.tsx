import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
  ViewToken,
} from "react-native";
import ReactNativeModal from "react-native-modal";
import AssetsPath from "../Global/AssetsPath";
import useThemeColors from "../Theme/useThemeMode";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

interface ImagePreviewModalProps {
  isVisible: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
}

const { width, height } = Dimensions.get("window");

const ImagePreviewModal: FC<ImagePreviewModalProps> = ({
  isVisible,
  onClose,
  images,
  initialIndex = 0,
}) => {
  useEffect(() => {
    console.log("initialIndex:", initialIndex);
  }, [initialIndex]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);
  const colors = useThemeColors();
  const styles = useStyles();

  useEffect(() => {
    if (isVisible) {
      const validIndex = Math.min(Math.max(initialIndex, 0), images.length - 1);
      setCurrentIndex(validIndex);

      flatListRef.current?.scrollToIndex({
        index: validIndex,
        animated: false,
      });
    }
  }, [isVisible, initialIndex, images]);

  const renderImageItem = useCallback(
    ({ item }: { item: string }) => (
      <View style={[styles.imageWrapper, { width, height: "95%" }]}>
        <View style={{ width: width - 30, height: height }}>
          <Image
            resizeMode="contain"
            source={{ uri: `file://${item}` }}
            style={[styles.image, { width: "100%", height: "100%" }]}
          />
        </View>
      </View>
    ),
    []
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index || 0);
      }
    },
    []
  );

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

  const handleNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  }, [currentIndex, images.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex - 1,
        animated: true,
      });
    }
  }, [currentIndex]);

  return (
    <ReactNativeModal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      style={styles.modalContainer}
      useNativeDriver
    >
      <View style={styles.listHeaderView}>
        <Pressable onPress={onClose} style={{ zIndex: 99999 }}>
          <Image
            resizeMode="contain"
            tintColor={colors.text}
            source={AssetsPath.ic_leftArrow}
            style={styles.backButtonImage}
          />
        </Pressable>
      </View>
      <FlatList
        horizontal
        pagingEnabled
        ref={flatListRef}
        data={images}
        renderItem={renderImageItem}
        keyExtractor={(item, index) => index.toString()}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />
      {currentIndex > 0 && (
        <Animated.View
          style={styles.leftArrow}
          entering={FadeIn}
          exiting={FadeOut}
        >
          <Pressable onPress={handlePrevious}>
            <Image
              resizeMode="contain"
              tintColor={colors.black}
              source={AssetsPath.ic_leftArrow}
              style={styles.arrowIcon}
            />
          </Pressable>
        </Animated.View>
      )}
      {currentIndex < images.length - 1 && (
        <Animated.View
          style={styles.rightArrow}
          entering={FadeIn}
          exiting={FadeOut}
        >
          <Pressable onPress={handleNext}>
            <Image
              resizeMode="contain"
              tintColor={colors.black}
              source={AssetsPath.ic_leftArrow}
              style={[styles.arrowIcon, { transform: [{ rotate: "180deg" }] }]}
            />
          </Pressable>
        </Animated.View>
      )}
    </ReactNativeModal>
  );
};

const useStyles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    modalContainer: {
      margin: 0,
      alignItems: "center",
      backgroundColor: colors.background,
      justifyContent: "center",
    },
    imageWrapper: {
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
      borderRadius: 10,
    },
    image: {
      borderRadius: 10,
      overflow: "hidden",
    },
    leftArrow: {
      position: "absolute",
      left: 5,
      top: "50%",
      zIndex: 1,
      backgroundColor: "rgba(255, 255, 255, 0.6)",
      width: 30,
      height: 30,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 5,
    },
    rightArrow: {
      position: "absolute",
      right: 5,
      top: "50%",
      zIndex: 1,
      backgroundColor: "rgba(255, 255, 255, 0.6)",
      width: 30,
      height: 30,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 5,
    },
    arrowIcon: {
      width: 20,
      height: 20,
    },
    listHeaderView: {
      width: "100%",
      height: "10%",
      paddingHorizontal: 10,
      justifyContent: "center",
      top: 20,
      left: 5,
    },
    backButtonImage: {
      width: 20,
      height: 20,
    },
  });
};

export default React.memo(ImagePreviewModal);
