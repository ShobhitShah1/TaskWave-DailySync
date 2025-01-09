import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import useThemeColors from "../../Hooks/useThemeMode";
import WithBackHeader from "../../Components/WithBackHeader";
import { FONTS, SIZE } from "../../Constants/Theme";
import WaveBar from "../../Components/WaveBar";

interface PlayingStates {
  [key: string]: boolean;
}

const sounds = [
  { id: "1", name: "Default", duration: "0:03" },
  { id: "2", name: "Classic", duration: "0:04" },
  { id: "3", name: "Chime", duration: "0:02" },
  { id: "4", name: "Bell", duration: "0:03" },
  { id: "5", name: "Digital", duration: "0:02" },
];

const NotificationSound = () => {
  const style = styles();
  const [selectedSound, setSelectedSound] = useState("1");
  const [playingStates, setPlayingStates] = useState<PlayingStates>({});

  const renderItem = ({ item }: { item: any }) => (
    <Pressable
      style={[style.soundCard, selectedSound === item.id && style.selectedCard]}
      onPress={() => setSelectedSound(item.id)}
    >
      <View style={style.cardContent}>
        <View style={style.leftSection}>
          <TouchableOpacity
            style={[
              style.playButton,
              playingStates?.[item?.id] && style.playingButton,
            ]}
            onPress={() => {
              setPlayingStates((prev) => ({
                ...prev,
                [item.id]: !prev?.[item.id],
              }));
            }}
          >
            <Text style={style.playButtonText}>
              {playingStates?.[item?.id] ? "❙❙" : "▶"}
            </Text>
          </TouchableOpacity>
          <View style={style.soundInfo}>
            <Text style={style.soundName}>{item.name}</Text>
            <Text style={style.duration}>{item.duration}</Text>
          </View>
        </View>

        <View style={style.rightSection}>
          {playingStates?.[item?.id] && (
            <View style={style.waveContainer}>
              {[0, 1, 2, 3, 4].map((i) => (
                <WaveBar key={i} delay={i} />
              ))}
            </View>
          )}
          {selectedSound === item.id && (
            <View style={style.selectedDot}>
              <View style={style.innerDot} />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={style.container}>
      <WithBackHeader title={"Notification Sound"} hideSwitch={true} />

      <FlatList
        data={sounds}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={style.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default NotificationSound;

const styles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    wrapper: {
      width: SIZE.appContainWidth,
      alignSelf: "center",
      marginVertical: 15,
      gap: 10,
    },
    list: {
      padding: 16,
    },
    soundCard: {
      backgroundColor: colors.reminderCardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
      borderWidth: 2,
      borderColor: "transparent",
    },
    selectedCard: {
      borderWidth: 2,
      borderColor: "#2196F3",
    },
    cardContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    leftSection: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    rightSection: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    playButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "#E3F2FD",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    playingButton: {
      backgroundColor: "#FFEBEE",
    },
    playButtonText: {
      color: "#2196F3",
      fontSize: 18,
      bottom: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    soundInfo: {
      flex: 1,
    },
    soundName: {
      fontSize: 16,
      fontFamily: FONTS.Medium,
      marginBottom: 4,
      color: colors.text,
    },
    duration: {
      fontSize: 14,
      color: "#666",
    },
    waveContainer: {
      flexDirection: "row",
      alignItems: "center",
      height: 20,
      gap: 2,
    },
    waveBar: {
      width: 3,
      height: 16,
      backgroundColor: "#2196F3",
      borderRadius: 1.5,
    },
    selectedDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: "#2196F3",
      justifyContent: "center",
      alignItems: "center",
    },
    innerDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "white",
    },
  });
};
