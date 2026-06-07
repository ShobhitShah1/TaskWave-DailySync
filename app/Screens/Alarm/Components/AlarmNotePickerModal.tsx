import React, { FC, useState, useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, FlatList, Image } from 'react-native';
import { Audio } from 'expo-av';
import useThemeColors from '@Hooks/useThemeMode';
import { FONTS } from '@Constants/Theme';
import { sounds } from '@Constants/Data';
import AssetsPath from '@Constants/AssetsPath';

interface AlarmNotePickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedNotes: string[];
  onSelect: (notes: string[]) => void;
  themeColor: string;
}

const AlarmNotePickerModal: FC<AlarmNotePickerModalProps> = ({
  visible,
  onClose,
  selectedNotes,
  onSelect,
  themeColor,
}) => {
  const colors = useThemeColors();
  const [currentNotes, setCurrentNotes] = useState<string[]>(selectedNotes);
  const [playingSound, setPlayingSound] = useState<Audio.Sound | null>(null);
  const [playingKey, setPlayingKey] = useState<string | null>(null);

  useEffect(() => {
    setCurrentNotes(selectedNotes);
  }, [selectedNotes, visible]);

  useEffect(() => {
    return () => {
      if (playingSound) {
        playingSound.unloadAsync();
      }
    };
  }, [playingSound]);

  const playPreview = async (toneKey: string) => {
    try {
      if (playingSound) {
        await playingSound.stopAsync();
        await playingSound.unloadAsync();
        setPlayingSound(null);
        setPlayingKey(null);
        if (playingKey === toneKey) return;
      }

      const soundItem = sounds.find((s) => s.soundKeyName === toneKey);
      if (soundItem && soundItem.uri) {
        const { sound } = await Audio.Sound.createAsync(soundItem.uri);
        setPlayingSound(sound);
        setPlayingKey(toneKey);
        await sound.playAsync();
        sound.setOnPlaybackStatusUpdate((status) => {
          if ('didJustFinish' in status && status.didJustFinish) {
            setPlayingKey(null);
          }
        });
      }
    } catch (error) {
      console.log('Error playing preview:', error);
    }
  };

  const toggleNote = (toneKey: string) => {
    setCurrentNotes((prev) =>
      prev.includes(toneKey) ? prev.filter((k) => k !== toneKey) : [...prev, toneKey],
    );
  };

  const handleDone = () => {
    onSelect(currentNotes);
    onClose();
  };

  const renderItem = ({ item }: { item: (typeof sounds)[0] }) => {
    const isSelected = currentNotes.includes(item.soundKeyName);
    const isPlaying = playingKey === item.soundKeyName;

    return (
      <Pressable
        onPress={() => toggleNote(item.soundKeyName)}
        style={[styles.itemCard, { backgroundColor: colors.alarmCardBackground }]}
      >
        <Text style={[styles.itemName, { color: colors.text }]}>
          {item.name === 'System default' ? 'Default(Alarm note)' : item.name}
        </Text>
        <View style={{ flex: 1 }} />

        {item.canPlay && (
          <Pressable onPress={() => playPreview(item.soundKeyName)} style={styles.playBtn}>
            <Image
              source={isPlaying ? AssetsPath.ic_pause : AssetsPath.ic_play}
              style={styles.playIcon}
              tintColor="#FFFFFF"
            />
          </Pressable>
        )}

        <View
          style={[
            styles.radioOuter,
            isSelected
              ? { backgroundColor: '#4C66FF', borderColor: '#4C66FF' }
              : { borderColor: '#707070' },
          ]}
        >
          {isSelected && <Text style={styles.checkMark}>✓</Text>}
        </View>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
          <FlatList
            data={sounds}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          <Pressable onPress={handleDone} style={[styles.doneBtn, { backgroundColor: '#4C66FF' }]}>
            <Text style={styles.doneBtnText}>
              Done{currentNotes.length > 0 ? ` (${currentNotes.length})` : ''}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  dismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    borderRadius: 25,
    padding: 16,
    maxHeight: '80%',
  },
  listContent: {
    paddingBottom: 8,
  },
  itemCard: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontFamily: FONTS.Medium,
  },
  playBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  playIcon: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: FONTS.Bold,
  },
  doneBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  doneBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: FONTS.Bold,
  },
});

export default AlarmNotePickerModal;
