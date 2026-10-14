import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { DRINK_TYPES } from "../constants/theme";
import { TANK_MAX_CAPACITY } from "../constants/game";
import type { UserProfile, Capsule } from "../types";

const SCREEN_H = Dimensions.get("window").height;

interface DemanderModalProps {
  visible: boolean;
  onClose: () => void;
  onLaunch: (capsule: Omit<Capsule, "id" | "status" | "created_at" | "resolved_at" | "expires_at" | "launch_requested_at" | "resolution" | "amount">) => void;
  friends: UserProfile[];
  currentUserId: string;
  getCreditorTankLevel: (userId: string) => number;
  profilesMap: Record<string, UserProfile>;
}

export function DemanderModal({
  visible,
  onClose,
  onLaunch,
  friends,
  currentUserId,
  getCreditorTankLevel,
  profilesMap,
}: DemanderModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drinkType, setDrinkType] = useState<string>(DRINK_TYPES[0]);
  const [customDrink, setCustomDrink] = useState("");
  const [reason, setReason] = useState("");

  const slide = useSharedValue(0);

  const finalDrink = customDrink.trim() || drinkType;
  const canLaunch = selectedId && reason.trim().length > 0;
  const selectedFriend = friends.find((f) => f.id === selectedId);
  const creditorTankFull = selectedFriend
    ? getCreditorTankLevel(currentUserId) + 1 > TANK_MAX_CAPACITY
    : false;
  const creditorName = profilesMap[currentUserId]?.pseudo ?? "Toi";

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

  function handleLaunch() {
    if (!canLaunch || !selectedId || creditorTankFull) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    onLaunch({
      creditor_id: currentUserId,
      debtor_id: selectedId,
      drink_type: finalDrink,
      reason: reason.trim(),
    });

    setSelectedId(null);
    setDrinkType(DRINK_TYPES[0]);
    setCustomDrink("");
    setReason("");
    onClose();
  }

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 500 }]} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "black" }, backdropStyle]} />
      </Pressable>

      <Animated.View
        style={[{ position: "absolute", bottom: 0, left: 0, right: 0 }, sheetStyle]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-end"
        >
          <View className="bg-[#f8f9fa] border-t-2 border-black rounded-t-3xl px-5 pt-3 pb-8">
            <View className="w-12 h-1 bg-black/20 rounded-full self-center mb-4" />

            <View className="flex-row items-center gap-2 mb-4">
              <View className="w-8 h-8 rounded-full bg-[#4ade80] border-2 border-black items-center justify-center">
                <Text className="text-black text-sm font-bold">⛽</Text>
              </View>
              <Text className="text-black text-lg font-bold">
                DEMANDER DU CARBURANT
              </Text>
            </View>

            <Text className="text-black/50 text-xs font-bold tracking-wide uppercase mb-2">
              À qui demandes-tu du carburant ?
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row gap-2">
                {friends
                  .filter((f) => f.id !== currentUserId)
                  .map((friend) => (
                    <Pressable
                      key={friend.id}
                      onPress={() => {
                        setSelectedId(friend.id);
                        Haptics.selectionAsync();
                      }}
                      className={`px-4 py-2 rounded-full border-2 border-black ${
                        selectedId === friend.id
                          ? "bg-[#4ade80]"
                          : "bg-white"
                      }`}
                    >
                      <Text
                        className={`text-sm font-bold ${
                          selectedId === friend.id ? "text-black" : "text-black"
                        }`}
                      >
                        {friend.pseudo}
                      </Text>
                    </Pressable>
                  ))}
              </View>
            </ScrollView>

            <Text className="text-black/50 text-xs font-bold tracking-wide uppercase mb-2">
              Boisson
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
              <View className="flex-row gap-2">
                {DRINK_TYPES.map((drink) => (
                  <Pressable
                    key={drink}
                    onPress={() => {
                      setDrinkType(drink);
                      setCustomDrink("");
                    }}
                    className={`px-3 py-1.5 rounded-lg border-2 border-black ${
                      drinkType === drink && !customDrink
                        ? "bg-[#4ade80]"
                        : "bg-white"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        drinkType === drink && !customDrink ? "text-black" : "text-black/60"
                      }`}
                    >
                      {drink}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <TextInput
              value={customDrink}
              onChangeText={setCustomDrink}
              placeholder="Ou boisson personnalisée..."
              placeholderTextColor="rgba(0,0,0,0.25)"
              className="bg-white border-2 border-black rounded-xl px-4 py-2.5 text-black text-sm mb-4"
            />

            <Text className="text-black/50 text-xs font-bold tracking-wide uppercase mb-2">
              Motif
            </Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Ex: Pari Ligue 1 !"
              placeholderTextColor="rgba(0,0,0,0.25)"
              className="bg-white border-2 border-black rounded-xl px-4 py-3 text-black text-sm mb-4"
              multiline
              numberOfLines={2}
            />

            {creditorTankFull && (
              <View className="bg-[#fbbf24]/20 border-2 border-[#fbbf24] rounded-xl px-4 py-2.5 mb-3">
                <Text className="text-[#92400e] text-xs font-bold">
                  ⚠️ Réservoir de {creditorName} plein ({TANK_MAX_CAPACITY}/{TANK_MAX_CAPACITY})
                </Text>
              </View>
            )}

            <View className="flex-row gap-3">
              <Pressable
                onPress={onClose}
                className="flex-1 bg-white border-2 border-black rounded-xl py-3 items-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5"
              >
                <Text className="text-black/60 text-sm font-bold">Annuler</Text>
              </Pressable>
              <Pressable
                onPress={handleLaunch}
                disabled={!canLaunch || creditorTankFull}
                className={`flex-[2] rounded-xl py-3 items-center border-2 border-black active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 ${
                  canLaunch && !creditorTankFull
                    ? "bg-[#4ade80] shadow-[4px_6px_0px_0px_rgba(0,0,0,1)]"
                    : "bg-[#4ade80]/20"
                }`}
              >
                <Text
                  className={`text-sm font-bold tracking-wide ${
                    canLaunch && !creditorTankFull ? "text-black" : "text-black/50"
                  }`}
                >
                  ⛽ DEMANDER !
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}
