import RNDateTimePicker from "@react-native-community/datetimepicker";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { Audio } from "expo-av";
import { Recording } from "expo-av/build/Audio";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Pressable,
  Text,
  View,
} from "react-native";
import RNBlobUtil from "react-native-blob-util";
import Contacts from "react-native-contacts";
import DocumentPicker, {
  DocumentPickerResponse,
} from "react-native-document-picker";
import { showMessage } from "react-native-flash-message";
import { PERMISSIONS, request } from "react-native-permissions";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import AudioMemoItem from "../../Components/MemoListItem";
import AssetsPath from "../../Global/AssetsPath";
import useContactPermission from "../../Hooks/useContactPermission";
import useNotificationIconColors from "../../Hooks/useNotificationIconColors";
import useDatabase, {
  scheduleNotificationWithNotifee,
} from "../../Hooks/useReminder";
import useThemeColors from "../../Theme/useThemeMode";
import {
  Contact,
  Memo,
  Notification,
  NotificationType,
} from "../../Types/Interface";
import { formatNotificationType } from "../../Utils/formatNotificationType";
import { generateUniqueFileName } from "../../Utils/generateUniqueFileName";
import { validateMultipleEmails } from "../../Utils/validateMultipleEmails";
import AddContact from "./Components/AddContact";
import AddDateAndTime from "./Components/AddDateAndTime";
import AddMailSubject from "./Components/AddMailSubject";
import AddMailTo from "./Components/AddMailTo";
import AddMessage from "./Components/AddMessage";
import AddScheduleFrequency, {
  FrequencyType,
} from "./Components/AddScheduleFrequency";
import AttachFile from "./Components/AttachFile";
import ContactListModal from "./Components/ContactListModal";
import styles from "./styles";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

type NotificationProps = {
  params: { notificationType: NotificationType; id?: string };
};

const AddReminder = () => {
  const style = styles();
  const colors = useThemeColors();
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<NotificationProps, "params">>();
  const { createNotification, getNotificationById, updateNotification } =
    useDatabase();

  const notificationType = useMemo(() => {
    return params.notificationType as NotificationType;
  }, [params]);

  const id = useMemo(() => {
    return params?.id as NotificationType;
  }, [params]);

  useEffect(() => {
    if (id) {
      getExistingNotificationData();
    }
  }, [id]);

  useEffect(() => {
    request(PERMISSIONS.ANDROID.RECORD_AUDIO);
  }, []);

  const getExistingNotificationData = async () => {
    const response = await getNotificationById(id);

    if (response) {
      setMessage(response?.message);
      setTo(response?.toMail?.[0]);
      setSubject(response?.subject || "");
      setScheduleFrequency(response?.scheduleFrequency);
      setSelectedDateAndTime({
        date: new Date(response?.date),
        time: new Date(response?.date),
      });
      setSelectedDocuments(response?.attachments);
      setContacts(response?.toContact);
      setSelectedContacts(response?.toContact);
    }
  };

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [contactModalVisible, setContactModalVisible] = useState(false);

  const [message, setMessage] = useState("");

  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");

  const [selectedDocuments, setSelectedDocuments] = useState<
    DocumentPickerResponse[]
  >([]);
  const [pickerVisibleType, setPickerVisibleType] = useState<
    "date" | "time" | null
  >(null);

  const [selectedDateAndTime, setSelectedDateAndTime] = useState<{
    date: Date | undefined;
    time: Date | undefined;
  }>({
    date: undefined,
    time: undefined,
  });

  const [scheduleFrequency, setScheduleFrequency] =
    useState<FrequencyType | null>(null);

  const [recording, setRecording] = useState<Recording | undefined>();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [audioMetering, setAudioMetering] = useState<number[]>([]);

  const metering = useSharedValue(-100);

  const [isLoading, setIsLoading] = useState(false);
  const [isContactLoading, setIsContactLoading] = useState(false);
  const { createViewColor } = useNotificationIconColors(notificationType);
  const { requestPermission, checkPermissionStatus } = useContactPermission();

  const startRecording = useCallback(async () => {
    try {
      setAudioMetering([]);

      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        undefined,
        100
      );
      setRecording(recording);

      recording.setOnRecordingStatusUpdate((status) => {
        if (status.metering) {
          metering.value = status.metering;
          setAudioMetering((curVal) => [...curVal, status.metering || -100]);
        }
      });
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recording) {
      return;
    }

    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
    const uri = recording.getURI();
    console.log("Recording stopped and stored at", uri);

    if (uri) {
      metering.value = -100;
      setMemos((existingMemos) => [
        { uri, metering: audioMetering },
        ...existingMemos,
      ]);
    }
  }, [recording, audioMetering]);

  const animatedRecordWave = useAnimatedStyle(() => {
    const size = withTiming(
      recording ? interpolate(metering.value, [-160, -60, 0], [0, 0, -30]) : 0,
      { duration: 300 }
    );

    const opacity = withTiming(recording ? 1 : 0, { duration: 300 });

    return {
      top: size,
      bottom: size,
      left: size,
      right: size,
      backgroundColor: `rgba(34, 200, 66, ${interpolate(
        metering.value,
        [-160, -60, -10],
        [0.7, 0.3, 0.7]
      )})`,
      opacity,
    };
  });

  const onHandelContactClick = async () => {
    try {
      // if (contacts.length === 0) {
      setIsContactLoading(true);

      const isPermissionEnable = await checkPermissionStatus();

      if (!isPermissionEnable) {
        await requestPermission().then((res) => {
          if (res) requestContactData();
        });

        return;
      }
      requestContactData();
      // }
      setIsContactLoading(false);
      setContactModalVisible(true);
    } catch (error: any) {
      showMessage({
        message: String(error?.message || error),
        type: "danger",
      });
    }
  };

  const requestContactData = async () => {
    try {
      const contactsData = await Contacts.getAll();
      const simplifiedContacts: Contact[] = contactsData.map((contact) => ({
        recordID: contact.recordID || "",
        name: contact.displayName,
        number: contact.phoneNumbers?.[0]?.number,
        hasThumbnail: contact.hasThumbnail,
      }));

      setContacts(simplifiedContacts);
    } catch (error: any) {
      const message = String(error?.message) || "Failed to fetch contacts.";
      showMessage({
        message: message,
        type: "danger",
      });
    } finally {
      setIsContactLoading(false);
    }
  };

  const handleRemoveContact = (contactToRemove: Contact) => {
    setSelectedContacts((prevContacts) =>
      prevContacts.filter(
        (contact) => contact.recordID !== contactToRemove.recordID
      )
    );
  };

  const onHandelAttachmentClick = useCallback(async () => {
    try {
      const pickerResult = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.allFiles],
        presentationStyle: "fullScreen",
        copyTo: "cachesDirectory",
      });

      if (
        pickerResult &&
        pickerResult.fileCopyUri &&
        pickerResult.name &&
        pickerResult.size &&
        pickerResult.type &&
        pickerResult.uri
      ) {
        if (pickerResult.size <= MAX_FILE_SIZE) {
          const fileName = pickerResult.name;
          const sourceUri = pickerResult.fileCopyUri;

          const documentsDir = RNBlobUtil.fs.dirs.DocumentDir;

          const uniqueFileName = await generateUniqueFileName(
            documentsDir,
            fileName
          );
          const localFilePath = `${documentsDir}/${uniqueFileName}`;

          await RNBlobUtil.fs.cp(sourceUri, localFilePath);

          const selectedDocumentInfo: DocumentPickerResponse = {
            ...pickerResult,
            name: uniqueFileName,
            uri: localFilePath,
          };

          setSelectedDocuments((prev) => [...prev, selectedDocumentInfo]);
        } else {
          showMessage({
            message: `File size exceeds the limit of ${MAX_FILE_SIZE}MB`,
            type: "danger",
          });
        }
      } else {
        showMessage({
          message: String(pickerResult?.copyError) || "Invalid document format",
          type: "danger",
        });
      }
    } catch (e: any) {
      showMessage({
        message: String(e?.message) || "Failed to pick document",
        type: "danger",
      });
    }
  }, []);

  const onRemoveDocument = (index: number) => {
    const updatedDocuments = selectedDocuments.filter(
      (_document, i) => i !== index
    );

    setSelectedDocuments(updatedDocuments);
  };

  const validateFields = () => {
    if (notificationType === "gmail") {
      if (!to) {
        showMessage({
          message: "'To' field is required.",
          type: "danger",
        });
        return false;
      }

      if (!validateMultipleEmails(to)) {
        showMessage({
          message: "Invalid email address(es) in 'To' field.",
          type: "danger",
        });
        return false;
      }

      if (!subject) {
        showMessage({
          message: "'Subject' field is required.",
          type: "danger",
        });
        return false;
      }

      if (!selectedDateAndTime?.date) {
        showMessage({
          message: "'Date' field is required.",
          type: "danger",
        });
        return false;
      }

      if (!selectedDateAndTime?.time) {
        showMessage({
          message: "'Time' field is required.",
          type: "danger",
        });
        return false;
      }
    } else {
      if (!selectedContacts?.length) {
        showMessage({
          message: "'Contact(s)' field is required.",
          type: "danger",
        });
        return false;
      }

      if (!message && notificationType !== "phone") {
        showMessage({
          message: "'Message' field is required.",
          type: "danger",
        });
        return false;
      }

      if (!selectedDateAndTime?.date) {
        showMessage({
          message: "'Date' field is required.",
          type: "danger",
        });
        return false;
      }

      if (!selectedDateAndTime?.time) {
        showMessage({
          message: "'Time' field is required.",
          type: "danger",
        });
        return false;
      }
    }

    return true;
  };

  const handleCreateNotification = async () => {
    try {
      if (validateFields()) {
        setIsLoading(true);

        const selectedDateTime = new Date(
          selectedDateAndTime.date!.getFullYear(),
          selectedDateAndTime.date!.getMonth(),
          selectedDateAndTime.date!.getDate(),
          selectedDateAndTime.time!.getHours(),
          selectedDateAndTime.time!.getMinutes()
        );

        const now = new Date();
        const tenSecondsFromNow = new Date(now.getTime() + 10 * 1000); // 10 seconds from now

        if (selectedDateTime < now) {
          showMessage({
            message: "The selected date and time cannot be in the past.",
            type: "danger",
          });
          setIsLoading(false);
          return;
        }

        if (selectedDateTime < tenSecondsFromNow) {
          showMessage({
            message:
              "The notification must be scheduled at least 10 seconds in the future.",
            type: "danger",
          });
          setIsLoading(false);
          return;
        }

        const extractedContacts: Contact[] = selectedContacts?.map(
          (contact) => ({
            name: contact.name,
            number: contact.number || "",
            recordID: contact?.recordID || "",
            thumbnailPath: contact?.thumbnailPath,
          })
        );

        const notificationData: Notification = {
          id: "",
          type: notificationType,
          message: message.toString() || "",
          date: selectedDateTime,
          subject: notificationType === "gmail" ? subject : "",
          toContact: extractedContacts,
          toMail: [to],
          attachments: selectedDocuments,
          scheduleFrequency: scheduleFrequency || "",
        };

        let notificationScheduleId;

        if (id) {
          const updated = await updateNotification({ ...notificationData, id });
          if (updated) {
            notificationScheduleId = id;
          } else {
            showMessage({
              message: "Failed to update notification.",
              type: "danger",
            });
            setIsLoading(false);
            return;
          }
        } else {
          notificationScheduleId =
            await scheduleNotificationWithNotifee(notificationData);
          console.log("notificationScheduleId: " + notificationScheduleId);
          if (notificationScheduleId?.trim()) {
            const data = {
              ...notificationData,
              id: notificationScheduleId,
            };
            const created = await createNotification(data);

            if (!created) {
              showMessage({
                message: String(created),
                type: "danger",
              });
              setIsLoading(false);
              return;
            }
          } else {
            showMessage({
              message: "Failed to schedule notification.",
              type: "danger",
            });
            setIsLoading(false);
            return;
          }
        }

        setIsLoading(false);
        navigation.navigate("ReminderScheduled", {
          themeColor: createViewColor,
          notification: { ...notificationData, id: notificationScheduleId },
        });
      }
    } catch (error: any) {
      showMessage({
        message: String(error?.message || error),
        type: "danger",
      });
      setIsLoading(false);
    }
  };

  const RenderHeader = () => {
    const onBackPress = () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    };

    return (
      <View style={style.headerContainer}>
        <Pressable onPress={onBackPress}>
          <Image
            tintColor={colors.text}
            source={AssetsPath.ic_leftArrow}
            style={style.headerIcon}
          />
        </Pressable>
        <Text style={[style.headerText, { color: createViewColor }]}>
          {formatNotificationType(notificationType)}
        </Text>
        <View />
      </View>
    );
  };

  return (
    <View style={style.container}>
      <View style={style.contentContainer}>
        <RenderHeader />

        <Animated.ScrollView
          style={style.itemsContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {notificationType === "gmail" && (
            <AddMailTo to={to} setTo={setTo} themeColor={createViewColor} />
          )}

          {notificationType === "gmail" && (
            <AddMailSubject
              subject={subject}
              setSubject={setSubject}
              themeColor={createViewColor}
            />
          )}

          {notificationType !== "gmail" && (
            <AddContact
              onContactPress={onHandelContactClick}
              themeColor={createViewColor}
              selectedContacts={selectedContacts}
              onRemoveContact={handleRemoveContact}
            />
          )}

          {notificationType !== "gmail" && (
            <AddMessage
              message={message}
              setMessage={setMessage}
              themeColor={createViewColor}
              title={notificationType === "phone" ? "Note" : "Message"}
            />
          )}

          {notificationType !== "phone" && (
            <AttachFile
              themeColor={createViewColor}
              onRemoveDocument={onRemoveDocument}
              selectedDocuments={selectedDocuments}
              onHandelAttachmentClick={onHandelAttachmentClick}
            />
          )}

          {(notificationType === "whatsapp" ||
            notificationType === "whatsappBusiness") && (
            <View style={style.recorderContainer}>
              <AudioMemoItem
                memo={memos?.[0] || []}
                themeColor={createViewColor}
                renderRightIcon={
                  <View>
                    {recording && (
                      <Animated.View
                        style={[style.recorderRecordWave, animatedRecordWave]}
                      />
                    )}

                    <Pressable
                      style={style.recorderRecordButton}
                      onPress={recording ? stopRecording : startRecording}
                    >
                      <Animated.Image
                        resizeMode="contain"
                        tintColor={createViewColor}
                        source={AssetsPath.ic_recordMic}
                        style={[
                          { width: "100%", height: "100%" },
                          // animatedRedCircle,
                        ]}
                      />
                    </Pressable>
                  </View>
                }
              />
            </View>
          )}

          <AddScheduleFrequency
            themeColor={createViewColor}
            scheduleFrequency={scheduleFrequency}
            setScheduleFrequency={setScheduleFrequency}
          />

          <AddDateAndTime
            themeColor={createViewColor}
            selectedDateAndTime={selectedDateAndTime}
            onDatePress={() => {
              Keyboard.dismiss();
              setPickerVisibleType("date");
            }}
            onTimePress={() => {
              Keyboard.dismiss();
              setPickerVisibleType("time");
            }}
          />

          {pickerVisibleType && (
            <RNDateTimePicker
              value={
                pickerVisibleType === "date"
                  ? selectedDateAndTime.date || new Date()
                  : selectedDateAndTime.time || new Date()
              }
              mode={pickerVisibleType}
              is24Hour={false}
              minimumDate={new Date()}
              themeVariant="dark"
              display="default"
              onChange={(event, selectedDate) => {
                setPickerVisibleType(null);

                if (event.type === "set" && selectedDate) {
                  const updatedDateTime =
                    pickerVisibleType === "date"
                      ? { date: selectedDate }
                      : { time: selectedDate };

                  setSelectedDateAndTime((prev) => ({
                    ...prev,
                    ...updatedDateTime,
                  }));
                }
              }}
              negativeButton={{ label: "Cancel", textColor: colors.text }}
            />
          )}
        </Animated.ScrollView>

        <Pressable
          disabled={isLoading}
          onPress={handleCreateNotification}
          style={[style.createButton, { backgroundColor: createViewColor }]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Text style={style.createButtonText}>
              {id ? "Update" : "Create"}
            </Text>
          )}
        </Pressable>
      </View>

      <ContactListModal
        contacts={contacts}
        isVisible={contactModalVisible}
        isContactLoading={isContactLoading}
        selectedContacts={selectedContacts}
        notificationType={notificationType}
        setSelectedContacts={setSelectedContacts}
        onClose={() => setContactModalVisible(false)}
      />
    </View>
  );
};

export default AddReminder;
