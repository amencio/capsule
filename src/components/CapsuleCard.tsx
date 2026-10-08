import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { STATUS_LABELS, STATUS_COLORS } from "../constants/theme";
import type { CapsuleTicket } from "../types";

interface CapsuleCardProps {
  ticket: CapsuleTicket;
  currentUserId: string;
  profiles: Record<string, { pseudo: string }>;
  onAccept?: (id: string) => void;
  onRefuse?: (id: string) => void;
  onDecapsuler?: (id: string) => void;
  isPending?: boolean;
}

export function CapsuleCard({
  ticket,
  currentUserId,
  profiles,
  onAccept,
  onRefuse,
  onDecapsuler,
  isPending = false,
}: CapsuleCardProps) {
  const isFromMe = ticket.from_user === currentUserId;
  const otherId = isFromMe ? ticket.to_user : ticket.from_user;
  const otherPseudo = profiles[otherId]?.pseudo ?? "???";
  const statusColor = STATUS_COLORS[ticket.status];
  const direction = isFromMe ? `→ ${otherPseudo}` : `← ${otherPseudo}`;
  const dateStr = new Date(ticket.created_at).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });

  return (
    <View className="bg-space-card border border-space-border rounded-2xl p-4 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-white/60 text-xs font-semibold">{direction}</Text>
        <View
          className="px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${statusColor}20` }}
        >
          <Text
            className="text-[10px] font-bold tracking-wide"
            style={{ color: statusColor }}
          >
            {STATUS_LABELS[ticket.status]}
          </Text>
        </View>
      </View>

      <Text className="text-white text-base font-medium mb-1">
        {ticket.motif}
      </Text>
      <Text className="text-white/40 text-xs">{dateStr}</Text>

      {ticket.status === "pending" && !isFromMe && (
        <View className="flex-row gap-3 mt-3">
          <Pressable
            onPress={() => onAccept?.(ticket.id)}
            disabled={isPending}
            className="flex-1 bg-neon-green/20 border border-neon-green rounded-xl py-2.5 items-center flex-row justify-center gap-2"
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#00FF66" />
            ) : (
              <Text className="text-neon-green text-sm font-bold">Accepter</Text>
            )}
          </Pressable>
          <Pressable
            onPress={() => onRefuse?.(ticket.id)}
            disabled={isPending}
            className="flex-1 bg-neon-red/20 border border-neon-red rounded-xl py-2.5 items-center"
          >
            <Text className="text-neon-red text-sm font-bold">Refuser</Text>
          </Pressable>
        </View>
      )}

      {ticket.status === "pending" && isFromMe && (
        <Text className="text-neon-yellow/80 text-xs mt-3 italic">
          En attente de validation...
        </Text>
      )}

      {ticket.status === "active" && (
        <Pressable
          onPress={() => onDecapsuler?.(ticket.id)}
          disabled={isPending}
          className="mt-3 bg-neon-green rounded-xl py-3 items-center flex-row justify-center gap-2"
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#0D0D11" />
          ) : (
            <Text className="text-space-deep text-sm font-bold tracking-wide">
              🍾 DÉCAPSULER
            </Text>
          )}
        </Pressable>
      )}

      {ticket.status === "paid" && (
        <Text className="text-neon-red/60 text-xs mt-3 italic">
          Capsule décapsulée ✓
        </Text>
      )}
    </View>
  );
}
