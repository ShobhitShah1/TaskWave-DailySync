import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { FONTS, SIZE } from "../../Global/Theme";
import useThemeColors from "../../Theme/useThemeMode";
import HomeHeader from "../Home/Components/HomeHeader";

const AboutApp = () => {
  const style = styles();

  return (
    <View style={style.container}>
      <HomeHeader title="About App" hideGrid={true} hideThemeButton={true} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={style.scrollContentContainer}
        style={style.scrollView}
      >
        <View style={style.section}>
          <View style={style.logoContainer}>
            <Image
              style={style.logo}
              source={require("../../../assets/Icons/ic_appLogo.png")}
            />
          </View>

          <Text style={style.appTitle}>Dailysync</Text>
        </View>

        <View style={style.section}>
          <Text style={style.description}>
            Lorem Ipsum is simply dummy text of the printing and typesetting
            industry. Lorem Ipsum has been the industry's standard dummy text
            ever since the 1500s
          </Text>
        </View>

        <View style={style.section}>
          <Text style={style.subtitle}>Just Schedule it</Text>
        </View>

        <View style={style.section}>
          <Text style={style.versionText}>App Virson 1.0</Text>
        </View>

        <View style={style.section}>
          <Text style={style.productText}>
            Product by{`\n`}
            <Text style={style.productSubText}>nirvanatechlabs</Text>
          </Text>
        </View>

        <Text style={style.footerText}>All rights to@nirvanatechlabs</Text>
      </ScrollView>
    </View>
  );
};

export default AboutApp;

const styles = () => {
  const colors = useThemeColors();

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
      flex: 1,
    },
    section: {
      borderBottomColor: "rgba(255, 255, 255, 0.2)",
      borderBottomWidth: 1,
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
      color: "rgba(255, 255, 255, 1)",
    },
    subtitle: {
      fontSize: 22,
      width: "90%",
      alignSelf: "center",
      textAlign: "center",
      fontFamily: FONTS.SemiBold,
      color: "rgba(64, 93, 240, 1)",
    },
    versionText: {
      fontSize: 18,
      width: "90%",
      alignSelf: "center",
      textAlign: "center",
      fontFamily: FONTS.Medium,
      color: "rgba(255, 255, 255, 1)",
    },
    productText: {
      fontSize: 18,
      width: "90%",
      alignSelf: "center",
      textAlign: "center",
      fontFamily: FONTS.Medium,
      lineHeight: 23,
      color: "rgba(255, 255, 255, 1)",
    },
    productSubText: {
      fontFamily: FONTS.Regular,
    },
    footerText: {
      position: "absolute",
      bottom: 10,
      left: 0,
      right: 0,
      justifyContent: "center",
      textAlign: "center",
      fontFamily: FONTS.Regular,
      color: "rgba(255, 255, 255, 0.8)",
      fontSize: 15,
    },
  });
};
