import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import AssetsPath from '@Constants/AssetsPath';
import { useAppContext } from '@Contexts/ThemeProvider';
import useThemeColors from '@Hooks/useThemeMode';
import AudioMemoItem from '@Components/MemoListItem';

interface AudioRecorderProps {
  memos: any[];
  setMemos: (memos: any[]) => void;
  recording: any;
  onRecordingPress: () => void;
  animatedRecordWave: any;
  themeColor: string;
  iconColor: string;
  style: any;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  memos,
  setMemos,
  recording,
  onRecordingPress,
  animatedRecordWave,
  themeColor,
  iconColor,
  style,
}) => {
  const { theme } = useAppContext();
  const isDark = theme === 'dark';
  const colors = useThemeColors();

  return (
    <View style={[style.recorderContainer, { marginTop: memos.length === 0 ? 0 : 5 }]}>
      {memos.length !== 0 && (
        <Pressable
          onPress={() => setMemos([])}
          style={[style.memoRemoveButton, { backgroundColor: themeColor }]}
        >
          <Text style={style.memoClose}>X</Text>
        </Pressable>
      )}
      <AudioMemoItem
        memo={memos?.[0] || []}
        themeColor={themeColor}
        gradientEnd={themeColor}
        gradientStart={iconColor}
        renderRightIcon={
          <View>
            {recording && <Animated.View style={[style.recorderRecordWave, animatedRecordWave]} />}

            <Pressable style={style.recorderRecordButton} onPress={onRecordingPress}>
              <Animated.Image
                resizeMode="contain"
                tintColor={recording ? (isDark ? colors.white : colors.black) : themeColor}
                source={AssetsPath.ic_recordMic}
                style={[{ width: '100%', height: '100%', zIndex: 9999999999 }]}
              />
            </Pressable>
          </View>
        }
      />
    </View>
  );
};

export default memo(AudioRecorder);
