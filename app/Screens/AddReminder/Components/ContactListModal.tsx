import { FlashList } from "@shopify/flash-list";
import React, { FC, memo, useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Modal from "react-native-modal";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import AssetsPath from "../../../Global/AssetsPath";
import useThemeColors from "../../../Theme/useThemeMode";
import { Contact, ContactListModalProps } from "../../../Types/Interface";
import styles from "../styles";
import RenderContactList from "./RenderContactList";

const { height } = Dimensions.get("window");

const funMessages = [
  "Rounding up your stellar contacts... 🌟",
  "Polishing those digits to perfection... ✨",
  "Alphabetizing with flair and panache... 🎩",
  "Curating your social galaxy... 🌌",
  "Decoding contact hieroglyphics... 🔍",
  "Preparing your VIP list... 🎭",
  "Organizing your digital tribe... 🏞️",
  "Summoning your contact wizards... 🧙‍♂️",
  "Dusting off the phonebook... 📚",
  "Tuning up the contact symphony... 🎶",
];

const ContactListModal: FC<ContactListModalProps> = ({
  isVisible,
  onClose,
  contacts,
  selectedContacts,
  isContactLoading,
  notificationType,
  setSelectedContacts,
}) => {
  const style = styles();
  const colors = useThemeColors();
  const [searchText, setSearchText] = useState("");
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // const opacity = useSharedValue(0);
  // const translateY = useSharedValue(20);

  console.log("contacts", contacts.length);
  const filteredContacts = useMemo(
    () =>
      contacts.filter((contact) => {
        const isValidNumber =
          contact.number &&
          // Valid if it starts with +91 and has digits after that
          (/^\+91\d{10}$/.test(contact.number) ||
            // Valid if it starts with + and has digits after that
            /^\+\d{1,3}\d{7,14}$/.test(contact.number) ||
            // Valid if it starts with a non-zero digit and only contains digits
            /^[1-9]\d{6,14}$/.test(contact.number));
        return (
          isValidNumber &&
          contact.name.toLowerCase().includes(searchText.toLowerCase())
        );
      }),
    [contacts, searchText]
  );

  const handleSelectContact = useCallback(
    (contact: Contact) => {
      setSelectedContacts((prevSelectedContacts) => {
        if (
          notificationType === "whatsapp" ||
          notificationType === "whatsappBusiness" ||
          notificationType === "phone"
        ) {
          onClose();
          return [contact];
        } else {
          return prevSelectedContacts.some(
            (c) => c.recordID === contact.recordID
          )
            ? prevSelectedContacts.filter(
                (c) => c.recordID !== contact.recordID
              )
            : [...prevSelectedContacts, contact];
        }
      });
    },
    [notificationType, setSelectedContacts]
  );

  // const animatedStyle = useAnimatedStyle(() => {
  //   return {
  //     opacity: opacity.value,
  //     transform: [{ translateY: translateY.value }],
  //   };
  // });

  // const cycleMessage = useCallback(() => {
  //   setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % funMessages.length);
  // }, []);

  // const animateMessage = useCallback(() => {
  //   const duration = 500;
  //   const easing = Easing.bezier(0.25, 0.1, 0.25, 1);

  //   translateY.value = withSequence(
  //     withTiming(0, { duration: duration / 2, easing }),
  //     withTiming(10, { duration: duration / 2, easing })
  //   );

  //   opacity.value = withSequence(
  //     withTiming(0, { duration: duration / 2, easing }),
  //     withDelay(duration / 2, withTiming(1, { duration: duration / 2, easing }))
  //   );

  //   setTimeout(() => {
  //     runOnJS(animateMessage)();
  //     runOnJS(cycleMessage)();
  //   }, 3000);
  // }, [opacity, translateY, cycleMessage]);

  // useEffect(() => {
  //   if (isContactLoading) {
  //     animateMessage();
  //   }
  // }, [isContactLoading, animateMessage]);

  return (
    <Modal
      isVisible={isVisible}
      statusBarTranslucent={true}
      animationIn={"slideInUp"}
      animationOut={"slideOutDown"}
      animationInTiming={600}
      animationOutTiming={300}
      useNativeDriver={true}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      style={{ margin: 0, justifyContent: "flex-end" }}
      deviceHeight={height + (StatusBar.currentHeight || 30)}
    >
      <View style={[style.contactModalContainer, { paddingTop: 50 }]}>
        <View style={style.contactHeaderContainer}>
          <TouchableOpacity onPress={onClose}>
            <Image
              tintColor={colors.text}
              source={AssetsPath.ic_leftArrow}
              style={style.contactHeaderIcon}
            />
          </TouchableOpacity>
        </View>

        <TextInput
          placeholder="Search.."
          placeholderTextColor={colors.placeholderText}
          style={[style.contactSearchInput, { color: colors.text }]}
          value={searchText}
          onChangeText={setSearchText}
        />

        {isContactLoading ? (
          <Animated.View
            entering={FadeIn.springify().damping(200)}
            exiting={FadeOut.springify().damping(200)}
            style={style.contactLoadingContainer}
          >
            <ActivityIndicator size={"large"} color={colors.text} />
            <Text
              style={[style.loadingText, { color: colors.text, marginTop: 10 }]}
            >
              Loading contacts...
            </Text>
            {/* <Animated.View style={[style.loadingContent, animatedStyle]}>
              <Text style={[style.loadingEmoji, { color: colors.text }]}>
                {funMessages[currentMessageIndex].split(" ").pop()}
              </Text>
              <Animated.Text
                style={[style.loadingText, { color: colors.text }]}
              >
                {funMessages[currentMessageIndex]
                  .split(" ")
                  .slice(0, -1)
                  .join(" ")}
              </Animated.Text>
            </Animated.View> */}
          </Animated.View>
        ) : (
          <FlashList
            data={filteredContacts}
            extraData={selectedContacts}
            estimatedItemSize={200}
            keyExtractor={(item, index) => index.toString()}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 80 }}
            renderItem={({ item }) => (
              <RenderContactList
                contacts={item}
                selectedContacts={selectedContacts}
                handleSelectContact={handleSelectContact}
              />
            )}
          />
        )}

        <LinearGradient
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          colors={[
            "rgba(0,0,0,1)", // Opaque at the bottom
            "rgba(0,0,0,0.95)", // Adding more stops for a smoother effect
            "rgba(0,0,0,0.9)",
            "rgba(0,0,0,0.8)",
            "rgba(0,0,0,0.7)",
            "rgba(0,0,0,0.6)",
            "rgba(0,0,0,0.5)",
            "rgba(0,0,0,0.4)",
            "rgba(0,0,0,0.3)",
            "rgba(0,0,0,0.2)",
            "rgba(0,0,0,0.1)", // Nearly transparent
            "rgba(0,0,0,0)", // Fully transparent
          ]}
          style={style.contactDoneButton}
        >
          <Pressable style={[style.contactDoneButtonView]} onPress={onClose}>
            <Text style={style.contactDoneButtonText}>Done</Text>
          </Pressable>
        </LinearGradient>
      </View>
    </Modal>
  );
};

export default memo(ContactListModal);
