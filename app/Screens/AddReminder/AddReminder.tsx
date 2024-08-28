import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Image, Pressable, Text, View } from "react-native";
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
import useContactPermission from "../../Hooks/useContactPermisstion";
import Contacts from "react-native-contacts";

type NotificationProps = {
  params: {
    notificationType: NotificationType;
  };
};

const AddReminder = () => {
  const style = styles();
  const colors = useThemeColors();
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<NotificationProps, "params">>();

  const notificationType = useMemo(() => {
    return params.notificationType;
  }, [params]);

  const { createViewColor } = useNotificationIconColors(notificationType);

  const onContactFetch = async () => {
    try {
      const contacts = await Contacts.getAll();
      console.log("Contacts:", contacts);
    } catch (error: any) {
      console.log("Contact ERROR:", error?.message);
    }
  };

  const { permissionStatus, checkPermissionStatus } =
    useContactPermission(onContactFetch);

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
            onContactPress={onContactFetch}
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
    </View>
  );
};

export default AddReminder;
