import { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { DRINK_EMOJIS } from "../data/mocks";
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

interface LaunchAlertModalProps {
  visible: boolean;
  incomingLaunchRequests: Capsule[];
  profilesMap: Record<string, UserProfile>;
  pendingActionId: string | null;
  onAuthorize: (id: string) => void;
  onDismiss: () => void;
}

export function LaunchAlertModal(props: LaunchAlertModalProps) {
  if (!props.visible) return null;
  return <LaunchAlertModalInner {...props} />;
}

function LaunchAlertModalInner({
  visible,
  incomingLaunchRequests,
  profilesMap,
  pendingActionId,
  onAuthorize,
  onDismiss,
}: LaunchAlertModalProps) {
  const pulse = useSharedValue(1);
  const fade = useSharedValue(0);
  const [justResolved, setJustResolved] = useState(false);
  const currentRequest = incomingLaunchRequests[0];
  const creditor = currentRequest ? profilesMap[currentRequest.creditor_id] : null;
  const drinkEmoji = currentRequest ? DRINK_EMOJIS[currentRequest.drink_type] ?? "🍹" : "";
  const isResolving = currentRequest ? pendingActionId === currentRequest.id : false;

  useEffect(() => {
    fade.value = withTiming(1, { duration: 200 });
  }, [fade]);

  useEffect(() => {
    if (visible && currentRequest && !justResolved) {
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
  }, [visible, currentRequest, justResolved, pulse]);

  const handleConfirm = useCallback(() => {
    if (!currentRequest) return;
    onAuthorize(currentRequest.id);
    setJustResolved(true);
  }, [currentRequest, onAuthorize]);

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
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.4)" }, fadeStyle, { zIndex: 9999 }]} pointerEvents="box-none">
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleDismissResolved}
        >
          <View className="flex-1 items-center justify-center">
            <View className="bg-white border-2 border-black rounded-2xl px-8 py-6 items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Text className="text-[#4ade80] text-3xl font-black">
                Validé ✅
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

  if (!currentRequest || !creditor) {
    return (
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.8)" }, fadeStyle, { zIndex: 9999 }]} pointerEvents="box-none">
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { backgroundColor: "#FF3B30" }, fadeStyle, { zIndex: 9999 }]}
    >
      <View className="flex-1 items-center justify-center px-6">
        <View className="relative z-10 items-center">
          <Animated.Text style={[{ fontSize: 64 }, pulseStyle]}>
            🚀
          </Animated.Text>

          <Text className="text-white text-2xl font-black text-center mt-4">
            ALLUMAGE DEMANDÉ
          </Text>

          <View className="bg-white border-2 border-black rounded-2xl px-5 py-4 mt-4 items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <View className="flex-row items-center gap-2.5 mb-2">
              <View className="w-10 h-10 rounded-full border-2 border-black overflow-hidden items-center justify-center bg-white">
                {creditor.avatar_url ? (
                  <Image source={{ uri: creditor.avatar_url }} style={{ width: 36, height: 36 }} contentFit="cover" />
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
              demande l&apos;allumage pour
            </Text>
            <Text className="text-black text-xl font-black mt-1">
              {currentRequest.drink_type} {drinkEmoji}
            </Text>
            <Text className="text-black/50 text-xs mt-2 italic text-center">
              &ldquo;{currentRequest.reason}&rdquo;
            </Text>
          </View>

          {isResolving ? (
            <View className="mt-6">
              <ActivityIndicator size="large" color="#fff" />
              <Text className="text-white text-sm font-bold mt-2">
                Décollage en cours...
              </Text>
            </View>
          ) : !justResolved ? (
            <View className="mt-6">
              <SwipeToConfirm onConfirm={handleConfirm} />
            </View>
          ) : null}

          {!justResolved && (
            <Pressable
              onPress={onDismiss}
              className="mt-5"
            >
              <Text className="text-white/60 text-xs font-bold underline">
                Fermer
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
