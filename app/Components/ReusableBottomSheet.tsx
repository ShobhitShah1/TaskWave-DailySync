import {
  BottomSheetModal,
  BottomSheetModalProps,
  useBottomSheetTimingConfigs,
} from '@gorhom/bottom-sheet';
import React, { forwardRef, useMemo, useRef, useCallback } from 'react';
import { BackHandler, NativeEventSubscription } from 'react-native';
import useThemeColors from '@Hooks/useThemeMode';
import { Easing } from 'react-native-reanimated';

interface ReusableBottomSheetProps extends BottomSheetModalProps {
  children: React.ReactNode;
}

const ReusableBottomSheet = forwardRef<BottomSheetModal, ReusableBottomSheetProps>(
  ({ children, snapPoints = ['90%'], onChange, ...rest }, ref) => {
    const colors = useThemeColors();
    const backHandlerSubscriptionRef = useRef<NativeEventSubscription | null>(null);

    React.useEffect(() => {
      return () => {
        backHandlerSubscriptionRef.current?.remove();
        backHandlerSubscriptionRef.current = null;
      };
    }, []);

    const handleSheetPositionChange = useCallback<NonNullable<BottomSheetModalProps['onChange']>>(
      (index) => {
        const isBottomSheetVisible = index >= 0;
        if (isBottomSheetVisible && !backHandlerSubscriptionRef.current) {
          backHandlerSubscriptionRef.current = BackHandler.addEventListener(
            'hardwareBackPress',
            () => {
              if (typeof ref === 'object' && ref?.current) {
                ref.current.dismiss();
                return true;
              }
              return false;
            },
          );
        } else if (!isBottomSheetVisible) {
          backHandlerSubscriptionRef.current?.remove();
          backHandlerSubscriptionRef.current = null;
        }
        if (onChange) onChange(index);
      },
      [ref, onChange],
    );

    const backgroundStyle = useMemo(
      () => ({ backgroundColor: colors.background }),
      [colors.background],
    );
    const handleStyle = useMemo(
      () => ({ backgroundColor: colors.background }),
      [colors.background],
    );
    const handleIndicatorStyle = useMemo(() => ({ backgroundColor: colors.text }), [colors.text]);

    const animationConfigs = useBottomSheetTimingConfigs({
      duration: 350,
      easing: Easing.out(Easing.exp),
    });

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={backgroundStyle}
        handleStyle={handleStyle}
        handleIndicatorStyle={handleIndicatorStyle}
        keyboardBlurBehavior="restore"
        keyboardBehavior="interactive"
        android_keyboardInputMode="adjustPan"
        onChange={handleSheetPositionChange}
        animateOnMount
        animationConfigs={animationConfigs}
        {...rest}
      >
        {children}
      </BottomSheetModal>
    );
  },
);

export default ReusableBottomSheet;
