import { useNavigation } from "@react-navigation/native";
import React, { memo, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import Share from "react-native-share";
import RateUsModal from "../../Components/RateUsModal";
import WithBackHeader from "../../Components/WithBackHeader";
import AssetsPath from "../../Global/AssetsPath";
import { SIZE } from "../../Global/Theme";
import useThemeColors from "../../Hooks/useThemeMode";
import SettingItem from "./Components/SettingItem";
import { SafeAreaView } from "react-native-safe-area-context";

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
        Share.open({
          message:
            "🗓️ Boost your productivity with DailySync! 🎯\n\nSet reminders for WhatsApp, WhatsApp Business, SMS, Gmail, and phone calls all in one app. 💬📧📞\n\nDownload now and never miss a task again! ⏰👇\nhttps://play.google.com/store/apps/details?id=com.taskwave.dailysync",
        }).catch((err) => {});
      },
    },
    {
      title: "Privacy Policy",
      icon: AssetsPath.ic_support,
      onPress: () => {
        Linking.openURL(
          "https://www.termsfeed.com/live/81b88b8e-c6ab-4149-9efa-1373c47f4268"
        );
      },
    },
    {
      title: "Rate us",
      icon: AssetsPath.ic_star,
      onPress: () =>
        setModalStatus({ ...modalStatus, rateUs: !modalStatus.rateUs }),
    },
    {
      title: "Contact us",
      icon: AssetsPath.ic_contact,
      onPress: () => {
        Linking.openURL("mailto:nirvanatechlabs@gmail.com");
      },
    },
    {
      title: "About app",
      icon: AssetsPath.ic_info,
      onPress: () => navigation.navigate("AboutApp"),
    },
    {
      title: "How app works",
      icon: AssetsPath.ic_info,
      onPress: () => {
        navigation.navigate("HowAppWorks");
      },
    },
  ];

  return (
    <SafeAreaView style={style.container}>
      <WithBackHeader title={"Setting"} />

      <View style={style.wrapper}>
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
    </SafeAreaView>
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
    wrapper: {
      width: SIZE.appContainWidth,
      alignSelf: "center",
      marginVertical: 15,
      gap: 10,
    },
  });
};
