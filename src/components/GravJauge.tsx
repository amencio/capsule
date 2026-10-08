import { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { COLORS } from "../constants/theme";

interface GravJaugeProps {
  solde: number;
  pseudo: string;
  avatarUrl?: string | null;
}

const MAX_SCALE = 10;

export function GravJauge({ solde, pseudo, avatarUrl }: GravJaugeProps) {
  const clampedSolde = Math.max(-MAX_SCALE, Math.min(MAX_SCALE, solde));
  const translateY = useSharedValue(0);
  const floatAnim = useSharedValue(0);

  useEffect(() => {
    const halfHeight = 160;
    const offset = -(clampedSolde / MAX_SCALE) * halfHeight;
    translateY.value = withSpring(offset, {
      damping: 12,
      stiffness: 80,
      mass: 1,
    });

    if (solde > 0) {
      floatAnim.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(6, { duration: 2000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    } else if (solde < 0) {
      floatAnim.value = withRepeat(
        withSequence(
          withTiming(2, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
          withTiming(-2, { duration: 3000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    } else {
      floatAnim.value = 0;
    }

    return () => {
      cancelAnimation(translateY);
      cancelAnimation(floatAnim);
    };
  }, [clampedSolde, floatAnim, solde, translateY]);

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value + floatAnim.value },
    ],
  }));

  const isFloating = solde > 0;
  const isSinking = solde < 0;
  const isZeroGravity = solde === 0;

  return (
    <View className="items-center justify-center">
      <Text className="text-neon-green text-xs font-bold tracking-widest mb-3">
        {isZeroGravity ? "GRAVITÉ ZÉRO" : "ORBITE"}
      </Text>

      <View className="relative w-20 h-80 rounded-full overflow-hidden border border-space-border">
        <LinearGradient
          colors={[COLORS.neon.green, COLORS.space.surface, COLORS.neon.red]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.15 }}
        />

        <View className="absolute top-1/2 left-0 right-0 h-px bg-space-border" />

        <View className="absolute top-2 self-center">
          <Text className="text-neon-green/60 text-[8px]">↑</Text>
        </View>
        <View className="absolute bottom-2 self-center">
          <Text className="text-neon-red/60 text-[8px]">↓</Text>
        </View>

        <View className="absolute top-1/2 left-0 right-0 items-center justify-center">
          <Animated.View style={avatarStyle} className="items-center">
            {isFloating && (
              <Text className="text-base mb-0.5">👑</Text>
            )}
            <View
              className={`w-12 h-12 rounded-full items-center justify-center border-2 overflow-hidden ${
                isFloating
                  ? "border-neon-green bg-neon-green/20"
                  : isSinking
                  ? "border-neon-red bg-neon-red/20"
                  : "border-neon-cyan bg-neon-cyan/10"
              }`}
            >
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={{ width: 48, height: 48 }}
                  contentFit="cover"
                />
              ) : (
                <Text className="text-white text-lg font-bold">
                  {pseudo.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <Text className="text-white/80 text-[10px] mt-1 font-semibold">
              {solde > 0 ? `+${solde}` : solde}
            </Text>
            {isSinking && (
              <Text className="text-neon-red/60 text-[8px]">💤</Text>
            )}
          </Animated.View>
        </View>
      </View>

      <Text className="text-white/60 text-xs mt-3 font-semibold">
        {pseudo}
      </Text>
    </View>
  );
}
