import { FONTS } from '@Constants/Theme';
import useThemeColors from '@Hooks/useThemeMode';
import React, { FC, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AlarmNoteList from './AlarmNoteList';
import AlarmNotePickerModal from './AlarmNotePickerModal';

interface AlarmNoteSelectorProps {
  alarmNotes: string[];
  setAlarmNotes: React.Dispatch<React.SetStateAction<string[]>>;
  themeColor: string;
}

const AlarmNoteSelector: FC<AlarmNoteSelectorProps> = ({
  alarmNotes,
  setAlarmNotes,
  themeColor,
}) => {
  const colors = useThemeColors();
  const [showNotesPicker, setShowNotesPicker] = useState(false);

  return (
    <>
      <Pressable onPress={() => setShowNotesPicker(true)} style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Alarm note</Text>
      </Pressable>

      {alarmNotes.length === 0 ? (
        <Pressable
          onPress={() => setShowNotesPicker(true)}
          style={[
            styles.emptyToneField,
            { backgroundColor: colors.scheduleReminderCardBackground },
          ]}
        >
          <Text style={[styles.emptyToneFieldText, { color: colors.placeholderText }]}>
            Default(Alarm note)
          </Text>
        </Pressable>
      ) : (
        <View
          style={[styles.container, { backgroundColor: colors.scheduleReminderCardBackground }]}
        >
          <AlarmNoteList notes={alarmNotes} onReorder={setAlarmNotes} themeColor={themeColor} />
        </View>
      )}

      <AlarmNotePickerModal
        visible={showNotesPicker}
        onClose={() => setShowNotesPicker(false)}
        selectedNotes={alarmNotes}
        onSelect={setAlarmNotes}
        themeColor={themeColor}
      />
    </>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 19,
    fontFamily: FONTS.Medium,
    marginLeft: 4,
  },
  container: {
    borderRadius: 14,
    marginBottom: 20,
    padding: 12,
    overflow: 'visible',
    minHeight: 60,
  },
  emptyToneField: {
    width: '100%',
    minHeight: 50,
    borderRadius: 15,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyToneFieldText: {
    fontSize: 16,
    fontFamily: FONTS.Medium,
  },
});

export default AlarmNoteSelector;
