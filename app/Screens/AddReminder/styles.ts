import { StyleSheet } from 'react-native';

import { FONTS, SIZE } from '../../Constants/Theme';
import useThemeColors from '../../Hooks/useThemeMode';

const styles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    container: {
      flex: 1,
      overflow: 'visible',
      backgroundColor: colors.background,
    },
    contentContainer: {
      flex: 1,
      alignSelf: 'center',
      marginVertical: 10,
      overflow: 'visible',
      width: SIZE.appContainWidth,
    },
    headerContainer: {
      flexDirection: 'row',
      height: 35,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerIcon: {
      width: 20,
      height: 20,
      resizeMode: 'contain',
    },
    headerText: {
      right: 8,
      fontSize: 22,
      fontFamily: FONTS.SemiBold,
    },
    createButton: {
      position: 'absolute',
      bottom: 1,
      width: '100%',
      height: 43,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    createButtonText: {
      color: colors.white,
      textAlign: 'center',
      fontFamily: FONTS.Medium,
      fontSize: 22,
    },
    itemsContainer: {
      marginTop: 20,
      marginBottom: 30,
    },

    contactModalContainer: {
      flex: 1,
      backgroundColor: colors.background,
      // borderTopLeftRadius: 20,
      // borderTopRightRadius: 20,
      overflow: 'hidden',
    },
    contactHeaderContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 15,
      marginBottom: 10,
    },
    contactHeaderIcon: {
      width: 20,
      height: 20,
      resizeMode: 'contain',
    },
    contactSearchInput: {
      height: 45,
      marginHorizontal: 10,
      marginVertical: 20,
      paddingHorizontal: 15,
      borderRadius: 20,
      backgroundColor: colors.contactBackground,
      fontFamily: FONTS.Medium,
      fontSize: 18,
    },
    contactListContainer: {
      flex: 1,
      marginTop: 5,
    },
    contactItemContainer: {
      width: SIZE.appContainWidth,
      alignSelf: 'center',
      borderRadius: 25,
      marginBottom: 15,
      columnGap: 15,
    },
    contactAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 10,
    },
    contactName: {
      fontSize: 19,
      fontFamily: FONTS.Medium,
    },
    contactNumber: {
      fontSize: 14,
      fontFamily: FONTS.Regular,
      marginTop: 2,
    },
    contactDoneButton: {
      width: '100%',
      height: 80,
      bottom: 0,
      position: 'absolute',
      justifyContent: 'center',
      alignItems: 'center',
    },
    contactDoneButtonText: {
      color: colors.white,
      fontFamily: FONTS.Bold,
      fontSize: 18,
    },
    contactDoneButtonView: {
      width: 140,
      height: 43,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(64, 93, 240, 1)',
    },

    contactLoadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingContent: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingEmoji: {
      fontSize: 48,
      marginBottom: 10,
    },
    loadingText: {
      fontSize: 18,
      fontFamily: FONTS.Medium,
      textAlign: 'center',
    },
    memoRemoveButton: {
      width: 20,
      height: 20,
      top: -10,
      right: 0,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      borderRadius: 500,
      zIndex: 99999,
    },
    memoClose: {
      color: colors.text,
      fontFamily: FONTS.SemiBold,
      fontSize: 12,
    },

    // recorder
    recorderContainer: {
      justifyContent: 'center',
      marginBottom: 20,
      overflow: 'visible',
    },
    recorderFooter: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    recorderRecordButton: {
      width: 35,
      height: 35,
      padding: 3,
      borderRadius: 35,
      alignItems: 'center',
      justifyContent: 'center',
    },
    recorderRecordWave: {
      position: 'absolute',
      top: -20,
      bottom: -20,
      left: -20,
      right: -20,
      borderRadius: 1000,
    },
    recorderRedCircle: {
      aspectRatio: 1,
    },
    orContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
    },
    orLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.borderColor,
    },
    orText: {
      marginHorizontal: 10,
      color: colors.text,
      fontFamily: FONTS.SemiBold,
      fontSize: 15,
      textAlign: 'center',
    },
  });
};

export default styles;
