import React, { memo } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AssetsPath from "../../Constants/AssetsPath";
import { FONTS, SIZE } from "../../Constants/Theme";
import { useAppContext } from "../../Contexts/ThemeProvider";
import useThemeColors from "../../Hooks/useThemeMode";
import HomeHeader from "../Home/Components/HomeHeader";

const AboutApp = () => {
  const style = styles();
  const colors = useThemeColors();
  const { theme } = useAppContext();

  return (
    <SafeAreaView style={style.container}>
      <HomeHeader
        title={"About App"}
        titleAlignment="center"
        leftIconType="back"
        showThemeSwitch={false}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={style.scrollContentContainer}
        style={style.scrollView}
      >
        <View style={style.section}>
          <View style={style.logoContainer}>
            <Image style={style.logo} source={AssetsPath.appLogoAndroid} />
          </View>

          <Text style={style.appTitle}>Dailysync</Text>
        </View>

        <View style={style.section}>
          <Text style={style.description}>
            DailySync – All-in-One Reminder App for WhatsApp, Gmail, SMS & More!
            {"\n"}
            Boost your productivity and never miss an important task again with
            DailySync! 🗓️✨ This powerful app lets you set reminders across
            multiple platforms, ensuring you stay on track no matter how busy
            life gets.
          </Text>
        </View>

        <View style={style.section}>
          <Text
            style={[
              style.subtitle,
              { color: theme === "dark" ? colors.white : colors.darkBlue },
            ]}
          >
            Just Schedule it
          </Text>
        </View>

        <View style={style.section}>
          <Text style={style.versionText}>App Version 1.1</Text>
        </View>

        <View style={[style.section, { borderBottomWidth: 0 }]}>
          <Text style={style.productText}>
            Product by{`\n`}
            <Text style={style.productSubText}>nirvanatechlabs</Text>
          </Text>
        </View>

        <Text style={style.footerText}>All rights to@nirvanatechlabs</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default memo(AboutApp);

const styles = () => {
  const colors = useThemeColors();
  const { theme } = useAppContext();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      width: SIZE.appContainWidth,
      alignSelf: "center",
      flex: 1,
    },
    scrollContentContainer: {
      flexGrow: 1,
    },
    section: {
      borderBottomColor:
        theme === "light"
          ? "rgba(173, 175, 176, 1)"
          : "rgba(255, 255, 255, 0.2)",
      borderBottomWidth: StyleSheet.hairlineWidth,
      paddingVertical: 30,
    },
    logoContainer: {
      width: 80,
      height: 80,
      borderRadius: 500,
      justifyContent: "center",
      alignSelf: "center",
      backgroundColor: "rgba(217, 217, 217, 1)",
    },
    logo: {
      width: "100%",
      height: "100%",
      resizeMode: "contain",
    },
    appTitle: {
      fontSize: 22,
      fontFamily: FONTS.Medium,
      color: colors.text,
      textAlign: "center",
      marginTop: 15,
    },
    description: {
      fontSize: 18,
      width: "90%",
      alignSelf: "center",
      textAlign: "center",
      fontFamily: FONTS.Regular,
      lineHeight: 27,
      color: theme === "dark" ? colors.white : "rgba(48, 51, 52, 0.7)",
    },
    subtitle: {
      fontSize: 22,
      width: "90%",
      alignSelf: "center",
      textAlign: "center",
      fontFamily: FONTS.SemiBold,
    },
    versionText: {
      fontSize: 18,
      width: "90%",
      alignSelf: "center",
      textAlign: "center",
      fontFamily: FONTS.Medium,
      color: colors.text,
    },
    productText: {
      fontSize: 18,
      width: "90%",
      alignSelf: "center",
      textAlign: "center",
      fontFamily: FONTS.Medium,
      lineHeight: 23,
      color: colors.text,
    },
    productSubText: {
      fontFamily: FONTS.Regular,
    },
    footerText: {
      position: "absolute",
      bottom: 15,
      left: 0,
      right: 0,
      justifyContent: "center",
      textAlign: "center",
      fontFamily: FONTS.Medium,
      color: colors.text,
      fontSize: 15.5,
    },
  });
};
