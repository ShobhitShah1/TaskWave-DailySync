import AssetsPath from '@Constants/AssetsPath';
import { sounds } from '@Constants/Data';
import { FONTS } from '@Constants/Theme';
import useThemeColors from '@Hooks/useThemeMode';
import React, { FC, useCallback, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Audio } from 'expo-av';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';

interface AlarmNoteListProps {
  notes: string[];
  onReorder: (notes: string[]) => void;
  themeColor: string;
}

const AlarmNoteList: FC<AlarmNoteListProps> = ({ notes, onReorder, themeColor }) => {
  const colors = useThemeColors();
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const playingSoundRef = useRef<Audio.Sound | null>(null);

  const stopCurrentSound = useCallback(async () => {
    if (playingSoundRef.current) {
      await playingSoundRef.current.stopAsync().catch(() => undefined);
      await playingSoundRef.current.unloadAsync().catch(() => undefined);
      playingSoundRef.current = null;
    }
    setPlayingKey(null);
  }, []);

  const playPreview = useCallback(
    async (toneKey: string) => {
      if (playingKey === toneKey) {
        await stopCurrentSound();
        return;
      }
      await stopCurrentSound();
      const soundItem = sounds.find((s) => s.soundKeyName === toneKey);
      if (!soundItem?.uri) return;
      try {
        const { sound } = await Audio.Sound.createAsync(soundItem.uri);
        playingSoundRef.current = sound;
        setPlayingKey(toneKey);
        await sound.playAsync();
        sound.setOnPlaybackStatusUpdate((status) => {
          if ('didJustFinish' in status && status.didJustFinish) {
            playingSoundRef.current = null;
            setPlayingKey(null);
          }
        });
      } catch {
        setPlayingKey(null);
      }
    },
    [playingKey, stopCurrentSound],
  );

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<string>) => {
      const toneKey = item;
      const soundItem = sounds.find((s) => s.soundKeyName === toneKey);
      const label = soundItem
        ? soundItem.name === 'System default'
          ? 'Default(Alarm note)'
          : soundItem.name
        : toneKey;
      const canPlay = Boolean(soundItem?.canPlay);
      const isPlaying = playingKey === toneKey;

      return (
        <ScaleDecorator activeScale={1}>
          <Pressable
            onLongPress={drag}
            delayLongPress={150}
            style={[
              styles.noteCard,
              {
                backgroundColor: isActive
                  ? colors.alarmActiveCardBackground
                  : colors.alarmCardBackground,
                borderColor: isActive ? themeColor : 'transparent',
                borderWidth: isActive ? StyleSheet.hairlineWidth : 0,
                elevation: isActive ? 5 : 0,
                shadowColor: '#000',
                shadowOffset: isActive ? { width: 0, height: 2 } : { width: 0, height: 0 },
                shadowOpacity: isActive ? 0.15 : 0,
                shadowRadius: isActive ? 4 : 0,
              },
            ]}
          >
            <View style={styles.dragHandle}>
              <View style={styles.dragGrid}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dragDot, { backgroundColor: colors.alarmDragDot }]}
                  />
                ))}
              </View>
              <View style={[styles.separator, { backgroundColor: colors.alarmDragDot }]} />
            </View>

            <Text numberOfLines={1} style={[styles.noteText, { color: colors.alarmNoteText }]}>
              {label}
            </Text>

            {canPlay && (
              <Pressable onPress={() => playPreview(toneKey)} style={styles.actionBtn}>
                <Image
                  source={isPlaying ? AssetsPath.ic_pause : AssetsPath.ic_play}
                  style={styles.actionIcon}
                  tintColor={isPlaying ? themeColor : colors.alarmDragDot}
                />
              </Pressable>
            )}
          </Pressable>
        </ScaleDecorator>
      );
    },
    [playingKey, playPreview, themeColor],
  );

  if (notes.length === 0) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, overflow: 'visible' }}>
      <DraggableFlatList
        data={notes}
        onDragEnd={({ data }) => onReorder(data)}
        keyExtractor={(item, index) => `${item}-${index}`}
        renderItem={renderItem}
        scrollEnabled={false}
        containerStyle={{ overflow: 'visible' }}
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'visible',
  },
  noteCard: {
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  dragHandle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  dragGrid: {
    width: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    justifyContent: 'center',
  },
  dragDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  separator: {
    width: 1,
    height: 20,
    marginLeft: 8,
    opacity: 0.5,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.Medium,
  },
  actionBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
  },
});

export default AlarmNoteList;
