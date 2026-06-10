import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

interface VoiceWaveformProps {
  color: string;
  metering?: number[];
  progress?: number;
}

const VoiceWaveform: React.FC<VoiceWaveformProps> = ({ color, metering = [], progress = 0 }) => {
  const bars = useMemo(() => {
    if (metering.length) {
      return Array.from({ length: 34 }, (_, index) => {
        const sourceIndex = Math.floor((index * metering.length) / 34);
        return Math.max(4, Math.min(24, ((metering[sourceIndex] || -45) + 60) * 0.65));
      });
    }

    return Array.from({ length: 34 }, (_, index) => 5 + ((index * 13) % 19));
  }, [metering]);

  return (
    <View style={styles.container}>
      {bars.map((height, index) => (
        <View
          key={index}
          style={[
            styles.bar,
            {
              height,
              backgroundColor: color,
              opacity: index / bars.length <= progress ? 1 : 0.35,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 28,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
});

export default VoiceWaveform;
