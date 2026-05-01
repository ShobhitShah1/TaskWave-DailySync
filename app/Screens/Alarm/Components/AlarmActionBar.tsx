import AssetsPath from '@Constants/AssetsPath';
import { FONTS } from '@Constants/Theme';
import useThemeColors from '@Hooks/useThemeMode';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

interface AlarmActionBarProps {
  onDeletePress?: () => void;
  onEditPress?: () => void;
  deleteLabel?: string;
}

const AlarmActionBar: React.FC<AlarmActionBarProps> = ({
  onDeletePress,
  onEditPress,
  deleteLabel = 'Delete',
}) => {
  const colors = useThemeColors();

  return (
    <View style={styles.bottomButtons}>
      <Pressable onPress={onDeletePress} style={[styles.baseButton, styles.deleteButton]}>
        <Image source={AssetsPath.ic_delete} style={styles.buttonIcon} tintColor={colors.white} />
        <Text style={styles.buttonText}>{deleteLabel}</Text>
      </Pressable>

      <Pressable
        disabled={!onEditPress}
        onPress={onEditPress}
        style={[styles.baseButton, styles.editButton, !onEditPress && styles.disabledButton]}
      >
        <Image source={AssetsPath.ic_edit} style={styles.buttonIcon} tintColor={colors.white} />
        <Text style={styles.buttonText}>Edit</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomButtons: {
    bottom: 0,
    position: 'absolute',
    flexDirection: 'row',
    alignSelf: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    gap: 8,
    width: '100%',
  },
  baseButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  deleteButton: {
    backgroundColor: '#ff4c4c',
  },
  editButton: {
    backgroundColor: '#4c8dff',
  },
  disabledButton: {
    opacity: 0.45,
  },
  buttonIcon: {
    width: 18,
    height: 18,
    alignItems: 'center',
    resizeMode: 'contain',
    marginRight: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 19,
    fontFamily: FONTS.Medium,
  },
});

export default AlarmActionBar;
