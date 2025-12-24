import { useIsFocused, useNavigation } from '@react-navigation/native';
import React, { memo, useRef, useState } from 'react';
import { Animated, FlatList, StyleSheet, View } from 'react-native';

import { OnBoardingData } from '@Constants/Data';
import { storage, useAppContext } from '@Contexts/ThemeProvider';
import useThemeColors from '@Hooks/useThemeMode';

import NextButton from './Components/NextButton';
import OnBoardingListView from './Components/OnBoardingListView';
import Paginator from './Components/Paginator';

const OnBoarding = () => {
  const navigation = useNavigation<any>();
  const [CurrentIndex, setCurrentIndex] = useState<number>(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const sliderRef = useRef<FlatList>(null);
  const colors = useThemeColors();
  const { theme } = useAppContext();
  const isFocus = useIsFocused();

  const isDark = theme === 'dark';
  const barColor = isDark ? '#303334' : '#ffffff';

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    setCurrentIndex(viewableItems?.[0]?.index);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (CurrentIndex < OnBoardingData.length - 1) {
      sliderRef.current?.scrollToIndex({ index: CurrentIndex + 1 });
    } else {
      storage.set('onboardingShown', 'no');
      navigation.replace('BottomTab');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
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
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
          })}
          scrollEventThrottle={32}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
        />
      </View>

      <View style={{ flex: 0.5 }}>
        <Paginator data={OnBoardingData} scrollX={scrollX} />
        <NextButton scrollTo={scrollTo} isLast={CurrentIndex === OnBoardingData.length - 1} />
      </View>
    </View>
  );
};

export default memo(OnBoarding);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
