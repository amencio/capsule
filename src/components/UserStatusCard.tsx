import { View, Text } from "react-native";
import { Image } from "expo-image";
import { FuelGauge } from "./FuelGauge";
import { TANK_MAX_CAPACITY } from "../constants/game";
import type { UserProfile } from "../types";
import type { OrbitalRank } from "../utils/ranks";

interface UserStatusCardProps {
  user: UserProfile;
  altitude: number;
  tankLevel: number;
  rank: OrbitalRank;
}

export function UserStatusCard({ user, altitude, tankLevel, rank }: UserStatusCardProps) {
  const hasFuel = tankLevel > 0;

  return (
    <View
      className="flex-row items-center gap-3 rounded-2xl border-2 border-black bg-[#1a233a] px-4 py-3"
      style={{ shadowColor: "#000", shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5 }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          borderWidth: 2,
          borderColor: "#000",
          overflow: "hidden",
          backgroundColor: "#444",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={{ width: 40, height: 40 }} contentFit="cover" />
        ) : (
          <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
            {user.pseudo.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>

      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="text-white text-base font-bold">{user.pseudo}</Text>
          <Text style={{ color: rank.color }} className="text-sm font-bold">
            {rank.emoji} {rank.name}
          </Text>
        </View>

        <View className="flex-row items-center justify-between mt-1.5">
          <Text className="text-white/40 text-xs font-bold">+{altitude} altitude</Text>
          <View className="flex-row items-center gap-2 flex-1 min-w-0">
            <FuelGauge level={tankLevel} max={TANK_MAX_CAPACITY} />
          </View>
        </View>

        <View className="flex-row items-center justify-between mt-1">
          <Text className="text-white/30 text-[9px] font-bold">⛽ Carburant</Text>
          {hasFuel ? (
            <View className="flex-row items-center gap-1">
              <View className="w-1.5 h-1.5 rounded-full bg-[#00FF66] border border-black" />
              <Text className="text-[#00FF66] text-[9px] font-bold tracking-wide">PRÊT</Text>
            </View>
          ) : (
            <Text className="text-[#f97316] text-[9px] font-bold tracking-wide">RÉSERVOIR VIDE</Text>
          )}
        </View>
      </View>
    </View>
  );
}
