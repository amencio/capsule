import { useState, useCallback } from "react";
import { Text, useWindowDimensions, PanResponder } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

interface SwipeToConfirmProps {
  onConfirm: () => void;
  disabled?: boolean;
  label?: string;
}

const KNOB_W = 60;
const TRACK_H = 72;

export function SwipeToConfirm({
  onConfirm,
  disabled = false,
  label = "SWIPE POUR VALIDER 🔥",
}: SwipeToConfirmProps) {
  const { width: screenWidth } = useWindowDimensions();
  const trackW = Math.min(screenWidth - 80, 300);
  const maxTranslate = trackW - KNOB_W - 8;

  const translateX = useSharedValue(0);
  const [confirmed, setConfirmed] = useState(false);

  const fireConfirm = useCallback(() => {
    setConfirmed(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm();
  }, [onConfirm]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled && !confirmed,
    onMoveShouldSetPanResponder: () => !disabled && !confirmed,
    onPanResponderMove: (_e, gestureState) => {
      translateX.value = Math.max(0, Math.min(maxTranslate, gestureState.dx));
    },
    onPanResponderRelease: () => {
      if (translateX.value >= maxTranslate * 0.85) {
        translateX.value = withTiming(maxTranslate, { duration: 150 });
        fireConfirm();
      } else {
        translateX.value = withSpring(0, { damping: 18, stiffness: 200 });
      }
    },
  });

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: translateX.value + KNOB_W,
    opacity: interpolate(translateX.value, [0, maxTranslate], [0, 0.4], Extrapolation.CLAMP),
  }));

  const labelOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, maxTranslate * 0.4],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <Animated.View
      {...panResponder.panHandlers}
      className="rounded-full border-2 border-black bg-[#2a2a3e] overflow-hidden justify-center"
      style={{ width: trackW, height: TRACK_H }}
    >
      <Animated.View
        className="absolute left-0 top-0 bottom-0 bg-[#4ade80]"
        style={fillStyle}
      />

      <Animated.Text
        style={[labelOpacity, { zIndex: 1 }]}
        className="absolute left-0 right-0 text-center text-white text-sm font-black uppercase tracking-wide"
      >
        {label}
      </Animated.Text>

      <Animated.View
        className="absolute left-1 top-1 rounded-full border-2 border-black bg-[#FF3B30] items-center justify-center"
        style={[knobStyle, { width: KNOB_W, height: KNOB_W - 8 }]}
      >
        <Text className="text-white text-xl">🔥</Text>
      </Animated.View>
    </Animated.View>
  );
}
