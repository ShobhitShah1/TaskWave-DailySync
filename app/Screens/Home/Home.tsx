import { FlashList } from "@shopify/flash-list";
import React from "react";
import { Image, Text, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import ReminderCard from "../../Components/ReminderCard";
import AssetsPath from "../../Global/AssetsPath";
import TextString from "../../Global/TextString";
import { SIZE } from "../../Global/Theme";
import { useFakeNotifications } from "../../Hooks/useFakeNotifications";
import useThemeColors from "../../Theme/useThemeMode";
import HomeHeader from "./Components/HomeHeader";
import styles from "./styles";

const Home = () => {
  const style = styles();
  const colors = useThemeColors();
  const { height, width } = useWindowDimensions();
  const fakeNotifications = useFakeNotifications(100);

  const renderEmptyView = () => {
    return (
      <View style={[style.emptyViewContainer, { width, height: height - 50 }]}>
        <Image
          style={style.emptyDateTimeImage}
          source={AssetsPath.ic_emptyDateTime}
        />
        <View style={style.emptyTextContainer}>
          <Text style={style.emptyNoEventTitle}>
            {TextString.NoScheduleYet}
          </Text>
          <Text style={style.emptyListText}>
            {TextString.LetsScheduleYourDailyEvents}
          </Text>
        </View>
        <Image
          source={AssetsPath.ic_emptyRocket}
          resizeMode="contain"
          style={style.emptyArrowRocket}
        />
      </View>
    );
  };

  const RenderHeaderView = () => {
    return (
      <View style={style.listHeaderView}>
        <Text style={style.headerScheduleText}>Schedule</Text>
        <View>
          <View></View>
          <Image
            resizeMode="contain"
            tintColor={colors.text}
            source={AssetsPath.ic_fullScreen}
            style={style.fullScreenIcon}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={style.container}>
      <HomeHeader hideGrid={fakeNotifications?.length === 0} />

      <View
        style={{ flex: 1, width: SIZE.appContainWidth, alignSelf: "center" }}
      >
        {fakeNotifications?.length !== 0 && (
          <Animated.View entering={FadeIn.duration(300)} style={style.wrapper}>
            <View style={style.dateContainer}>
              <Text style={style.todayText}>Today</Text>
              <Text style={style.dateText}>Monday, 23 Nov</Text>
            </View>

            <View style={style.statusContainer}>
              <View style={style.statusItem}>
                <View
                  style={[style.statusDot, { backgroundColor: colors.green }]}
                />
                <Text style={style.statusText}>12</Text>
              </View>
              <View style={style.statusItem}>
                <View style={[style.statusDot, { backgroundColor: "gray" }]} />
                <Text style={style.statusText}>23</Text>
              </View>
            </View>
          </Animated.View>
        )}

        <Animated.View></Animated.View>

        <FlashList
          estimatedItemSize={300}
          data={fakeNotifications}
          ListHeaderComponent={() => {
            return <RenderHeaderView />;
          }}
          stickyHeaderHiddenOnScroll={true}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyView}
          renderItem={({ item }) => <ReminderCard notification={item} />}
        />
      </View>
    </View>
  );
};

export default Home;
