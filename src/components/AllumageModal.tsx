import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
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
import { STATUS_LABELS, STATUS_COLORS } from "../constants/theme";
import { LAUNCH_TIMEOUT_HOURS } from "../constants/game";
import { formatCountdown, getSecondsUntilForce, getSecondsUntilFallback, canForceLaunch } from "../utils/capsule";
import type { Capsule, UserProfile } from "../types";

const SCREEN_H = Dimensions.get("window").height;

interface AllumageModalProps {
  visible: boolean;
  onClose: () => void;
  myFuelCapsules: Capsule[];
  profilesMap: Record<string, UserProfile>;
  pendingActionId: string | null;
  onRequestLaunch: (id: string) => void;
  onForceLaunch: (id: string) => void;
}

export function AllumageModal({
  visible,
  onClose,
  myFuelCapsules,
  profilesMap,
  pendingActionId,
  onRequestLaunch,
  onForceLaunch,
}: AllumageModalProps) {
  const [selectedCapsuleId, setSelectedCapsuleId] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [fallbackCountdown, setFallbackCountdown] = useState(0);

  const slide = useSharedValue(0);

  const activeCapsules = myFuelCapsules.filter((c) => c.status === "active");
  const launchRequestedCapsules = myFuelCapsules.filter((c) => c.status === "launch_requested");

  const selectedCapsule = selectedCapsuleId
    ? myFuelCapsules.find((c) => c.id === selectedCapsuleId) ?? null
    : null;

  useEffect(() => {
    slide.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
  }, [slide]);

  useEffect(() => {
    if (!selectedCapsule || selectedCapsule.status !== "launch_requested") return;

    const update = () => {
      setCountdown(getSecondsUntilForce(selectedCapsule));
      setFallbackCountdown(getSecondsUntilFallback(selectedCapsule));
    };
    update();

    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [selectedCapsule]);

  const handleSelectCapsule = useCallback((capsule: Capsule) => {
    Haptics.selectionAsync();
    setSelectedCapsuleId(capsule.id);
  }, []);

  const handleRequestLaunch = useCallback(() => {
    if (!selectedCapsuleId) return;
    onRequestLaunch(selectedCapsuleId);
    setWaiting(true);
  }, [selectedCapsuleId, onRequestLaunch]);

  const handleForcePress = useCallback(() => {
    if (!selectedCapsule) return;
    if (!canForceLaunch(selectedCapsule)) return;

    const debtor = profilesMap[selectedCapsule.debtor_id];
    Alert.alert(
      "Forcer l'allumage",
      `Confirmer l'allumage sans validation de ${debtor?.pseudo ?? "l'ami"} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          style: "destructive",
          onPress: () => {
            onForceLaunch(selectedCapsule.id);
            setWaiting(false);
            setSelectedCapsuleId(null);
            onClose();
          },
        },
      ]
    );
  }, [selectedCapsule, profilesMap, onForceLaunch, onClose]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(slide.value, [0, 1], [0, 0.7]),
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(slide.value, [0, 1], [SCREEN_H, 0]) }],
  }));

  if (!visible) return null;

  function handleClose() {
    setWaiting(false);
    setSelectedCapsuleId(null);
    onClose();
  }

  function renderCapsuleRow(capsule: Capsule) {
    const debtor = profilesMap[capsule.debtor_id];
    const drinkEmoji = DRINK_EMOJIS[capsule.drink_type] ?? "🍹";
    const isSelected = selectedCapsuleId === capsule.id;
    const statusColor = STATUS_COLORS[capsule.status];

    return (
      <Pressable
        key={capsule.id}
        onPress={() => handleSelectCapsule(capsule)}
        className={`rounded-xl p-3 mb-2 border-2 border-black ${
          isSelected ? "bg-[#f97316]/20" : "bg-white"
        } shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5`}
      >
        <View className="flex-row items-center gap-2.5">
          <View className="w-8 h-8 rounded-full border-2 border-black overflow-hidden items-center justify-center bg-white">
            {debtor?.avatar_url ? (
              <Image source={{ uri: debtor.avatar_url }} style={{ width: 28, height: 28 }} contentFit="cover" />
            ) : (
              <Text className="text-black text-xs font-bold">
                {debtor?.pseudo.charAt(0).toUpperCase() ?? "?"}
              </Text>
            )}
          </View>
          <View className="flex-1">
            <Text className="text-black text-sm font-bold">
              {debtor?.pseudo ?? "???"}
            </Text>
            <Text className="text-black/50 text-xs">
              {capsule.drink_type} {drinkEmoji}
            </Text>
          </View>
          <View className="rounded-full px-2 py-0.5 border border-black" style={{ backgroundColor: `${statusColor}30` }}>
            <Text style={{ color: statusColor }} className="text-[8px] font-bold">
              {STATUS_LABELS[capsule.status]}
            </Text>
          </View>
        </View>
        <Text className="text-black/40 text-xs mt-1.5 italic">
          {capsule.reason}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 500 }]} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "black" }, backdropStyle]} />
      </Pressable>

      <Animated.View
        className="bg-[#f8f9fa] border-t-2 border-black rounded-t-3xl px-5 pt-3 pb-8"
        style={[{ position: "absolute", bottom: 0, left: 0, right: 0, maxHeight: "85%" }, sheetStyle]}
      >
        <View className="w-12 h-1 bg-black/20 rounded-full self-center mb-4" />

        <View className="flex-row items-center gap-2 mb-4">
          <View className="w-8 h-8 rounded-full bg-[#f97316] border-2 border-black items-center justify-center">
            <Text className="text-white text-sm font-bold">🔥</Text>
          </View>
          <Text className="text-black text-lg font-bold">
            ALLUMAGE MOTEURS
          </Text>
        </View>

        {!waiting && activeCapsules.length === 0 && launchRequestedCapsules.length === 0 && (
          <View className="rounded-2xl p-6 items-center border-2 border-dashed border-black/20 bg-white mb-4">
            <Text className="text-black/30 text-sm">Réservoir vide</Text>
            <Text className="text-black/20 text-xs mt-1">
              Demande du carburant pour remplir ton réservoir ⛽
            </Text>
          </View>
        )}

        {!waiting && (
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
            {activeCapsules.length > 0 && (
              <Text className="text-[#f97316] text-xs font-bold tracking-widest uppercase mb-2">
                Carburant disponible
              </Text>
            )}
            {activeCapsules.map(renderCapsuleRow)}

            {launchRequestedCapsules.length > 0 && (
              <Text className="text-[#FF6B1A] text-xs font-bold tracking-widest uppercase mb-2 mt-2">
                En cours de mise à feu
              </Text>
            )}
            {launchRequestedCapsules.map((c) => renderCapsuleRow(c))}

            {activeCapsules.length > 0 && (
              <View className="flex-row gap-3 mt-3">
                <Pressable
                  onPress={handleClose}
                  className="flex-1 bg-white border-2 border-black rounded-xl py-3 items-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5"
                >
                  <Text className="text-black/60 text-sm font-bold">Annuler</Text>
                </Pressable>
                <Pressable
                  onPress={handleRequestLaunch}
                  disabled={!selectedCapsule || selectedCapsule.status !== "active"}
                  className={`flex-[2] rounded-xl py-3 items-center border-2 border-black active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 ${
                    selectedCapsule && selectedCapsule.status === "active"
                      ? "bg-[#f97316] shadow-[4px_6px_0px_0px_rgba(0,0,0,1)]"
                      : "bg-[#f97316]/20"
                  }`}
                >
                  <Text className={`text-sm font-bold tracking-wide ${selectedCapsule ? "text-white" : "text-white/50"}`}>
                    🔥 DEMANDER LA MISE À FEU
                  </Text>
                </Pressable>
              </View>
            )}

            {launchRequestedCapsules.length > 0 && !activeCapsules.length && (
              <Pressable
                onPress={() => {
                  const lr = launchRequestedCapsules[0];
                  setSelectedCapsuleId(lr.id);
                  setWaiting(true);
                }}
                className="mt-2 rounded-xl py-3 items-center border-2 border-black bg-[#f97316] shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
              >
                <Text className="text-white text-sm font-bold">⏳ Voir la mise à feu en cours</Text>
              </Pressable>
            )}
          </ScrollView>
        )}

        {waiting && selectedCapsule && (
          <View className="items-center py-6">
            <ActivityIndicator size="large" color="#FF6B1A" />
            <Text className="text-black text-sm font-bold mt-4 text-center">
              En attente de validation de l&apos;ami...
            </Text>

            <View className="mt-4 bg-[#f97316]/10 border-2 border-[#f97316] rounded-xl px-4 py-3 items-center">
              <Text className="text-black/60 text-xs font-bold mb-1">
                Forçage possible dans
              </Text>
              <Text className="text-[#f97316] text-2xl font-black">
                {formatCountdown(countdown)}
              </Text>
              {countdown <= 0 && (
                <Pressable
                  onPress={handleForcePress}
                  className="mt-3 rounded-lg border-2 border-black bg-[#f87171] px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5"
                >
                  <Text className="text-white text-xs font-bold">
                    ⚠️ Forcer l&apos;allumage (Liaison perdue)
                  </Text>
                </Pressable>
              )}
              {countdown > 0 && (
                <Text className="text-black/30 text-[10px] mt-2">
                  Forçage disponible dans {formatCountdown(countdown)}
                </Text>
              )}
            </View>

            <Text className="text-black/40 text-[10px] mt-3">
              Retombée automatique dans {formatCountdown(fallbackCountdown)} (après {LAUNCH_TIMEOUT_HOURS}h sans réponse)
            </Text>

            <Pressable
              onPress={handleClose}
              className="mt-4 rounded-xl border-2 border-black bg-white px-6 py-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5"
            >
              <Text className="text-black/60 text-xs font-bold">Fermer</Text>
            </Pressable>
          </View>
        )}

        {!waiting && pendingActionId && (
          <View className="items-center py-4">
            <ActivityIndicator size="small" color="#f97316" />
          </View>
        )}
      </Animated.View>
    </View>
  );
}
