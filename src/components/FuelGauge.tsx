import { View, Text } from "react-native";

interface FuelGaugeProps {
  level: number;
  max: number;
}

export function FuelGauge({ level, max }: FuelGaugeProps) {
  const segments = Array.from({ length: max });

  return (
    <View className="flex-row items-center gap-2 flex-1 min-w-0">
      <View className="flex-row gap-[3px] flex-1 min-w-0">
        {segments.map((_, i) => {
          const filled = i < level;
          return (
            <View
              key={i}
              style={{
                flex: 1,
                height: 16,
                borderRadius: 4,
                borderWidth: 1.5,
                borderColor: "#000",
                backgroundColor: filled ? "#00FF66" : "rgba(255,255,255,0.08)",
              }}
            />
          );
        })}
      </View>
      <Text
        style={{
          color: level > 0 ? "#00FF66" : "rgba(255,255,255,0.3)",
          fontSize: 12,
          fontWeight: "bold",
        }}
      >
        {level}/{max}
      </Text>
    </View>
  );
}
