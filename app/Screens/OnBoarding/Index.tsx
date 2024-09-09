import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import { Animated, FlatList, StatusBar, StyleSheet, View } from "react-native";
import { OnBoardingData } from "../../Global/Data";
import useThemeColors from "../../Theme/useThemeMode";
import NextButton from "./Components/NextButton";
import OnBoardingListView from "./Components/OnBoardingListView";
import Paginator from "./Components/Paginator";
import { useAppContext } from "../../Contexts/ThemeProvider";

const OnBoarding = () => {
  const navigation = useNavigation<any>();
  const [CurrentIndex, setCurrentIndex] = useState<number>(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const sliderRef = useRef<FlatList>(null);
  const colors = useThemeColors();
  const { theme } = useAppContext();
  // const {setOnboardingShown} = useAppContext();

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    setCurrentIndex(viewableItems[0]?.index);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (CurrentIndex < OnBoardingData.length - 1) {
      sliderRef.current?.scrollToIndex({ index: CurrentIndex + 1 });
    } else {
      navigation.replace("BottomTab");
      // setOnboardingShown(true);
    }
  };

  useEffect(() => {
    const unSub = navigation.addListener("blur", () => {
      <StatusBar
        translucent
        backgroundColor={colors.background}
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
      />;
    });
    return unSub;
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      <StatusBar barStyle={"dark-content"} backgroundColor={colors.white} />
      <View style={{ flex: 2 }}>
        <FlatList
          horizontal
          pagingEnabled
          ref={sliderRef}
          bounces={false}
          data={OnBoardingData}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }: any) => {
            return <OnBoardingListView item={item} />;
          }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={32}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
        />
      </View>

      <View style={{ flex: 0.5 }}>
        <Paginator data={OnBoardingData} scrollX={scrollX} />
        <NextButton scrollTo={scrollTo} />
      </View>
    </View>
  );
};

export default OnBoarding;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
