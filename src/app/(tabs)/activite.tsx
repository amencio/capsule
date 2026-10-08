import { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { SpaceBackground } from "../../components/SpaceBackground";
import { CapsuleCard } from "../../components/CapsuleCard";
import { useCapsuleStore } from "../../context/CapsuleProvider";
import type { CapsuleStatus } from "../../types";

type FilterType = "all" | CapsuleStatus;

const FILTERS: { label: string; value: FilterType }[] = [
  { label: "Tout", value: "all" },
  { label: "En attente", value: "pending" },
  { label: "En orbite", value: "active" },
  { label: "Lancement", value: "pending_launch" },
  { label: "Résolues", value: "resolved" },
];

export default function ActiviteScreen() {
  const {
    currentUserId,
    pendingActionId,
    handleAccept,
    handleRefuse,
    handleDecapsuler,
    handleAuthorize,
    allUserCapsules,
    altitude,
    profilesMap,
  } = useCapsuleStore();

  const [filter, setFilter] = useState<FilterType>("all");

  const filteredCapsules = allUserCapsules.filter(
    (c) => filter === "all" || c.status === filter
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-space-deep">
      <SpaceBackground width={390} height={844} />

      <View className="px-4 pt-4 pb-2 z-10">
        <Text className="text-white text-xl font-bold">Activité</Text>
        <Text className="text-white/40 text-xs mt-0.5">
          Historique complet — Altitude: {altitude}
        </Text>
      </View>

      <View className="flex-row flex-wrap px-4 pb-3 z-10">
        {FILTERS.map((f) => (
          <Pressable
            key={f.value}
            onPress={() => {
              setFilter(f.value);
              Haptics.selectionAsync();
            }}
            className={`mr-2 mb-1 px-3 py-1.5 rounded-lg border ${
              filter === f.value
                ? "bg-neon-green/15 border-neon-green/50"
                : "bg-space-surface border-space-border"
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                filter === f.value ? "text-neon-green" : "text-white/50"
              }`}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerClassName="px-4 pb-8 z-10"
        showsVerticalScrollIndicator={false}
      >
        {filteredCapsules.length === 0 ? (
          <View className="bg-space-card/50 border border-dashed border-space-border rounded-2xl p-6 items-center mt-4">
            <Text className="text-white/30 text-sm">Aucune activité</Text>
          </View>
        ) : (
          filteredCapsules.map((capsule) => (
            <CapsuleCard
              key={capsule.id}
              capsule={capsule}
              currentUserId={currentUserId}
              profiles={profilesMap}
              onAccept={handleAccept}
              onRefuse={handleRefuse}
              onDecapsuler={handleDecapsuler}
              onAuthorize={handleAuthorize}
              isPending={pendingActionId === capsule.id}
            />
          ))
        )}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
