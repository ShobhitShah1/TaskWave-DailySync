import React, { memo, useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

import { OnBoardingData } from '@Constants/Data';
import { storage } from '@Contexts/ThemeProvider';
import useThemeColors from '@Hooks/useThemeMode';

import NextButton from './Components/NextButton';
import OnBoardingListView from './Components/OnBoardingListView';
import Paginator from './Components/Paginator';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@Types/Interface';

const OnBoarding = () => {
  const [CurrentIndex, setCurrentIndex] = useState<number>(0);
  const scrollX = useSharedValue(0);
  const sliderRef = useRef<FlatList>(null);
  const colors = useThemeColors();

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'OnBoarding'>>();

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    setCurrentIndex(viewableItems?.[0]?.index);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (CurrentIndex < OnBoardingData.length - 1) {
      sliderRef.current?.scrollToIndex({ index: CurrentIndex + 1 });
    } else {
      storage.set('onboardingShown', 'no');
      navigation.replace('SignIn');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      <View style={{ flex: 2 }}>
        <Animated.FlatList
          horizontal
          pagingEnabled
          ref={sliderRef as any}
          bounces={false}
          data={OnBoardingData}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }: any) => {
            return <OnBoardingListView item={item} />;
          }}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
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
