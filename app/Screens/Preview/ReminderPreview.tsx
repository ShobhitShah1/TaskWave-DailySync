import React, { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import AssetsPath from "../../Global/AssetsPath";
import { FONTS, SIZE } from "../../Global/Theme";
import useThemeColors from "../../Theme/useThemeMode";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NotificationType } from "../../Types/Interface";
import { useCountdownTimer } from "../../Hooks/useCountdownTimer";
import useNotificationIconColors from "../../Hooks/useNotificationIconColors";
import { formatNotificationType } from "../../Utils/formatNotificationType";

type NotificationProps = {
  params: { notificationType: NotificationType };
};

const ReminderPreview = () => {
  const style = styles();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { params } = useRoute<RouteProp<NotificationProps, "params">>();

  const notificationType = useMemo(() => {
    return params.notificationType;
  }, [params]);

  const { createViewColor, icon } = useNotificationIconColors(notificationType);
  const { formattedTimeLeft } = useCountdownTimer("12:00:00");

  const [hours, minutes, seconds] = formattedTimeLeft.split(" : ");

  return (
    <View style={style.container}>
      <View style={{ width: SIZE.appContainWidth }}>
        <View style={style.backView}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={style.menuIconView}
          >
            <Image
              source={AssetsPath.ic_leftArrow}
              tintColor={colors.text}
              style={style.menuIcon}
            />
          </Pressable>
        </View>

        <View>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 10,
              backgroundColor:
                notificationType === "gmail" ? colors.white : createViewColor,
              alignSelf: "center",
              justifyContent: "center",
            }}
          >
            <Image
              source={icon}
              style={{
                width: 55,
                height: 55,
                resizeMode: "contain",
                alignSelf: "center",
              }}
            />
          </View>

          <Text
            style={{
              fontSize: 20,
              marginVertical: 10,
              fontFamily: FONTS.Medium,
              color: colors.text,
              textAlign: "center",
            }}
          >
            {formatNotificationType(notificationType)}
          </Text>

          <View style={style.timeContainer}>
            <Text style={[style.timeText, { color: createViewColor }]}>
              {hours.split("Hrs")[0]}
              <Text style={[style.timeLabelText, { color: colors.text }]}>
                Hrs
              </Text>
            </Text>
            <Text style={[style.timeSeparator, { color: createViewColor }]}>
              {" "}
              :{" "}
            </Text>
            <Text style={[style.timeText, { color: createViewColor }]}>
              {minutes.split("Min")[0]}
              <Text style={[style.timeLabelText, { color: colors.text }]}>
                Min
              </Text>
            </Text>
            <Text style={[style.timeSeparator, { color: createViewColor }]}>
              {" "}
              :{" "}
            </Text>
            <Text style={[style.timeText, { color: createViewColor }]}>
              {seconds.split("Sec")[0]}
              <Text style={[style.timeLabelText, { color: colors.text }]}>
                Sec
              </Text>
            </Text>
          </View>

          <View></View>
        </View>
      </View>
    </View>
  );
};

export default ReminderPreview;

const styles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    backView: {
      width: SIZE.appContainWidth,
      paddingVertical: 10,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    menuIconView: {
      width: 28,
      height: 28,
      borderRadius: 5,
      alignItems: "center",
      justifyContent: "center",
    },
    menuIcon: {
      width: 18,
      height: 18,
      resizeMode: "contain",
    },
    timeContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 10,
      alignSelf: "center",
    },
    timeText: {
      fontSize: 34,
      fontFamily: FONTS.Medium,
    },
    timeLabelText: {
      fontSize: 16,
      fontFamily: FONTS.Medium,
    },
    timeSeparator: {
      fontSize: 34,
      fontFamily: FONTS.Medium,
    },
  });
};
