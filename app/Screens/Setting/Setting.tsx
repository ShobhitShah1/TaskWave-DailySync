import React from "react";
import { StyleSheet, View } from "react-native";
import WithBackHeader from "../../Components/WithBackHeader";
import AssetsPath from "../../Global/AssetsPath";
import { SIZE } from "../../Global/Theme";
import useThemeColors from "../../Theme/useThemeMode";
import SettingItem from "./Components/SettingItem";
import Share from "react-native-share";

const Settings = () => {
  const style = styles();
  const settingsData = [
    {
      title: "Share",
      icon: AssetsPath.ic_share,
      onPress: () => {
        Share.open({ message: "Hello World!" })
          .then((res) => {
            console.log(res);
          })
          .catch((err) => {
            err && console.log(err);
          });
      },
    },
    { title: "Privacy Policy", icon: AssetsPath.ic_support, onPress: () => {} },
    { title: "Rate us", icon: AssetsPath.ic_star, onPress: () => {} },
    { title: "Contact us", icon: AssetsPath.ic_contact, onPress: () => {} },
    { title: "About app", icon: AssetsPath.ic_info, onPress: () => {} },
    { title: "How app works", icon: AssetsPath.ic_info, onPress: () => {} },
  ];

  return (
    <View style={style.container}>
      <WithBackHeader title={"Setting"} />

      <View
        style={{
          width: SIZE.appContainWidth,
          alignSelf: "center",
          marginVertical: 15,
        }}
      >
        {settingsData.map((item, index) => (
          <SettingItem
            key={index}
            title={item.title}
            icon={item.icon}
            onPress={item.onPress}
          />
        ))}
      </View>
    </View>
  );
};

const styles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });
};
export default Settings;
