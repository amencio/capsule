import { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { DRINK_EMOJIS } from "../data/mocks";
import { TANK_MAX_CAPACITY } from "../constants/game";
import { formatTimeRemaining } from "../utils/capsule";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { SwipeToConfirm } from "./SwipeToConfirm";
import type { Capsule, UserProfile } from "../types";

interface RavitaillementAlertModalProps {
  visible: boolean;
  capsule: Capsule | null;
  profilesMap: Record<string, UserProfile>;
  pendingActionId: string | null;
  onAccept: (id: string) => void;
  onRefuse: (id: string) => void;
  onDismiss: () => void;
  getCreditorTankLevel: (userId: string) => number;
}

export function RavitaillementAlertModal(props: RavitaillementAlertModalProps) {
  if (!props.visible) return null;
  return <RavitaillementAlertModalInner {...props} />;
}

function RavitaillementAlertModalInner({
  visible,
  capsule,
  profilesMap,
  pendingActionId,
  onAccept,
  onRefuse,
  onDismiss,
  getCreditorTankLevel,
}: RavitaillementAlertModalProps) {
  const pulse = useSharedValue(1);
  const fade = useSharedValue(0);
  const [justResolved, setJustResolved] = useState(false);

  const creditor = capsule ? profilesMap[capsule.creditor_id] : null;
  const drinkEmoji = capsule ? DRINK_EMOJIS[capsule.drink_type] ?? "🍹" : "";
  const isResolving = capsule ? pendingActionId === capsule.id : false;
  const creditorTankFull = capsule
    ? getCreditorTankLevel(capsule.creditor_id) >= TANK_MAX_CAPACITY
    : false;
  const timeRemaining = capsule ? formatTimeRemaining(capsule.expires_at) : "";
  const creditorName = creditor?.pseudo ?? "L'ami";

  useEffect(() => {
    fade.value = withTiming(1, { duration: 200 });
  }, [fade]);

  useEffect(() => {
    if (visible && capsule && !justResolved) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
    return () => cancelAnimation(pulse);
  }, [visible, capsule, justResolved, pulse]);

  const handleConfirm = useCallback(() => {
    if (!capsule) return;
    onAccept(capsule.id);
    setJustResolved(true);
  }, [capsule, onAccept]);

  const handleDismissResolved = useCallback(() => {
    setJustResolved(false);
    onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    if (!visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setJustResolved(false);
    }
  }, [visible]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
  }));

  if (justResolved) {
    return (
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.4)" }, fadeStyle, { zIndex: 9999 }]}
        pointerEvents="box-none"
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleDismissResolved}>
          <View className="flex-1 items-center justify-center">
            <View className="bg-white border-2 border-black rounded-2xl px-8 py-6 items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Text className="text-[#4ade80] text-3xl font-black">
                Ravitaillement envoyé ✅
              </Text>
              <Text className="text-black/50 text-sm mt-2 font-bold">
                Touche pour fermer
              </Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  if (!capsule || !creditor) {
    return (
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.8)" }, fadeStyle, { zIndex: 9999 }]}
        pointerEvents="box-none"
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { backgroundColor: "#1e3a5f" }, fadeStyle, { zIndex: 9999 }]}
    >
      <View className="flex-1 items-center justify-center px-6">
        <View className="relative z-10 items-center">
          <Animated.Text style={[{ fontSize: 64 }, pulseStyle]}>
            ⛽
          </Animated.Text>

          <Text className="text-white text-2xl font-black text-center mt-4">
            DEMANDE DE RAVITAILLEMENT
          </Text>

          <View className="bg-white border-2 border-black rounded-2xl px-5 py-4 mt-4 items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <View className="flex-row items-center gap-2.5 mb-2">
              <View className="w-10 h-10 rounded-full border-2 border-black overflow-hidden items-center justify-center bg-white">
                {creditor.avatar_url ? (
                  <Image
                    source={{ uri: creditor.avatar_url }}
                    style={{ width: 36, height: 36 }}
                    contentFit="cover"
                  />
                ) : (
                  <Text className="text-black text-sm font-bold">
                    {creditor.pseudo.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <Text className="text-black text-lg font-bold">
                {creditor.pseudo}
              </Text>
            </View>

            <Text className="text-black text-sm font-bold text-center">
              demande du carburant pour
            </Text>
            <Text className="text-black text-xl font-black mt-1">
              {capsule.drink_type} {drinkEmoji}
            </Text>
            <Text className="text-black/50 text-xs mt-2 italic text-center">
              &ldquo;{capsule.reason}&rdquo;
            </Text>
            {timeRemaining ? (
              <Text className="text-black/40 text-[10px] mt-2">
                ⏳ {timeRemaining}
              </Text>
            ) : null}
          </View>

          {isResolving ? (
            <View className="mt-6">
              <ActivityIndicator size="large" color="#fff" />
              <Text className="text-white text-sm font-bold mt-2">
                Ravitaillement en cours...
              </Text>
            </View>
          ) : creditorTankFull ? (
            <View className="mt-6 bg-[#fbbf24]/20 border-2 border-[#fbbf24] rounded-xl px-4 py-3 items-center">
              <Text className="text-[#fbbf24] text-sm font-bold text-center">
                ⚠️ Réservoir de {creditorName} plein ({TANK_MAX_CAPACITY}/{TANK_MAX_CAPACITY})
              </Text>
            </View>
          ) : !justResolved ? (
            <View className="mt-6">
              <SwipeToConfirm
                onConfirm={handleConfirm}
                label="RAVITAILLER ⛽"
              />
            </View>
          ) : null}

          {!justResolved && (
            <View className="flex-row gap-4 mt-5">
              <Pressable
                onPress={() => onRefuse(capsule.id)}
                className="rounded-xl border-2 border-white/40 bg-white/10 px-5 py-2.5"
              >
                <Text className="text-white/80 text-sm font-bold">Refuser</Text>
              </Pressable>
              <Pressable
                onPress={onDismiss}
                className="rounded-xl border-2 border-white/40 bg-white/10 px-5 py-2.5"
              >
                <Text className="text-white/80 text-sm font-bold">Plus tard</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
