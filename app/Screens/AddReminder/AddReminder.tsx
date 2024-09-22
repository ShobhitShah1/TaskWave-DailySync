import RNDateTimePicker from "@react-native-community/datetimepicker";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Pressable,
  Text,
  View,
} from "react-native";
import Contacts from "react-native-contacts";
import DocumentPicker, {
  DocumentPickerResponse,
} from "react-native-document-picker";
import Animated from "react-native-reanimated";
import AssetsPath from "../../Global/AssetsPath";
import useContactPermission from "../../Hooks/useContactPermission";
import useNotificationIconColors from "../../Hooks/useNotificationIconColors";
import useDatabase, {
  scheduleNotificationWithNotifee,
} from "../../Hooks/useReminder";
import useThemeColors from "../../Theme/useThemeMode";
import { Contact, Notification, NotificationType } from "../../Types/Interface";
import { formatNotificationType } from "../../Utils/formatNotificationType";
import { validateEmail } from "../../Utils/validateEmail";
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

  const [isLoading, setIsLoading] = useState(false);

  const { createViewColor } = useNotificationIconColors(notificationType);
  const { requestPermission, checkPermissionStatus } = useContactPermission();

  const onHandelContactClick = async () => {
    try {
      const isPermissionEnable = await checkPermissionStatus();

      if (!isPermissionEnable) {
        await requestPermission().then((res) => {
          if (res) requestContactData();
        });

        return;
      }

      requestContactData();
    } catch (error: any) {
      Alert.alert("Error", error?.message);
    }
  };

  const requestContactData = async () => {
    try {
      const contactsData = await Contacts.getAll();
      const simplifiedContacts: Contact[] = contactsData.map((contact) => ({
        recordID: contact.recordID,
        name: contact.displayName,
        number: contact.phoneNumbers?.[0]?.number,
        hasThumbnail: contact.hasThumbnail,
      }));

      setContacts(simplifiedContacts);
      setContactModalVisible(true);
    } catch (error: any) {
      Alert.alert(
        "Error",
        String(error?.message) || "Failed to fetch contacts."
      );
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
      const result = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.allFiles],
      });

      setSelectedDocuments((prev) => [...prev, result]);
    } catch (err) {}
  }, []);

  const onRemoveDocument = (index: number) => {
    const updatedDocuments = selectedDocuments.filter(
      (_document, i) => i !== index
    );

    setSelectedDocuments(updatedDocuments);
  };

  const validateMultipleEmails = (emailString: string) => {
    const emails = emailString.split(",").map((email) => email.trim());
    for (let email of emails) {
      if (!validateEmail(email)) {
        return false;
      }
    }
    return true;
  };

  const validateFields = () => {
    if (notificationType === "gmail") {
      if (!to) {
        Alert.alert("Validation Error", "'To' field is required.");
        return false;
      }

      if (!validateMultipleEmails(to)) {
        Alert.alert(
          "Validation Error",
          "Invalid email address(es) in 'To' field."
        );
        return false;
      }

      if (!subject) {
        Alert.alert("Validation Error", "'Subject' field is required.");
        return false;
      }

      if (!selectedDateAndTime?.date) {
        Alert.alert("Validation Error", "'Date' field is required.");
        return false;
      }

      if (!selectedDateAndTime?.time) {
        Alert.alert("Validation Error", "'Time' field is required.");
        return false;
      }
    } else {
      if (!selectedContacts?.length) {
        Alert.alert("Validation Error", "'Contact(s)' field is required.");
        return false;
      }

      if (!message && notificationType !== "phone") {
        Alert.alert("Validation Error", "'Message' field is required.");
        return false;
      }

      if (!selectedDateAndTime?.date) {
        Alert.alert("Validation Error", "'Date' field is required.");
        return false;
      }

      if (!selectedDateAndTime?.time) {
        Alert.alert("Validation Error", "'Time' field is required.");
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
          Alert.alert(
            "Error",
            "The selected date and time cannot be in the past."
          );
          setIsLoading(false);
          return;
        }

        if (selectedDateTime < tenSecondsFromNow) {
          Alert.alert(
            "Error",
            "The notification must be scheduled at least 1 minute in the future."
          );
          setIsLoading(false);
          return;
        }

        const extractedContacts: Contact[] = selectedContacts?.map(
          (contact) => ({
            name: contact.name,
            number: contact.number || "",
            recordID: contact?.recordID,
            thumbnailPath: contact?.thumbnailPath,
          })
        );

        const notificationData: Notification = {
          type: notificationType,
          message: message || "",
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
            Alert.alert("Error", "Failed to update notification.");
            return;
          }
        } else {
          notificationScheduleId =
            await scheduleNotificationWithNotifee(notificationData);

          if (notificationScheduleId?.trim()) {
            const data = {
              ...notificationData,
              id: notificationScheduleId,
            };
            const created = await createNotification(data);

            if (!created) {
              Alert.alert("Error", String(created));
              return;
            }
          } else {
            Alert.alert("Error", "Failed to schedule notification.");
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
      Alert.alert("Error", String(error?.message));
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
          contentContainerStyle={{ paddingBottom: 50 }}
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

          {notificationType !== "gmail" && notificationType !== "phone" && (
            <AddMessage
              message={message}
              setMessage={setMessage}
              themeColor={createViewColor}
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
        onClose={() => setContactModalVisible(false)}
        setSelectedContacts={setSelectedContacts}
        selectedContacts={selectedContacts}
        notificationType={notificationType}
      />
    </View>
  );
};

export default AddReminder;
