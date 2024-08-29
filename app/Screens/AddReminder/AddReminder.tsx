import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StatusBar,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { formatNotificationType } from "../../Components/ReminderCard";
import AssetsPath from "../../Global/AssetsPath";
import useNotificationIconColors from "../../Hooks/useNotificationIconColors";
import { NotificationType } from "../../Types/Interface";
import styles from "./styles";
import useThemeColors from "../../Theme/useThemeMode";
import Animated from "react-native-reanimated";
import AddContact from "./Components/AddContact";
import AddMessage from "./Components/AddMessage";
import AttachFile from "./Components/AttachFile";
import AddDateAndTime from "./Components/AddDateAndTime";
import useContactPermission from "../../Hooks/useContactPermission";
import Contacts from "react-native-contacts";
import Modal from "react-native-modal";
import ContactListModal from "./Components/ContactListModal";

type NotificationProps = {
  params: { notificationType: NotificationType };
};

export interface SimplifiedContact {
  recordID: string;
  displayName: string; // Full name of the contact
  phoneNumbers: {
    // List of phone numbers with labels
    label: string;
    number: string;
  }[];
  postalAddresses: {
    // Location details (address)
    street: string;
    city: string;
    state: string;
    postCode: string;
    country: string;
  }[];
  hasThumbnail: boolean;
  thumbnailPath: string;
}

const AddReminder = () => {
  const style = styles();
  const colors = useThemeColors();
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  const { params } = useRoute<RouteProp<NotificationProps, "params">>();

  const [contacts, setContacts] = useState<SimplifiedContact[]>([]);
  const [contactModalVisible, setContactModalVisible] = useState(false);

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
      console.log("Simplified Contacts:", simplifiedContacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      Alert.alert("Error", "Failed to fetch contacts.");
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
          contentContainerStyle={{ paddingBottom: 50 }}
          showsVerticalScrollIndicator={false}
        >
          <AddContact
            onContactPress={onHandelContactClick}
            themeColor={createViewColor}
          />
          <AddMessage themeColor={createViewColor} />
          <AttachFile themeColor={createViewColor} />
          <AddDateAndTime themeColor={createViewColor} />
        </Animated.ScrollView>

        <Pressable
          style={[style.createButton, { backgroundColor: createViewColor }]}
        >
          <Text style={style.createButtonText}>Create</Text>
        </Pressable>
      </View>

      <ContactListModal
        isVisible={contactModalVisible}
        onClose={() => setContactModalVisible(false)}
        contacts={contacts}
      />
    </View>
  );
};

console.log(StatusBar?.currentHeight);

export default AddReminder;
