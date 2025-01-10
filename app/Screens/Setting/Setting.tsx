import { useNavigation } from "@react-navigation/native";
import React, { memo, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import Share from "react-native-share";
import RateUsModal from "../../Components/RateUsModal";
import WithBackHeader from "../../Components/WithBackHeader";
import AssetsPath from "../../Constants/AssetsPath";
import { SIZE } from "../../Constants/Theme";
import useThemeColors from "../../Hooks/useThemeMode";
import SettingItem from "./Components/SettingItem";
import { SafeAreaView } from "react-native-safe-area-context";

const SHARE_MESSAGE =
  "🗓️ Boost your productivity with DailySync! 🎯\n\nSet reminders for WhatsApp, WhatsApp Business, SMS, Gmail, and phone calls all in one app. 💬📧📞\n\nDownload now and never miss a task again! ⏰👇\nhttps://play.google.com/store/apps/details?id=com.taskwave.dailysync";

const PRIVACY_POLICY =
  "https://www.termsfeed.com/live/81b88b8e-c6ab-4149-9efa-1373c47f4268";

const CONTACT_US = "mailto:nirvanatechlabs@gmail.com";

const PORTFOLIO_URL = "https://dailysynctaskwave.netlify.app/";

const Settings = () => {
  const style = styles();
  const navigation = useNavigation();

  const [modalStatus, setModalStatus] = useState({ rateUs: false });

  const settingsData = [
    {
      title: "Notification",
      icon: AssetsPath.ic_notification,
      onPress: () => {
        navigation.navigate("NotificationSound");
      },
    },
    {
      title: "Share",
      icon: AssetsPath.ic_share,
      onPress: () => {
        Share.open({ message: SHARE_MESSAGE });
      },
    },
    {
      title: "Privacy Policy",
      icon: AssetsPath.ic_support,
      onPress: () => {
        Linking.openURL(PRIVACY_POLICY);
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
        Linking.openURL(CONTACT_US);
      },
    },
    {
      title: "About app",
      icon: AssetsPath.ic_info,
      onPress: () => navigation.navigate("AboutApp"),
    },
    {
      title: "How app works",
      icon: AssetsPath.ic_howAppWork,
      onPress: () => {
        navigation.navigate("HowAppWorks");
      },
    },
    {
      title: "Portfolio",
      icon: AssetsPath.ic_portfolio,
      onPress: () => {
        Linking.openURL(PORTFOLIO_URL);
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
