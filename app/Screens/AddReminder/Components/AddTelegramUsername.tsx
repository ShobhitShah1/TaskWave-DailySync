import React, { FC, memo, useCallback } from 'react';
import {
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { FONTS, SIZE } from '../../../Constants/Theme';
import useThemeColors from '../../../Hooks/useThemeMode';

interface AddTelegramUsernameProps {
  themeColor: string;
  telegramUsername: string;
  setTelegramUsername: React.Dispatch<React.SetStateAction<string>>;
}

const AddTelegramUsername: FC<AddTelegramUsernameProps> = ({
  themeColor,
  telegramUsername,
  setTelegramUsername,
}) => {
  const style = styles();
  const colors = useThemeColors();

  const onChangeText = useCallback(
    (text: string) => {
      setTelegramUsername(text);
    },
    [setTelegramUsername],
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ marginBottom: 10 }}>
        <View style={[style.container, { backgroundColor: colors.scheduleReminderCardBackground }]}>
          <TextInput
            spellCheck
            scrollEnabled
            value={telegramUsername}
            placeholder={'telegram username'}
            textAlignVertical="top"
            onChangeText={onChangeText}
            selectionColor={themeColor}
            placeholderTextColor={colors.placeholderText}
            style={[style.textInputStyle, { color: colors.text }]}
          />
        </View>
        <Text style={style.infoText}>single username without "@"</Text>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default memo(AddTelegramUsername);

const styles = () => {
  return StyleSheet.create({
    container: {
      width: '100%',
      paddingHorizontal: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderRadius: SIZE.listBorderRadius,
    },
    textInputStyle: {
      flex: 1,
      fontSize: 18,
      textAlignVertical: 'center',
      paddingVertical: 15,
      fontFamily: FONTS.Medium,
    },
    fullScreen: {
      top: 12,
      right: 12,
      width: 15,
      height: 15,
      zIndex: 999,
      position: 'absolute',
      resizeMode: 'contain',
    },
    infoText: {
      color: 'red',
      fontFamily: FONTS.Medium,
      fontSize: 13,
      marginTop: 5,
      marginBottom: 5,
    },
  });
};
