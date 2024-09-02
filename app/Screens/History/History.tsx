import { FlashList } from "@shopify/flash-list";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SIZE } from "../../Global/Theme";
import { useFakeNotifications } from "../../Hooks/useFakeNotifications";
import useThemeColors from "../../Theme/useThemeMode";
import HomeHeader from "../Home/Components/HomeHeader";
import RenderHistoryList from "./Components/RenderHistoryList";

const History = () => {
  const style = styles();
  const colors = useThemeColors();
  const fakeNotifications = useFakeNotifications(100);

  return (
    <View style={style.container}>
      <HomeHeader hideGrid={true} hideThemeButton={true} />

      <View
        style={{ flex: 1, width: SIZE.appContainWidth, alignSelf: "center" }}
      >
        <FlashList
          estimatedItemSize={300}
          data={fakeNotifications}
          stickyHeaderHiddenOnScroll={true}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
          renderItem={({ item }) => <RenderHistoryList notification={item} />}
        />
      </View>
    </View>
  );
};

export default History;

const styles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });
};
