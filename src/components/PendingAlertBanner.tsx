import { Text, Pressable } from "react-native";

interface PendingAlertBannerProps {
  count: number;
  onPress?: () => void;
}

export function PendingAlertBanner({ count, onPress }: PendingAlertBannerProps) {
  if (count === 0) return null;

  return (
    <Pressable
      onPress={onPress}
      className="bg-neon-yellow/15 border border-neon-yellow/40 rounded-xl px-4 py-2.5 mb-3 flex-row items-center"
    >
      <Text className="text-base mr-2">⚠️</Text>
      <Text className="text-neon-yellow text-xs font-bold flex-1">
        {count} capsule{count > 1 ? "s" : ""} en attente de validation
      </Text>
      <Text className="text-neon-yellow/60 text-xs font-bold">→</Text>
    </Pressable>
  );
}
