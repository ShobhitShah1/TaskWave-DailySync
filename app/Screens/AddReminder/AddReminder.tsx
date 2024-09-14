import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, Image, Pressable, StatusBar, Text, View } from "react-native";
import Contacts from "react-native-contacts";
import Animated from "react-native-reanimated";
import AssetsPath from "../../Global/AssetsPath";
import useContactPermission from "../../Hooks/useContactPermission";
import useNotificationIconColors from "../../Hooks/useNotificationIconColors";
import useThemeColors from "../../Theme/useThemeMode";
import { NotificationType, SimplifiedContact } from "../../Types/Interface";
import AddContact from "./Components/AddContact";
import AddDateAndTime from "./Components/AddDateAndTime";
import AddMessage from "./Components/AddMessage";
import AttachFile from "./Components/AttachFile";
import ContactListModal from "./Components/ContactListModal";
import styles from "./styles";
import DocumentPicker, {
  DocumentPickerResponse,
} from "react-native-document-picker";
import RNDateTimePicker from "@react-native-community/datetimepicker";
import { formatNotificationType } from "../../Utils/formatNotificationType";
import AddMailTo from "./Components/AddMailTo";
import AddMailSubject from "./Components/AddMailSubject";

type NotificationProps = {
  params: { notificationType: NotificationType };
};

const AddReminder = () => {
  const style = styles();
  const colors = useThemeColors();
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<NotificationProps, "params">>();

  const [contacts, setContacts] = useState<SimplifiedContact[]>([]);
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

  const notificationType = useMemo(() => {
    return params.notificationType;
  }, [params]);

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
      console.log("Contact ERROR:", error?.message);
    }
  };

  const requestContactData = async () => {
    try {
      const contactsData = await Contacts.getAll();
      const simplifiedContacts = contactsData.map((contact) => ({
        recordID: contact.recordID,
        displayName: contact.displayName,
        hasThumbnail: contact.hasThumbnail,
        thumbnailPath: contact.thumbnailPath,
        phoneNumbers: contact.phoneNumbers.map((phone) => ({
          label: phone.label,
          number: phone.number,
        })),
        postalAddresses: contact.postalAddresses.map((address) => ({
          street: address.street,
          city: address.city,
          state: address.state,
          postCode: address.postCode,
          country: address.country,
        })),
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

  const onHandelAttachmentClick = useCallback(async () => {
    try {
      const result = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.allFiles],
      });

      setSelectedDocuments((prev) => [...prev, result]);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log("User canceled document picker");
      } else {
        console.error("Document picker error:", err);
      }
    }
  }, []);

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
            />
          )}

          {notificationType !== "gmail" && (
            <AddMessage
              message={message}
              setMessage={setMessage}
              themeColor={createViewColor}
            />
          )}

          <AttachFile
            themeColor={createViewColor}
            selectedDocuments={selectedDocuments}
            onHandelAttachmentClick={onHandelAttachmentClick}
          />

          <AddDateAndTime
            themeColor={createViewColor}
            onDatePress={() => setPickerVisibleType("date")}
            onTimePress={() => setPickerVisibleType("time")}
          />

          {pickerVisibleType && (
            <RNDateTimePicker
              value={new Date()}
              mode={pickerVisibleType}
              is24Hour={true}
              themeVariant="dark"
              display="default"
              onChange={(event, date) => {
                setPickerVisibleType(null);
              }}
              negativeButton={{ label: "Cancel", textColor: colors.text }}
            />
          )}
        </Animated.ScrollView>

        <Pressable
          onPress={() =>
            navigation.navigate("ReminderScheduled", {
              themeColor: createViewColor,
            })
          }
          style={[style.createButton, { backgroundColor: createViewColor }]}
        >
          <Text style={style.createButtonText}>Create</Text>
        </Pressable>
      </View>

      <ContactListModal
        contacts={contacts}
        isVisible={contactModalVisible}
        onClose={() => setContactModalVisible(false)}
      />
    </View>
  );
};

export default AddReminder;
