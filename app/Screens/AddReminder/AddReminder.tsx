import { RouteProp, useRoute } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { formatNotificationType } from "../../Components/ReminderCard";
import AssetsPath from "../../Global/AssetsPath";
import useNotificationIconColors from "../../Hooks/useNotificationIconColors";
import { NotificationType } from "../../Types/Interface";
import styles from "./styles";

type NotificationProps = {
  params: {
    notificationType: NotificationType;
  };
};

const AddReminder = () => {
  const style = styles();
  const { params } = useRoute<RouteProp<NotificationProps, "params">>();

  const notificationType = useMemo(() => {
    return params.notificationType;
  }, [params]);

  const { createViewColor } = useNotificationIconColors(notificationType);

  const RenderHeader = () => {
    return (
      <View style={style.headerContainer}>
        <Image source={AssetsPath.ic_leftArrow} style={style.headerIcon} />
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
