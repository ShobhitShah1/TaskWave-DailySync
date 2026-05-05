import React, { FC } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { FONTS } from '@Constants/Theme';
import useThemeColors from '@Hooks/useThemeMode';
import AssetsPath from '@Constants/AssetsPath';

interface AlarmNoteListProps {
  notes: string[];
}

const AlarmNoteList: FC<AlarmNoteListProps> = ({ notes }) => {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      {notes.map((note, index) => (
        <View 
          key={index} 
          style={[styles.noteCard, { backgroundColor: colors.alarmCardBackground }]}
        >
          <View style={styles.dragHandle}>
            <View style={[styles.dot, { backgroundColor: colors.placeholderText }]} />
            <View style={[styles.dot, { backgroundColor: colors.placeholderText }]} />
            <View style={[styles.dot, { backgroundColor: colors.placeholderText }]} />
          </View>
          <Text 
            numberOfLines={1} 
            style={[styles.noteText, { color: colors.text }]}
          >
            {note}
          </Text>
          <Pressable style={styles.playButton}>
             <Image 
               source={AssetsPath.ic_play} 
               style={styles.playIcon} 
               tintColor="#FFF" 
             />
          </Pressable>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
  },
  noteCard: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  dragHandle: {
    width: 20,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    rowGap: 3,
    marginRight: 8,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.Medium,
  },
  playButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
  },
});

export default AlarmNoteList;
