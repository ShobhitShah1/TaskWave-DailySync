import {
  Animated,
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import React, { useRef } from "react";
import useThemeColors from "../../Theme/useThemeMode";
import HomeHeader from "../Home/Components/HomeHeader";
import AssetsPath from "../../Global/AssetsPath";
import HowItWorkView from "./Components/HowItWorkView";

const HowAppWorks = () => {
  const colors = useThemeColors();
  const scrollX = useRef(new Animated.Value(0)).current;
  const sliderRef = useRef<FlatList>(null);
  const { width } = useWindowDimensions();

  const HowAppWorksData = [
    {
      id: 1,
      image: {
        light: AssetsPath.HIW_home_dark,
        dark: AssetsPath.HIW_home_dark,
      },
      title: "Just tap on plus to create event",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    },
    {
      id: 2,
      image: {
        light: AssetsPath.HIW_create_dark,
        dark: AssetsPath.HIW_create_dark,
      },
      title: "Select app for schedule event",
      description: "Select which app you want to schedule a message with.",
    },
    {
      id: 3,
      image: {
        light: AssetsPath.HIW_whatsapp_dark,
        dark: AssetsPath.HIW_whatsapp_dark,
      },
      title: "Fill details to schedule",
      description:
        "Just select contact, date, time and write message and you good to go.",
    },
    {
      id: 4,
      image: {
        light: AssetsPath.HIW_Notification,
        dark: AssetsPath.HIW_Notification,
      },
      title: "Tap on notification to confirm",
      description:
        "Just tap on attachments to attach any types of media like photo, vides, doc..",
    },
  ];

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {}).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HomeHeader hideGrid={true} title="How app works" hideThemeButton />

      <View style={{ flex: 1, marginVertical: 10 }}>
        <FlatList
          horizontal
          pagingEnabled
          ref={sliderRef}
          bounces={false}
          data={HowAppWorksData}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }: any) => {
            return <HowItWorkView item={item} />;
          }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            {
              useNativeDriver: false,
            }
          )}
          scrollEventThrottle={32}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
        />
      </View>
      <View style={styles.paginatorContainer}>
        {HowAppWorksData.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [11, 11, 11],
            extrapolate: "clamp",
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: "clamp",
          });

          return (
            <Animated.View
              style={[
                styles.dot,
                { width: dotWidth, opacity, backgroundColor: colors.darkBlue },
              ]}
              key={i.toString()}
            />
          );
        })}
      </View>
    </View>
  );
};

export default HowAppWorks;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentView: {
    flex: 1,
    width: "90%",
    marginVertical: 10,
    alignSelf: "center",
  },
  paginatorContainer: {
    justifyContent: "center",
    flexDirection: "row",
    position: "absolute",
    bottom: "18%",
    alignItems: "center",
    alignContent: "center",
    alignSelf: "center",
  },
  dot: {
    height: 11,
    borderRadius: 50,
    marginHorizontal: 4,
  },
});
