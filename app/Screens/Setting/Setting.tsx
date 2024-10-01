import React, { memo, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import WithBackHeader from "../../Components/WithBackHeader";
import AssetsPath from "../../Global/AssetsPath";
import { FONTS, SIZE } from "../../Global/Theme";
import useThemeColors from "../../Theme/useThemeMode";
import SettingItem from "./Components/SettingItem";
import Share from "react-native-share";
import RateUsModal from "../../Components/RateUsModal";
import { useNavigation } from "@react-navigation/native";
import CustomSwitch from "../../Components/CustomSwitch";

const Settings = () => {
  const style = styles();
  const navigation = useNavigation();

  const [modalStatus, setModalStatus] = useState({
    rateUs: false,
  });
  const settingsData = [
    {
      title: "Share",
      icon: AssetsPath.ic_share,
      onPress: () => {
        Share.open({ message: "Hello World!" }).catch((err) => {});
      },
    },
    {
      title: "Privacy Policy",
      icon: AssetsPath.ic_support,
      onPress: () => {},
    },
    {
      title: "Rate us",
      icon: AssetsPath.ic_star,
      onPress: () =>
        setModalStatus({ ...modalStatus, rateUs: !modalStatus.rateUs }),
    },
    { title: "Contact us", icon: AssetsPath.ic_contact, onPress: () => {} },
    {
      title: "About app",
      icon: AssetsPath.ic_info,
      onPress: () => navigation.navigate("AboutApp"),
    },
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

      <RateUsModal
        isVisible={modalStatus.rateUs}
        onClose={() => setModalStatus({ ...modalStatus, rateUs: false })}
      />
    </View>
  );
};

export default memo(Settings);

const styles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });
};
