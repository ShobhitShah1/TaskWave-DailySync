import { StyleSheet } from 'react-native';

import { FONTS } from '@Constants/Theme';
import { useAppContext } from '@Contexts/ThemeProvider';
import useThemeColors from '@Hooks/useThemeMode';

const styles = () => {
  const colors = useThemeColors();
  const { theme } = useAppContext();

  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    text: {
      color: colors.text,
      fontSize: 18,
    },
    button: {
      backgroundColor: colors.primary,
      padding: 10,
      borderRadius: 5,
    },

    //* Sound
    soundContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    list: {
      padding: 16,
    },
    soundCard: {
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      backgroundColor: theme === 'dark' ? 'rgba(45, 45, 48, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      shadowColor: theme === 'dark' ? '#000' : colors.darkBlue,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.08,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 2,
      borderColor: theme === 'dark' ? 'rgba(60, 60, 65, 1)' : 'rgba(230, 230, 255, 0.5)',
    },
    selectedCard: {
      borderColor: colors.lightBlue,
      shadowColor: colors.lightBlue,
      shadowOpacity: 0.2,
    },
    cardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    playButtonContainer: {
      shadowColor: colors.lightBlue,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    playButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme === 'dark' ? 'rgba(38, 107, 235, 0.15)' : 'rgba(38, 107, 235, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(38, 107, 235, 0.2)',
    },
    playingButton: {
      backgroundColor: colors.lightBlue,
    },
    playButtonText: {
      color: colors.lightBlue,
      fontSize: 18,
      textAlign: 'center',
    },
    playingButtonText: {
      color: 'white',
    },
    soundInfo: {
      flex: 1,
      gap: 4,
    },
    soundName: {
      fontSize: 16,
      fontFamily: FONTS.Medium,
      color: colors.text,
    },
    durationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    duration: {
      fontSize: 14,
      color: theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
    },
    categoryBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      backgroundColor: theme === 'dark' ? 'rgba(38, 107, 235, 0.15)' : 'rgba(38, 107, 235, 0.1)',
    },
    categoryText: {
      fontSize: 12,
      color: colors.lightBlue,
      fontFamily: FONTS.Medium,
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    waveContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 20,
      gap: 3,
    },
    waveBar: {
      width: 3,
      height: 20,
      backgroundColor: colors.lightBlue,
      borderRadius: 1.5,
    },
    selectedIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.lightBlue,
    },
    bottomButton: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      backgroundColor: theme === 'dark' ? 'rgba(45, 45, 48, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderTopWidth: 1,
      borderTopColor: theme === 'dark' ? 'rgba(60, 60, 65, 1)' : 'rgba(230, 230, 255, 0.5)',
      shadowColor: theme === 'dark' ? '#000' : colors.lightBlue,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    saveButton: {
      backgroundColor: colors.darkBlue,
      borderRadius: 12,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.lightBlue,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    saveButtonText: {
      color: 'white',
      fontSize: 16,
      fontFamily: FONTS.Medium,
    },
  });
};

export default styles;
