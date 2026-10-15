import { useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { DRINK_EMOJIS } from "../data/mocks";
import { TANK_MAX_CAPACITY } from "../constants/game";
import { formatTimeRemaining } from "../utils/capsule";
import type { Capsule, UserProfile } from "../types";

const SCREEN_H = Dimensions.get("window").height;

interface RavitaillementModalProps {
  visible: boolean;
  onClose: () => void;
  receivedFuelRequests: Capsule[];
  currentUserId: string;
  profilesMap: Record<string, UserProfile>;
  pendingActionId: string | null;
  onAccept: (id: string) => void;
  onRefuse: (id: string) => void;
  getCreditorTankLevel: (userId: string) => number;
}

export function RavitaillementModal({
  visible,
  onClose,
  receivedFuelRequests,
  profilesMap,
  pendingActionId,
  onAccept,
  onRefuse,
  getCreditorTankLevel,
}: RavitaillementModalProps) {
  const slide = useSharedValue(0);

  useEffect(() => {
    slide.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
  }, [slide]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(slide.value, [0, 1], [0, 0.7]),
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(slide.value, [0, 1], [SCREEN_H, 0]) }],
  }));

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 500 }]} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "black" }, backdropStyle]} />
      </Pressable>

      <Animated.View
        className="bg-[#1a1a24] border-t-2 border-[#2E2E3A] rounded-t-3xl px-5 pt-3 pb-8"
        style={[{ position: "absolute", bottom: 0, left: 0, right: 0, maxHeight: "85%" }, sheetStyle]}
      >
        <View className="w-12 h-1 bg-[#2E2E3A] rounded-full self-center mb-4" />

        <View className="flex-row items-center gap-2 mb-4">
          <View className="w-8 h-8 rounded-full bg-[#1A1A24] border-2 border-[#00FF66] items-center justify-center">
            <Text className="text-white text-sm font-bold">🛰️</Text>
          </View>
          <Text className="text-white text-lg font-bold">
            RAVITAILLER LES AMIS
          </Text>
        </View>

        {receivedFuelRequests.length === 0 ? (
          <View className="rounded-2xl p-6 items-center border-2 border-dashed border-[#2E2E3A] bg-[#22222E] mb-4">
            <Text className="text-white/30 text-sm">Aucune demande en attente</Text>
            <Text className="text-white/20 text-xs mt-1">
              Les demandes de carburant reçues apparaîtront ici
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
            {receivedFuelRequests.map((capsule) => {
              const creditor = profilesMap[capsule.creditor_id];
              const drinkEmoji = DRINK_EMOJIS[capsule.drink_type] ?? "🍹";
              const isPending = pendingActionId === capsule.id;
              const creditorTankFull = getCreditorTankLevel(capsule.creditor_id) >= TANK_MAX_CAPACITY;
              const timeRemaining = formatTimeRemaining(capsule.expires_at);
              const creditorName = creditor?.pseudo ?? "L'ami";

              return (
                <View
                  key={capsule.id}
                  className="rounded-xl p-3 mb-3 border-2 border-[#2E2E3A] bg-[#22222E]"
                >
                  <View className="flex-row items-center gap-2.5 mb-2">
                    <View className="w-9 h-9 rounded-full border-2 border-[#2E2E3A] overflow-hidden items-center justify-center bg-[#22222E]">
                      {creditor?.avatar_url ? (
                        <Image source={{ uri: creditor.avatar_url }} style={{ width: 32, height: 32 }} contentFit="cover" />
                      ) : (
                        <Text className="text-white text-xs font-bold">
                          {creditorName.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-sm font-bold">
                        {creditorName}
                      </Text>
                      <Text className="text-white/50 text-xs">
                        {capsule.drink_type} {drinkEmoji}
                      </Text>
                    </View>
                    <View className="bg-[#FFD60A]/20 border border-[#FFD60A] rounded-lg px-2 py-0.5">
                      <Text className="text-[#FFD60A] text-[8px] font-bold">
                        ⏳ {timeRemaining}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-white/40 text-xs mb-2.5 italic">
                    {capsule.reason}
                  </Text>

                  {creditorTankFull ? (
                    <View className="bg-[#FFD60A]/20 border-2 border-[#FFD60A] rounded-lg px-3 py-2">
                      <Text className="text-[#FFD60A] text-xs font-bold text-center">
                        ⚠️ Réservoir de {creditorName} plein ({TANK_MAX_CAPACITY}/{TANK_MAX_CAPACITY})
                      </Text>
                    </View>
                  ) : (
                    <View className="flex-row gap-2.5">
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          onAccept(capsule.id);
                        }}
                        disabled={isPending}
                        className="flex-1 rounded-lg py-2.5 items-center border-2 border-[#00FF66] bg-[#00FF66] active:opacity-70"
                      >
                        {isPending ? (
                          <ActivityIndicator size="small" color="#000" />
                        ) : (
                          <Text className="text-black text-xs font-bold">FOURNIR ⛽</Text>
                        )}
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                          onRefuse(capsule.id);
                        }}
                        disabled={isPending}
                        className="flex-1 rounded-lg py-2.5 items-center border-2 border-[#FF3B30] bg-[#FF3B30]/15 active:opacity-70"
                      >
                        <Text className="text-[#FF3B30] text-xs font-bold">REFUSER</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}

        <Pressable
          onPress={onClose}
          className="mt-3 rounded-xl border-2 border-[#2E2E3A] bg-[#22222E] py-3 items-center active:opacity-70"
        >
          <Text className="text-white/60 text-sm font-bold">Fermer</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
