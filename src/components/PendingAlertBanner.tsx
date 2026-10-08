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
      className="bg-[#fbbf24] border-2 border-black rounded-xl px-4 py-2.5 mb-3 flex-row items-center shadow-[2px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
    >
      <Text className="text-base mr-2">⚠️</Text>
      <Text className="text-black text-xs font-bold flex-1">
        {count} capsule{count > 1 ? "s" : ""} en attente de validation
      </Text>
      <Text className="text-black/60 text-xs font-bold">→</Text>
    </Pressable>
  );
}
