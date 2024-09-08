import React, { FC } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import ReactNativeModal from "react-native-modal";
import useThemeColors from "../../../Theme/useThemeMode";
import { FlashList } from "@shopify/flash-list";
import { useFakeNotifications } from "../../../Hooks/useFakeNotifications";
import { FONTS, SIZE } from "../../../Global/Theme";
import ReminderCard from "../../../Components/ReminderCard";
import TextString from "../../../Global/TextString";
import AssetsPath from "../../../Global/AssetsPath";

interface FullScreenProps {
  isVisible: boolean;
  onClose: () => void;
}

const FullScreenPreviewModal: FC<FullScreenProps> = ({
  isVisible,
  onClose,
}) => {
  const style = styles();
  const fakeNotifications = useFakeNotifications(100);
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
      animationOutTiming={800}
      hideModalContentWhileAnimating
      backdropColor="red"
      swipeDirection={"down"}
      animationOut={"fadeOutDown"}
      customBackdrop={
        <View
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
      <View
        style={{
          flex: 1,
          alignSelf: "center",
          width: SIZE.appContainWidth,
        }}
      >
        <View style={style.listHeaderView}>
          <Pressable onPress={() => {}}>
            <Image
              resizeMode="contain"
              tintColor={colors.text}
              source={AssetsPath.ic_fullScreen}
              style={style.fullScreenIcon}
            />
          </Pressable>
        </View>

        <View style={{ height: "90%", backgroundColor: colors.background }}>
          <FlashList
            estimatedItemSize={300}
            data={fakeNotifications}
            stickyHeaderHiddenOnScroll={true}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyView}
            contentContainerStyle={{ paddingBottom: 30 }}
            renderItem={({ item }) => <ReminderCard notification={item} />}
          />
        </View>
      </View>
    </ReactNativeModal>
  );
};

export default FullScreenPreviewModal;

const styles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    container: {
      flex: 0,
      margin: 0,
      height: "100%",
      width: "100%",
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
      backgroundColor: "rgba(48, 51, 52, 0.9)",
    },
    headerScheduleText: {
      color: colors.text,
      fontFamily: FONTS.Medium,
      fontSize: 21,
    },
    fullScreenIcon: {
      width: 25,
      height: 25,
    },
  });
};
