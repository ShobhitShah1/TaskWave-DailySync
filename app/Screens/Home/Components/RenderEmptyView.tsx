import React, { memo } from "react";
import { Image, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import AssetsPath from "../../../Constants/AssetsPath";
import TextString from "../../../Constants/TextString";
import styles from "../styles";

const RenderEmptyView = () => {
  const style = styles();
  return (
    <Animated.View style={[style.emptyViewContainer]}>
      <View
        style={{
          height: "30%",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
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
      </View>
      <Image
        source={AssetsPath.ic_emptyRocket}
        resizeMode="contain"
        style={style.emptyArrowRocket}
      />
    </Animated.View>
  );
};

export default memo(RenderEmptyView);
