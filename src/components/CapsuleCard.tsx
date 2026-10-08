import { useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { STATUS_LABELS, STATUS_COLORS } from "../constants/theme";
import { DRINK_EMOJIS } from "../data/mocks";
import type { Capsule, UserProfile } from "../types";

const HARD_SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 5,
};

const HARD_SHADOW_SM = {
  shadowColor: "#000",
  shadowOffset: { width: 2, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 4,
};

const HARD_SHADOW_BTN = {
  shadowColor: "#000",
  shadowOffset: { width: 2, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 4,
};

interface CapsuleCardProps {
  capsule: Capsule;
  currentUserId: string;
  profiles: Record<string, UserProfile>;
  onAccept?: (id: string) => void;
  onRefuse?: (id: string) => void;
  onDecapsuler?: (id: string) => void;
  onAuthorize?: (id: string) => void;
  isPending?: boolean;
}

export function CapsuleCard({
  capsule,
  currentUserId,
  profiles,
  onAccept,
  onRefuse,
  onDecapsuler,
  onAuthorize,
  isPending = false,
}: CapsuleCardProps) {
  const isCreditor = capsule.creditor_id === currentUserId;
  const otherId = isCreditor ? capsule.debtor_id : capsule.creditor_id;
  const otherUser = profiles[otherId];
  const otherPseudo = otherUser?.pseudo ?? "???";
  const statusColor = STATUS_COLORS[capsule.status];
  const drinkEmoji = DRINK_EMOJIS[capsule.drink_type] ?? "🍹";

  const isLaunchAlert = capsule.status === "pending_launch" && !isCreditor;

  const borderOpacity = useSharedValue(1);

  useEffect(() => {
    if (isLaunchAlert) {
      borderOpacity.value = withRepeat(
        withSequence(
          withTiming(0.25, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      borderOpacity.value = 1;
      cancelAnimation(borderOpacity);
    }
    return () => cancelAnimation(borderOpacity);
  }, [isLaunchAlert, borderOpacity]);

  const alertBorderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(255, 107, 26, ${borderOpacity.value})`,
  }));

  return (
    <Animated.View
      className="rounded-xl p-4 mb-4 border-2"
      style={[
        { backgroundColor: "#f8f9fa", ...HARD_SHADOW },
        isLaunchAlert ? alertBorderStyle : { borderColor: "#000" },
      ]}
    >
      <View className="flex-row items-center gap-3 mb-2">
        <View
          className="rounded-full items-center justify-center overflow-hidden"
          style={{ width: 40, height: 40, borderWidth: 1.5, borderColor: "#000" }}
        >
          {otherUser?.avatar_url ? (
            <Image
              source={{ uri: otherUser.avatar_url }}
              style={{ width: 38, height: 38 }}
              contentFit="cover"
            />
          ) : (
            <Text className="text-black text-base font-bold">
              {otherPseudo.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>

        <View className="flex-1">
          <Text className="text-black text-sm font-bold">{otherPseudo}</Text>
        </View>

        <Text className="text-black text-xs font-bold">
          {isCreditor
            ? `te doit ${capsule.amount} ${capsule.drink_type} ${drinkEmoji}`
            : `tu dois ${capsule.amount} ${capsule.drink_type} ${drinkEmoji}`}
        </Text>
      </View>

      <Text className="text-sm text-gray-700 font-medium mb-1">
        Motif : {capsule.reason}
      </Text>

      <View
        className="self-start rounded-full px-2 py-0.5 mb-2 border border-black"
        style={{ backgroundColor: `${statusColor}30` }}
      >
        <Text
          className="text-[9px] font-bold tracking-wide"
          style={{ color: statusColor }}
        >
          {STATUS_LABELS[capsule.status]}
        </Text>
      </View>

      {capsule.status === "pending" && !isCreditor && (
        <View className="flex-row gap-3 mt-2">
          <Pressable
            onPress={() => onAccept?.(capsule.id)}
            disabled={isPending}
            className="flex-1 rounded-lg py-2.5 items-center border-2 border-black"
            style={{ backgroundColor: "#4ade80", ...HARD_SHADOW_SM }}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text className="text-black text-sm font-bold">JE FOURNIS ⛽</Text>
            )}
          </Pressable>
          <Pressable
            onPress={() => onRefuse?.(capsule.id)}
            disabled={isPending}
            className="flex-1 rounded-lg py-2.5 items-center border-2 border-black"
            style={{ backgroundColor: "#f87171", ...HARD_SHADOW_SM }}
          >
            <Text className="text-black text-sm font-bold">Refuser</Text>
          </Pressable>
        </View>
      )}

      {capsule.status === "pending" && isCreditor && (
        <Text className="text-xs mt-2 italic" style={{ color: "#92400e" }}>
          Demande envoyée — en attente de réponse...
        </Text>
      )}

      {capsule.status === "active" && isCreditor && (
        <Pressable
          onPress={() => onDecapsuler?.(capsule.id)}
          disabled={isPending}
          className="mt-3 py-3 items-center rounded-lg border-2 border-black"
          style={{ backgroundColor: "#4ade80", ...HARD_SHADOW_BTN }}
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text className="text-black text-sm font-bold uppercase tracking-wide">
              🍾 DÉCAPSULER
            </Text>
          )}
        </Pressable>
      )}

      {capsule.status === "active" && !isCreditor && (
        <Text className="text-xs mt-2 italic text-gray-500">
          Carburant prêt — en attente de décollage...
        </Text>
      )}

      {capsule.status === "pending_launch" && isCreditor && (
        <View
          className="mt-3 py-3 items-center rounded-lg border-2 border-black"
          style={{ backgroundColor: "#9ca3af", ...HARD_SHADOW_BTN }}
        >
          <Text className="text-white text-sm font-bold uppercase tracking-wide">
            ⏳ En attente de Houston...
          </Text>
        </View>
      )}

      {capsule.status === "pending_launch" && !isCreditor && (
        <Pressable
          onPress={() => onAuthorize?.(capsule.id)}
          disabled={isPending}
          className="mt-3 py-3 items-center rounded-lg border-2 border-black"
          style={{ backgroundColor: "#f97316", ...HARD_SHADOW_BTN }}
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white text-sm font-bold uppercase tracking-wide">
              🚀 AUTORISER LE LANCEMENT
            </Text>
          )}
        </Pressable>
      )}

      {capsule.status === "resolved" && (
        <Text className="text-xs mt-2 italic" style={{ color: "#0891b2" }}>
          Capsule décollée ✅
        </Text>
      )}
    </Animated.View>
  );
}
