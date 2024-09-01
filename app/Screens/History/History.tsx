import React from "react";
import { StyleSheet, Text, View } from "react-native";
import useThemeColors from "../../Theme/useThemeMode";
import HomeHeader from "../Home/Components/HomeHeader";
import { FlashList } from "@shopify/flash-list";
import ReminderCard from "../../Components/ReminderCard";
import { useFakeNotifications } from "../../Hooks/useFakeNotifications";
import { SIZE } from "../../Global/Theme";

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
          // ListHeaderComponent={() => {
          //   return <RenderHeaderView />;
          // }}
          stickyHeaderHiddenOnScroll={true}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          // ListEmptyComponent={renderEmptyView}
          renderItem={({ item }) => <ReminderCard notification={item} />}
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
