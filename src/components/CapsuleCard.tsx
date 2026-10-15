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
import { STATUS_COLORS, ROLE_COLORS, COLORS } from "../constants/theme";
import { DRINK_EMOJIS } from "../data/mocks";
import type { Capsule, UserProfile } from "../types";

interface CapsuleCardProps {
  capsule: Capsule;
  currentUserId: string;
  profiles: Record<string, UserProfile>;
  onAccept?: (id: string) => void;
  onRefuse?: (id: string) => void;
  onRequestLaunch?: (id: string) => void;
  onAuthorize?: (id: string) => void;
  isPending?: boolean;
}

type BadgeLabel =
  | "EN ATTENTE"
  | "CARBURANT"
  | "MISE À FEU"
  | "DÉCOLLÉ"
  | "FORCÉ"
  | "REFUSÉ"
  | "EXPIRÉ";

function getBadgeInfo(
  capsule: Capsule,
  isCreditor: boolean
): { label: BadgeLabel; color: string } {
  const c = STATUS_COLORS;
  switch (capsule.status) {
    case "pending":
      return { label: "EN ATTENTE", color: c.pending };
    case "active":
      return { label: "CARBURANT", color: c.active };
    case "launch_requested":
      return { label: "MISE À FEU", color: c.launch_requested };
    case "resolved":
      if (capsule.resolution === "forced")
        return { label: "FORCÉ", color: c.launch_requested };
      return { label: "DÉCOLLÉ", color: c.resolved };
    case "rejected":
      return { label: "REFUSÉ", color: c.rejected };
    case "expired":
      return { label: "EXPIRÉ", color: c.expired };
  }
}

function getActionPhrase(
  capsule: Capsule,
  isCreditor: boolean,
  isObserver: boolean
): string {
  if (isObserver) {
    switch (capsule.status) {
      case "pending":
        return "Demande de ravitaillement";
      case "active":
        return "Carburant en attente";
      case "launch_requested":
        return "Mise à feu demandée";
      case "resolved":
        return "Capsule décollée";
      case "rejected":
        return "Demande refusée";
      case "expired":
        return "Demande expirée";
    }
  }
  switch (capsule.status) {
    case "pending":
      return isCreditor
        ? "Demande envoyée"
        : "Attend ton ravitaillement";
    case "active":
      return isCreditor
        ? "Carburant reçu"
        : "Carburant fourni";
    case "launch_requested":
      return isCreditor
        ? "Tu as demandé la mise à feu"
        : "Demande la mise à feu";
    case "resolved":
      return "Capsule décollée";
    case "rejected":
      return "Demande refusée";
    case "expired":
      return "Demande expirée";
  }
}

function Avatar({
  user,
  size,
  borderColor,
}: {
  user: UserProfile | undefined;
  size: number;
  borderColor: string;
}) {
  const pseudo = user?.pseudo ?? "?";
  return (
    <View
      className="rounded-full items-center justify-center overflow-hidden"
      style={{
        width: size,
        height: size,
        borderWidth: 1.5,
        borderColor,
        backgroundColor: "#22222E",
      }}
    >
      {user?.avatar_url ? (
        <Image
          source={{ uri: user.avatar_url }}
          style={{ width: size - 5, height: size - 5 }}
          contentFit="cover"
        />
      ) : (
        <Text className="text-white text-xs font-bold">
          {pseudo.charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

export function CapsuleCard({
  capsule,
  currentUserId,
  profiles,
  onAccept,
  onRefuse,
  onRequestLaunch,
  onAuthorize,
  isPending = false,
}: CapsuleCardProps) {
  const isCreditor = capsule.creditor_id === currentUserId;
  const isDebtor = capsule.debtor_id === currentUserId;
  const isObserver = !isCreditor && !isDebtor;

  const creditorUser = profiles[capsule.creditor_id];
  const debtorUser = profiles[capsule.debtor_id];
  const otherId = isCreditor ? capsule.debtor_id : capsule.creditor_id;
  const otherUser = profiles[otherId];
  const otherPseudo = otherUser?.pseudo ?? "???";
  const drinkEmoji = DRINK_EMOJIS[capsule.drink_type] ?? "🍹";

  const isLaunchAlert =
    capsule.status === "launch_requested" && isDebtor;

  const borderOpacity = useSharedValue(1);

  useEffect(() => {
    if (isLaunchAlert) {
      borderOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
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

  const badge = getBadgeInfo(capsule, isCreditor);
  const actionPhrase = getActionPhrase(capsule, isCreditor, isObserver);

  return (
    <Animated.View
      className="rounded-xl p-3.5 mb-3 border bg-[#1a1a24]"
      style={[
        isLaunchAlert
          ? [alertBorderStyle, { borderWidth: 2 }]
          : { borderWidth: 1.5, borderColor: COLORS.space.border },
      ]}
    >
      {/* Header */}
      {isObserver ? (
        <View className="flex-row items-center gap-2">
          <View className="items-center">
            <Avatar user={creditorUser} size={28} borderColor={ROLE_COLORS.creditor} />
            <Text className="text-[#00FF66] text-[9px] font-bold mt-0.5" numberOfLines={1}>
              {creditorUser?.pseudo ?? "???"}
            </Text>
          </View>
          <Text className="text-white/40 text-sm">→</Text>
          <View className="items-center">
            <Avatar user={debtorUser} size={28} borderColor={ROLE_COLORS.debtor} />
            <Text className="text-[#FF6B1A] text-[9px] font-bold mt-0.5" numberOfLines={1}>
              {debtorUser?.pseudo ?? "???"}
            </Text>
          </View>
          <View className="flex-1" />
          <Text className="text-white/40 text-xs">
            {drinkEmoji} {capsule.drink_type}
          </Text>
          <View
            className="rounded-full px-2 py-0.5 border"
            style={{
              backgroundColor: `${badge.color}1A`,
              borderColor: `${badge.color}80`,
            }}
          >
            <Text
              className="text-[9px] font-bold tracking-wide"
              style={{ color: badge.color }}
            >
              {badge.label}
            </Text>
          </View>
        </View>
      ) : (
        <View className="flex-row items-center gap-2.5">
          <View
            className="rounded-full items-center justify-center overflow-hidden"
            style={{
              width: 32,
              height: 32,
              borderWidth: 1.5,
              borderColor: isCreditor ? ROLE_COLORS.creditor : COLORS.space.border,
            }}
          >
            {otherUser?.avatar_url ? (
              <Image
                source={{ uri: otherUser.avatar_url }}
                style={{ width: 30, height: 30 }}
                contentFit="cover"
              />
            ) : (
              <Text className="text-white text-sm font-bold">
                {otherPseudo.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>

          <View className="flex-1 flex-row items-center gap-1.5">
            <Text className="text-white text-sm font-bold" numberOfLines={1}>
              {otherPseudo}
            </Text>
            <Text className="text-white/40 text-xs">
              {drinkEmoji} {capsule.drink_type}
            </Text>
          </View>

          <View
            className="rounded-full px-2 py-0.5 border"
            style={{
              backgroundColor: `${badge.color}1A`,
              borderColor: `${badge.color}80`,
            }}
          >
            <Text
              className="text-[9px] font-bold tracking-wide"
              style={{ color: badge.color }}
            >
              {badge.label}
            </Text>
          </View>
        </View>
      )}

      {/* Action phrase */}
      <Text className="text-white/50 text-xs mt-2 font-medium">
        {actionPhrase}
      </Text>

      {/* Motif */}
      {capsule.reason ? (
        <Text
          className="text-white/70 text-sm italic mt-1"
          style={{ fontStyle: "italic" }}
        >
          {`\u201E ${capsule.reason} \u201C`}
        </Text>
      ) : null}

      {/* Action buttons — only for involved users */}
      {capsule.status === "pending" && isDebtor && (
        <View className="flex-row gap-2.5 mt-3">
          <Pressable
            onPress={() => onAccept?.(capsule.id)}
            disabled={isPending}
            className="flex-1 rounded-lg py-2.5 items-center border-2 border-[#00FF66] bg-[#00FF66]/15 active:opacity-70"
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#00FF66" />
            ) : (
              <Text className="text-[#00FF66] text-xs font-bold">
                JE FOURNIS ⛽
              </Text>
            )}
          </Pressable>
          <Pressable
            onPress={() => onRefuse?.(capsule.id)}
            disabled={isPending}
            className="flex-1 rounded-lg py-2.5 items-center border-2 border-[#FF3B30] bg-[#FF3B30]/15 active:opacity-70"
          >
            <Text className="text-[#FF3B30] text-xs font-bold">REFUSER</Text>
          </Pressable>
        </View>
      )}

      {capsule.status === "active" && isCreditor && (
        <Pressable
          onPress={() => onRequestLaunch?.(capsule.id)}
          disabled={isPending}
          className="mt-3 py-2.5 items-center rounded-lg border-2 border-[#FF6B1A] bg-[#FF6B1A]/15 active:opacity-70"
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#FF6B1A" />
          ) : (
            <Text className="text-[#FF6B1A] text-xs font-bold uppercase tracking-wide">
              🔥 MISE À FEU
            </Text>
          )}
        </Pressable>
      )}

      {capsule.status === "launch_requested" && isDebtor && (
        <Pressable
          onPress={() => onAuthorize?.(capsule.id)}
          disabled={isPending}
          className="mt-3 py-2.5 items-center rounded-lg border-2 border-[#FF6B1A] bg-[#FF6B1A] active:opacity-70"
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white text-xs font-bold uppercase tracking-wide">
              🚀 AUTORISER LE LANCEMENT
            </Text>
          )}
        </Pressable>
      )}
    </Animated.View>
  );
}
