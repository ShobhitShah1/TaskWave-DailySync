import { FlashList } from "@shopify/flash-list";
import React, { FC, memo } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import ReactNativeModal from "react-native-modal";
import { useAppContext } from "../Contexts/ThemeProvider";
import AssetsPath from "../Global/AssetsPath";
import TextString from "../Global/TextString";
import { FONTS, SIZE } from "../Global/Theme";
import useThemeColors from "../Theme/useThemeMode";
import { Notification } from "../Types/Interface";
import ReminderCard from "./ReminderCard";

interface FullScreenProps {
  isVisible: boolean;
  onClose: () => void;
  notifications: Notification[];
}

const FullScreenPreviewModal: FC<FullScreenProps> = ({
  isVisible,
  onClose,
  notifications,
}) => {
  const style = styles();
  const { theme } = useAppContext();
  const { height, width } = useWindowDimensions();
  const colors = useThemeColors();

  const renderEmptyView = () => {
    return (
      <View style={[style.emptyViewContainer, { width, height: height - 50 }]}>
        <Image
          style={style.emptyDateTimeImage}
          source={AssetsPath.ic_emptyDateTime}
        />
        <View style={style.emptyTextContainer}>
          <Text style={style.emptyNoEventTitle}>
            {TextString.NoScheduleYet}
          </Text>
          <Text style={style.emptyListText}>
            {TextString.LetsScheduleYourDailyEvents}
          </Text>
        </View>
        <Image
          source={AssetsPath.ic_emptyRocket}
          resizeMode="contain"
          style={style.emptyArrowRocket}
        />
      </View>
    );
  };

  return (
    <ReactNativeModal
      isVisible={isVisible}
      onBackButtonPress={onClose}
      onBackdropPress={onClose}
      animationIn={"fadeInUp"}
      animationInTiming={800}
      // statusBarTranslucent
      // deviceHeight={height + (StatusBar.currentHeight || 20)}
      animationOutTiming={300}
      hideModalContentWhileAnimating
      animationOut={"fadeOutDown"}
      customBackdrop={
        <Pressable
          onPress={onClose}
          style={{
            backgroundColor: "rgba(48, 51, 52, 0.9)",
            opacity: 0.5,
            flex: 1,
          }}
        />
      }
      hasBackdrop
      useNativeDriver={true}
      useNativeDriverForBackdrop={false}
      style={style.container}
      backdropOpacity={0.5}
    >
      <View style={style.mainContainer}>
        <View
          style={[
            style.listHeaderView,
            {
              backgroundColor:
                theme === "dark"
                  ? "rgba(48, 51, 52, 0.9)"
                  : "rgba(255,255,255,0.9)",
            },
          ]}
        >
          <Pressable onPress={onClose}>
            <Image
              resizeMode="contain"
              tintColor={colors.text}
              source={AssetsPath.ic_minimize}
              style={style.fullScreenIcon}
            />
          </Pressable>
        </View>

        <View style={style.listContainer}>
          <View style={style.listView}>
            <FlashList
              estimatedItemSize={300}
              data={notifications}
              stickyHeaderHiddenOnScroll={true}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={renderEmptyView}
              contentContainerStyle={{ paddingBottom: 30 }}
              renderItem={({ item }) => (
                <ReminderCard notification={item} deleteReminder={() => {}} />
              )}
            />
          </View>
        </View>
      </View>
    </ReactNativeModal>
  );
};

export default memo(FullScreenPreviewModal);

const styles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    container: {
      flex: 0,
      margin: 0,
      height: "100%",
      width: "100%",
    },
    mainContainer: {
      flex: 1,
      width: "100%",
      alignSelf: "center",
    },
    emptyViewContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyDateTimeImage: {
      width: 90,
      height: 90,
      justifyContent: "center",
    },
    emptyTextContainer: {
      marginVertical: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyNoEventTitle: {
      fontSize: 25,
      color: colors.text,
      fontFamily: FONTS.Medium,
    },
    emptyListText: {
      fontSize: 17,
      marginTop: 5,
      color: colors.text,
      fontFamily: FONTS.Medium,
    },
    emptyArrowRocket: {
      height: 380,
      left: 30,
      top: 10,
      marginTop: 20,
      marginVertical: 10,
      alignSelf: "flex-end",
    },
    listHeaderView: {
      height: "10%",
      width: "100%",
      paddingHorizontal: 10,
      justifyContent: "center",
      alignSelf: "flex-end",
      alignItems: "flex-end",
    },
    headerScheduleText: {
      color: colors.text,
      fontFamily: FONTS.Medium,
      fontSize: 21,
    },
    fullScreenIcon: {
      width: 35,
      height: 35,
    },
    listContainer: {
      height: "90%",
      backgroundColor: colors.background,
    },
    listView: {
      flex: 1,
      alignSelf: "center",
      width: SIZE.appContainWidth,
    },
  });
};
