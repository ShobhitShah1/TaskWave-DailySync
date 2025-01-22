import notifee from "@notifee/react-native";
import { useNavigation } from "@react-navigation/native";
import { Audio } from "expo-av";
import React, { memo, useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, Text } from "react-native";
import { showMessage } from "react-native-flash-message";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { sounds } from "../../Constants/Data";
import { storage } from "../../Contexts/ThemeProvider";
import { createNotificationChannel } from "../../Hooks/useReminder";
import { Sound } from "../../Types/Interface";
import HomeHeader from "../Home/Components/HomeHeader";
import SoundItem from "./Components/SoundItem";
import styles from "./styles";

const formatDuration = (milliseconds: number): string => {
  if (!milliseconds || isNaN(milliseconds)) return "0:00";

  const totalSeconds = Math.round(milliseconds / 1000);

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const paddedSeconds = seconds.toString().padStart(2, "0");

  return `${minutes}:${paddedSeconds}`;
};

const NotificationSound = () => {
  const style = styles();

  const navigation = useNavigation();
  const [selectedSound, setSelectedSound] = useState(
    storage.getString("notificationSound") || "default"
  );
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [soundsWithDuration, setSoundsWithDuration] = useState(sounds);
  const buttonTranslateY = useSharedValue(100);

  useEffect(() => {
    buttonTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    loadSoundDurations();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const loadSoundDurations = async () => {
    const updatedSounds = await Promise.all(
      sounds.map(async (soundItem) => {
        if (!soundItem.uri || !soundItem.canPlay) return soundItem;

        try {
          const { sound } = await Audio.Sound.createAsync(soundItem.uri, {
            shouldPlay: false,
          });
          const status = await sound.getStatusAsync();

          await sound.unloadAsync();

          if (status.isLoaded) {
            return {
              ...soundItem,
              duration: formatDuration(status.durationMillis || 0),
            };
          }
        } catch (error) {
          console.warn(`Error loading duration for ${soundItem.name}:`, error);
        }
        return soundItem;
      })
    );

    setSoundsWithDuration(updatedSounds);
  };

  const playSound = async (soundId: string) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const selectedSoundData = soundsWithDuration.find(
        (s) => s.soundKeyName === soundId
      );
      if (!selectedSoundData?.uri) return;

      const { sound: newSound } = await Audio.Sound.createAsync(
        selectedSoundData.uri,
        { shouldPlay: true }
      );

      setSound(newSound);
      setPlayingSound(soundId);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status && "didJustFinish" in status && status.didJustFinish) {
          setPlayingSound(null);
        }
      });
    } catch (error: any) {
      showMessage({
        message: error?.message?.toString(),
        type: "danger",
      });
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
        isSelected={selectedSound === item.soundKeyName}
        isPlaying={playingSound === item.soundKeyName}
        onSelect={() => setSelectedSound(item.soundKeyName)}
        onPlay={() => handlePlay(item.soundKeyName)}
      />
    ),
    [selectedSound, playingSound]
  );

  const handleOnPressSave = async () => {
    try {
      (await notifee.getChannels()).map(async (res) => {
        await notifee.deleteChannel(res.id);
      });

      storage.set("notificationSound", selectedSound);

      await createNotificationChannel();

      showMessage({
        message: "Notification sound changed successfully",
        type: "success",
      });

      navigation.goBack();
    } catch (error: any) {
      showMessage({
        message: error?.message?.toString(),
        type: "danger",
      });
    }
  };

  return (
    <SafeAreaView style={style.soundContainer}>
      <HomeHeader
        title={"Notification Sounds"}
        titleAlignment="left"
        leftIconType="back"
        showThemeSwitch={false}
      />
      <FlatList
        data={soundsWithDuration}
        renderItem={renderItem}
        keyExtractor={(item) => item.soundKeyName}
        contentContainerStyle={[style.list, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      />

      <Animated.View style={[style.bottomButton, saveButtonStyle]}>
        <Pressable style={style.saveButton} onPress={handleOnPressSave}>
          <Text style={style.saveButtonText}>Save Changes</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
};

export default memo(NotificationSound);
