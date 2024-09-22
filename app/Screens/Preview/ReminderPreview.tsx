import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useCallback, useMemo } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AssetsPath from "../../Global/AssetsPath";
import { FONTS, SIZE } from "../../Global/Theme";
import { useCountdownTimer } from "../../Hooks/useCountdownTimer";
import useNotificationIconColors from "../../Hooks/useNotificationIconColors";
import useThemeColors from "../../Theme/useThemeMode";
import { Notification } from "../../Types/Interface";
import { formatNotificationType } from "../../Utils/formatNotificationType";
import { formatDate, formatTime } from "../AddReminder/ReminderScheduled";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { DocumentPickerResponse } from "react-native-document-picker";
import useReminder from "../../Hooks/useReminder";

type NotificationProps = {
  params: { notificationData: Notification };
};

const ReminderPreview = () => {
  const style = styles();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { params } = useRoute<RouteProp<NotificationProps, "params">>();

  const notificationData = useMemo(() => {
    return params.notificationData;
  }, [params]);

  const notificationType = useMemo(() => {
    return notificationData?.type;
  }, [params, notificationData]);

  const { createViewColor, icon } = useNotificationIconColors(notificationType);
  const { formattedTimeLeft } = useCountdownTimer(notificationData?.date);
  const { deleteNotification } = useReminder();

  const [hours, minutes, seconds] = formattedTimeLeft.split(" : ");

  const documentPreviews = useMemo(
    () =>
      notificationData?.attachments?.map(
        (document: DocumentPickerResponse, index) => {
          const isImage = document.type?.startsWith("image");
          const documentStyle = isImage
            ? style.fullImage
            : style.attachmentIconSmall;

          const onPressDoc = () => {
            if (document.type?.startsWith("image")) {
              //  setShowFilePreview({ isVisible: true, index });
            }
          };

          return (
            <React.Fragment key={document.uri}>
              <Animated.View
                style={style.documentPreview}
                exiting={FadeOut}
                entering={FadeIn}
                layout={LinearTransition.springify(300)}
              >
                <Pressable onPress={onPressDoc} style={style.imageButton}>
                  <Image
                    resizeMode={isImage ? "cover" : "contain"}
                    source={
                      isImage
                        ? { uri: `file://${document.uri}` }
                        : AssetsPath.ic_attachment
                    }
                    tintColor={isImage ? undefined : createViewColor}
                    style={documentStyle}
                  />
                </Pressable>
              </Animated.View>
            </React.Fragment>
          );
        }
      ),
    [notificationData]
  );

  const onDeleteClick = useCallback(async () => {
    if (!notificationData?.id) {
      Alert.alert("Error", "Notification ID not found.");
      return;
    }

    Alert.alert(
      "Confirmation",
      "Are you sure you want to delete this reminder?",
      [
        {
          text: "Yes",
          onPress: async () => {
            try {
              if (!notificationData?.id) {
                Alert.alert("Error", "Invalid reminder ID");
                return;
              }

              await deleteNotification(notificationData?.id);
              navigation.goBack();
            } catch (error: any) {
              Alert.alert("Error", String(error?.message));
            }
          },
          style: "destructive",
        },
        {
          text: "No",
          style: "cancel",
        },
      ]
    );
  }, [notificationData]);

  return (
    <View style={style.container}>
      <View style={style.innerContainer}>
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

        <View style={style.centeredContainer}>
          <View
            style={[
              style.notificationIconContainer,
              {
                backgroundColor:
                  notificationType === "gmail" ? colors.white : createViewColor,
              },
            ]}
          >
            <Image source={icon} style={style.notificationIcon} />
          </View>

          <Text style={[style.notificationText, { color: colors.text }]}>
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

          <View style={style.reminderDetails}>
            <View style={style.reminderDateTime}>
              <Text style={[style.dateTimeText, { color: colors.text }]}>
                {formatDate(notificationData.date)}
              </Text>
              <Text style={[style.dateTimeText, { color: colors.text }]}>
                {formatTime(notificationData.date)}
              </Text>
            </View>

            {(notificationData.message || notificationData.subject) && (
              <View
                style={[
                  style.reminderCard,
                  { backgroundColor: colors.reminderCardBackground },
                ]}
              >
                <Text style={[style.reminderCardText, { color: colors.text }]}>
                  {notificationData.message || notificationData.subject}
                </Text>
              </View>
            )}
          </View>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              marginTop: 15,
              gap: 10,
            }}
          >
            {notificationData?.attachments?.length !== 0 && (
              <ScrollView
                horizontal
                removeClippedSubviews={true}
                style={style.previewContainer}
                contentContainerStyle={style.scrollContent}
                showsHorizontalScrollIndicator={false}
              >
                {documentPreviews}
              </ScrollView>
            )}
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {notificationData?.type === "gmail"
              ? notificationData?.toMail?.map((item, index) =>
                  item.split(",").map((email, emailIndex) => (
                    <View
                      key={`${index}-${emailIndex}`}
                      style={style.toContainer}
                    >
                      <Text key={`${index}-${emailIndex}`} style={style.toText}>
                        {email.trim()}
                      </Text>
                    </View>
                  ))
                )
              : notificationData?.toContact?.map((item, index) => (
                  <View key={index} style={style.toContainer}>
                    <Text style={[style.toText, { color: createViewColor }]}>
                      {item?.name}
                    </Text>
                    <Text
                      style={[style.toText, { fontSize: 14, marginTop: 3 }]}
                    >
                      {item?.number}
                    </Text>
                  </View>
                ))}
          </View>
        </View>
      </View>

      <View style={style.bottomButtons}>
        <Pressable style={style.deleteButton} onPress={onDeleteClick}>
          <Image source={AssetsPath.ic_delete} style={style.buttonIcon} />
          <Text style={style.buttonText}>Delete</Text>
        </Pressable>

        <Pressable
          style={style.editButton}
          onPress={() => {
            navigation.navigate("CreateReminder", {
              notificationType: notificationData.type,
              id: notificationData.id,
            });
          }}
        >
          <Image source={AssetsPath.ic_edit} style={style.buttonIcon} />
          <Text style={style.buttonText}>Edit</Text>
        </Pressable>
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
    innerContainer: {
      width: SIZE.appContainWidth,
      alignSelf: "center",
    },
    backView: {
      width: "100%",
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
    centeredContainer: {
      width: "100%",
      alignContent: "center",
      alignSelf: "center",
    },
    notificationIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 10,
      alignSelf: "center",
      justifyContent: "center",
    },
    notificationIcon: {
      width: 55,
      height: 55,
      resizeMode: "contain",
      alignSelf: "center",
    },
    notificationText: {
      fontSize: 20,
      marginVertical: 10,
      fontFamily: FONTS.Medium,
      textAlign: "center",
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
    reminderDetails: {
      marginTop: 20,
    },
    reminderDateTime: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    dateTimeText: {
      fontSize: 19,
      fontFamily: FONTS.Medium,
    },
    reminderCard: {
      width: "100%",
      marginTop: 15,
      borderRadius: 10,
      padding: 10,
    },
    reminderCardText: {
      fontSize: 18,
      lineHeight: 28,
      fontFamily: FONTS.Medium,
    },
    toContainer: {
      padding: 10,
      backgroundColor: colors.reminderCardBackground,
      borderRadius: 15,
    },
    toText: {
      color: colors.text,
      fontFamily: FONTS.Medium,
      fontSize: 16,
    },

    previewContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 15,
      marginTop: 5,
    },
    scrollContent: {
      gap: 10,
    },
    documentPreview: {
      width: 65,
      height: 65,
      backgroundColor: "#f8d7da",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 8,
    },
    fullImage: {
      width: "100%",
      height: "100%",
    },
    attachmentIconSmall: {
      width: 40,
      height: 40,
    },
    imageButton: {
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
      borderRadius: 8,
    },

    bottomButtons: {
      position: "absolute",
      bottom: 0,
      flexDirection: "row",
      alignSelf: "center",
      justifyContent: "space-between",
      paddingVertical: 15,
      backgroundColor: colors.background,
    },
    deleteButton: {
      width: "46%",
      backgroundColor: "#ff4c4c",
      paddingHorizontal: 20,
      paddingVertical: 13,
      borderRadius: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    editButton: {
      width: "46%",
      backgroundColor: "#4c8dff",
      paddingHorizontal: 20,
      paddingVertical: 13,
      borderRadius: 20,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
    },
    buttonIcon: {
      width: 18,
      height: 18,
      alignItems: "center",
      resizeMode: "contain",
      marginHorizontal: 5,
    },
    buttonText: {
      color: "white",
      fontSize: 19,
      fontFamily: FONTS.Medium,
    },
  });
};
