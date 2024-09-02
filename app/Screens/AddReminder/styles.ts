import { StyleSheet } from "react-native";
import useThemeColors from "../../Theme/useThemeMode";
import { FONTS, SIZE } from "../../Global/Theme";

const styles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      width: SIZE.appContainWidth,
      flex: 1,
      alignSelf: "center",
      marginVertical: 10,
    },
    headerContainer: {
      flexDirection: "row",
      height: 35,
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerIcon: {
      width: 20,
      height: 20,
      resizeMode: "contain",
    },
    headerText: {
      right: 8,
      fontSize: 22,
      fontFamily: FONTS.SemiBold,
    },
    createButton: {
      position: "absolute",
      bottom: 0,
      width: "100%",
      height: 43,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    createButtonText: {
      color: colors.white,
      textAlign: "center",
      fontFamily: FONTS.Medium,
      fontSize: 22,
    },
    itemsContainer: {
      marginTop: 20,
      marginBottom: 30,
    },

    contactModalContainer: {
      flex: 1,
      backgroundColor: colors.background,
      // borderTopLeftRadius: 20,
      // borderTopRightRadius: 20,
      overflow: "hidden",
    },
    contactHeaderContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 15,
      marginBottom: 10,
    },
    contactHeaderIcon: {
      width: 20,
      height: 20,
      resizeMode: "contain",
    },
    contactSearchInput: {
      height: 45,
      marginHorizontal: 10,
      marginVertical: 25,
      paddingHorizontal: 15,
      borderRadius: 20,
      backgroundColor: colors.contactBackground,
      fontFamily: FONTS.Medium,
      fontSize: 18,
    },
    contactListContainer: {
      flex: 1,
      marginTop: 10,
    },
    contactItemContainer: {
      width: SIZE.appContainWidth,
      alignSelf: "center",
      borderRadius: 25,
      marginBottom: 15,
      columnGap: 15,
    },
    contactAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 10,
    },
    contactName: {
      fontSize: 19,
      fontFamily: FONTS.Medium,
    },
    contactNumber: {
      fontSize: 14,
      fontFamily: FONTS.Regular,
      marginTop: 2,
    },
    contactDoneButton: {
      width: "100%",
      height: 80,
      bottom: 0,
      position: "absolute",
      justifyContent: "center",
      alignItems: "center",
    },
    contactDoneButtonText: {
      color: colors.white,
      fontFamily: FONTS.Bold,
      fontSize: 18,
    },
    contactDoneButtonView: {
      width: 140,
      height: 43,
      borderRadius: 25,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(64, 93, 240, 1)",
    },
  });
};

export default styles;
