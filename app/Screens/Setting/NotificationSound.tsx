import { Audio } from "expo-av";
import React, { memo, useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import WithBackHeader from "../../Components/WithBackHeader";
import SoundItem from "./Components/SoundItem";
import styles from "./styles";

export interface Sound {
  id: string;
  name: string;
  duration: string;
  category?: string;
  uri: string;
}

const sounds: Sound[] = [
  {
    id: "1",
    name: "Default",
    duration: "0:03",
    category: "System",
    uri: "https://codeskulptor-demos.commondatastorage.googleapis.com/pang/paza-moduless.mp3",
  },
  {
    id: "2",
    name: "Classic",
    duration: "0:04",
    category: "System",
    uri: "https://codeskulptor-demos.commondatastorage.googleapis.com/pang/paza-moduless.mp3",
  },
  {
    id: "3",
    name: "Chime",
    duration: "0:02",
    category: "Nature",
    uri: "https://codeskulptor-demos.commondatastorage.googleapis.com/pang/paza-moduless.mp3",
  },
  {
    id: "4",
    name: "Bell",
    duration: "0:03",
    category: "Classic",
    uri: "https://codeskulptor-demos.commondatastorage.googleapis.com/pang/paza-moduless.mp3",
  },
  {
    id: "5",
    name: "Digital",
    duration: "0:02",
    category: "Modern",
    uri: "https://codeskulptor-demos.commondatastorage.googleapis.com/pang/paza-moduless.mp3",
  },
];

const NotificationSound = () => {
  const style = styles();
  const [selectedSound, setSelectedSound] = useState("1");
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const buttonTranslateY = useSharedValue(100);

  useEffect(() => {
    buttonTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const playSound = async (soundId: string) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const selectedSoundData = sounds.find((s) => s.id === soundId);
      if (!selectedSoundData) return;

      const { sound: newSound } = await Audio.Sound.createAsync({
        uri: selectedSoundData.uri,
      });

      setSound(newSound);

      await newSound.playAsync();
      setPlayingSound(soundId);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status && "didJustFinish" in status && status.didJustFinish) {
          setPlayingSound(null);
        }
      });
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  const handlePlay = async (soundId: string) => {
    if (playingSound === soundId) {
      if (sound) {
        await sound.stopAsync();
        setPlayingSound(null);
      }
    } else {
      await playSound(soundId);
    }
  };

  const saveButtonStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  const renderItem = useCallback(
    ({ item }: { item: Sound }) => (
      <SoundItem
        item={item}
        isSelected={selectedSound === item.id}
        isPlaying={playingSound === item.id}
        onSelect={() => setSelectedSound(item.id)}
        onPlay={() => handlePlay(item.id)}
      />
    ),
    [selectedSound, playingSound]
  );

  return (
    <SafeAreaView style={style.soundContainer}>
      <WithBackHeader title="Notification Sounds" hideSwitch={true} />

      <FlatList
        data={sounds}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[style.list, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      />

      <Animated.View style={[style.bottomButton, saveButtonStyle]}>
        <Pressable style={style.saveButton} onPress={() => {}}>
          <Text style={style.saveButtonText}>Save Changes</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
};

export default memo(NotificationSound);
