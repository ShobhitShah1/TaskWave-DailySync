import { FlashList } from "@shopify/flash-list";
import React from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import ReminderCard from "../../Components/ReminderCard";
import { SIZE } from "../../Global/Theme";
import useThemeColors from "../../Theme/useThemeMode";
import HomeHeader from "./Components/HomeHeader";
import styles from "./styles";
import { useFakeNotifications } from "../../Hooks/useFakeNotifications";

const Home = () => {
  const style = styles();
  const colors = useThemeColors();
  const fakeNotifications = useFakeNotifications(150);

  return (
    <View style={style.container}>
      <HomeHeader />

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

      <Animated.View></Animated.View>

      <View
        style={{ flex: 1, width: SIZE.appContainWidth, alignSelf: "center" }}
      >
        <FlashList
          estimatedItemSize={100}
          data={fakeNotifications}
          getItemType={(_, index) => {
            // Disables recycling of items by assigning a unique type to each item
            return index;
          }}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <ReminderCard notification={item} />}
        />
      </View>
    </View>
  );
};

export default Home;
