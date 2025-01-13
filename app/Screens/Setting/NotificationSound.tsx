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

// import React, { memo, useEffect, useRef, useState } from "react";
// import {
//   Animated,
//   FlatList,
//   Pressable,
//   StyleSheet,
//   Text,
//   View,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import WithBackHeader from "../../Components/WithBackHeader";
// import { FONTS } from "../../Constants/Theme";
// import { useAppContext } from "../../Contexts/ThemeProvider";
// import useThemeColors from "../../Hooks/useThemeMode";

// interface Sound {
//   id: string;
//   name: string;
//   duration: string;
//   category?: string;
// }

// const sounds: Sound[] = [
//   { id: "1", name: "Default", duration: "0:03", category: "System" },
//   { id: "2", name: "Classic", duration: "0:04", category: "System" },
//   { id: "3", name: "Chime", duration: "0:02", category: "Nature" },
//   { id: "4", name: "Bell", duration: "0:03", category: "Classic" },
//   { id: "5", name: "Digital", duration: "0:02", category: "Modern" },
// ];

// const NotificationSound = () => {
//   const style = styles();
//   const [selectedSound, setSelectedSound] = useState("1");
//   const [playingSound, setPlayingSound] = useState<string | null>(null);
//   const [animationsReady, setAnimationsReady] = useState(false);
// const bounceAnims = useRef<{ [key: string]: Animated.Value }>({});
// const waveAnims = useRef<{ [key: string]: Animated.Value[] }>({});

// useEffect(() => {
//   sounds.forEach((sound) => {
//     bounceAnims.current[sound.id] = new Animated.Value(1);
//     waveAnims.current[sound.id] = Array(5)
//       .fill(0)
//       .map(() => new Animated.Value(0));
//   });
//   setAnimationsReady(true);
// }, []);

// const animateWaves = (soundId: string) => {
//   const waves = waveAnims.current[soundId];
//   if (!waves) return;

//   waves.forEach((anim, i) => {
//     Animated.sequence([
//       Animated.delay(i * 100),
//       Animated.loop(
//         Animated.sequence([
//           Animated.timing(anim, {
//             toValue: 1,
//             duration: 500,
//             useNativeDriver: true,
//           }),
//           Animated.timing(anim, {
//             toValue: 0,
//             duration: 500,
//             useNativeDriver: true,
//           }),
//         ])
//       ),
//     ]).start();
//   });
// };

//   const handlePlay = (soundId: string) => {
//     if (!animationsReady) return;

//     if (playingSound === soundId) {
//       setPlayingSound(null);
//       waveAnims.current[soundId]?.forEach((anim) => anim.stopAnimation());
//     } else {
//       if (playingSound && waveAnims.current[playingSound]) {
//         waveAnims.current[playingSound].forEach((anim) => anim.stopAnimation());
//       }
//       setPlayingSound(soundId);
//       animateWaves(soundId);
//     }

//     Animated.sequence([
//       Animated.timing(bounceAnims.current[soundId], {
//         toValue: 0.9,
//         duration: 100,
//         useNativeDriver: true,
//       }),
//       Animated.spring(bounceAnims.current[soundId], {
//         toValue: 1,
//         friction: 4,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   };

//   const renderItem = ({ item }: { item: Sound }) => {
//     if (!animationsReady) return null;

//     const isPlaying = playingSound === item.id;
//     const isSelected = selectedSound === item.id;

//     return (
//       <Pressable
//         onPress={() => setSelectedSound(item.id)}
//         style={[style.soundCard, isSelected && style.selectedCard]}
//       >
//         <View style={style.cardContent}>
//           <Animated.View
//             style={[
//               style.playButtonContainer,
//               {
//                 transform: [{ scale: bounceAnims.current[item.id] }],
//               },
//             ]}
//           >
//             <Pressable
//               style={[style.playButton, isPlaying && style.playingButton]}
//               onPress={() => handlePlay(item.id)}
//             >
//               <Text
//                 style={[
//                   style.playButtonText,
//                   isPlaying && style.playingButtonText,
//                 ]}
//               >
//                 {isPlaying ? "■" : "▶"}
//               </Text>
//             </Pressable>
//           </Animated.View>

//           <View style={style.soundInfo}>
//             <Text style={style.soundName}>{item.name}</Text>
//             <View style={style.durationContainer}>
//               <Text style={style.duration}>{item.duration}</Text>
//               {item.category && (
//                 <View style={style.categoryBadge}>
//                   <Text style={style.categoryText}>{item.category}</Text>
//                 </View>
//               )}
//             </View>
//           </View>

//           <View style={style.rightSection}>
//             {isPlaying && (
//               <View style={style.waveContainer}>
//                 {waveAnims.current[item.id]?.map((anim, index) => (
// <Animated.View
//   key={index}
//   style={[
//     style.waveBar,
//     {
//       transform: [
//         {
//           scaleY: anim.interpolate({
//             inputRange: [0, 1],
//             outputRange: [0.3, 1],
//           }),
//         },
//       ],
//     },
//   ]}
// />
//                 ))}
//               </View>
//             )}
//             {isSelected && <View style={style.selectedIndicator} />}
//           </View>
//         </View>
//       </Pressable>
//     );
//   };

//   if (!animationsReady) {
//     return (
//       <SafeAreaView style={style.soundContainer}>
//         <WithBackHeader title="Notification Sounds" hideSwitch={true} />
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={style.soundContainer}>
//       <WithBackHeader title="Notification Sounds" hideSwitch={true} />
//       <FlatList
//         data={sounds}
//         renderItem={renderItem}
//         keyExtractor={(item) => item.id}
//         contentContainerStyle={style.list}
//         showsVerticalScrollIndicator={false}
//       />
//     </SafeAreaView>
//   );
// };

// const styles = () => {
//   const colors = useThemeColors();
//   const { theme } = useAppContext();

//   return StyleSheet.create({
//     soundContainer: {
//       flex: 1,
//       backgroundColor: colors.background,
//     },
//     list: {
//       padding: 16,
//     },
//     soundCard: {
//       borderRadius: 16,
//       padding: 16,
//       marginBottom: 12,
//       backgroundColor:
//         theme === "dark"
//           ? "rgba(45, 45, 48, 0.95)"
//           : "rgba(255, 255, 255, 0.95)",
//       shadowColor: theme === "dark" ? "#000" : "#2196F3",
//       shadowOffset: { width: 0, height: 2 },
//       shadowOpacity: theme === "dark" ? 0.3 : 0.08,
//       shadowRadius: 8,
//       elevation: 4,
//       borderWidth: 2,
//       borderColor:
//         theme === "dark" ? "rgba(60, 60, 65, 1)" : "rgba(230, 230, 255, 0.5)",
//     },
//     selectedCard: {
//       borderColor: theme === "dark" ? "#2196F3" : "#2196F3",
//       borderWidth: 2,
//       shadowColor: "#2196F3",
//       shadowOpacity: 0.2,
//     },
//     cardContent: {
//       flexDirection: "row",
//       alignItems: "center",
//       gap: 16,
//     },
//     playButtonContainer: {
//       shadowColor: "#2196F3",
//       shadowOffset: { width: 0, height: 2 },
//       shadowOpacity: 0.15,
//       shadowRadius: 4,
//     },
//     playButton: {
//       width: 44,
//       height: 44,
//       borderRadius: 22,
//       backgroundColor:
//         theme === "dark"
//           ? "rgba(33, 150, 243, 0.15)"
//           : "rgba(33, 150, 243, 0.1)",
//       justifyContent: "center",
//       alignItems: "center",
//       borderWidth: 1,
//       borderColor: "rgba(33, 150, 243, 0.2)",
//     },
//     playingButton: {
//       backgroundColor: "#2196F3",
//     },
//     playButtonText: {
//       color: "#2196F3",
//       fontSize: 18,
//       textAlign: "center",
//     },
//     playingButtonText: {
//       color: "white",
//     },
//     soundInfo: {
//       flex: 1,
//       gap: 4,
//     },
//     soundName: {
//       fontSize: 16,
//       fontFamily: FONTS.Medium,
//       color: colors.text,
//     },
//     durationContainer: {
//       flexDirection: "row",
//       alignItems: "center",
//       gap: 8,
//     },
//     duration: {
//       fontSize: 14,
//       color:
//         theme === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
//     },
//     categoryBadge: {
//       paddingHorizontal: 8,
//       paddingVertical: 2,
//       borderRadius: 12,
//       backgroundColor:
//         theme === "dark"
//           ? "rgba(33, 150, 243, 0.15)"
//           : "rgba(33, 150, 243, 0.1)",
//     },
//     categoryText: {
//       fontSize: 12,
//       color: "#2196F3",
//       fontFamily: FONTS.Medium,
//     },
//     rightSection: {
//       flexDirection: "row",
//       alignItems: "center",
//       gap: 12,
//     },
//     waveContainer: {
//       flexDirection: "row",
//       alignItems: "center",
//       height: 20,
//       gap: 3,
//     },
//     waveBar: {
//       width: 3,
//       height: 20,
//       backgroundColor: "#2196F3",
//       borderRadius: 1.5,
//     },
//     selectedIndicator: {
//       width: 8,
//       height: 8,
//       borderRadius: 4,
//       backgroundColor: "#2196F3",
//     },
//   });
// };

// export default memo(NotificationSound);
