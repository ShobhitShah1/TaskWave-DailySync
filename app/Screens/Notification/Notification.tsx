import React from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import styles from './styles';

const Notification = () => {
  const colors = styles();

  return (
    <SafeAreaView style={colors.container}>
      <Text style={[colors.text, { fontSize: 28 }]}>Coming Soon</Text>
    </SafeAreaView>
  );
};

export default Notification;
