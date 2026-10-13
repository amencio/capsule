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
  { label: "Carburant", value: "active" },
  { label: "Mise à feu", value: "launch_requested" },
  { label: "Résolues", value: "resolved" },
  { label: "Refusées", value: "rejected" },
  { label: "Expirées", value: "expired" },
];

export default function ActiviteScreen() {
  const {
    currentUserId,
    pendingActionId,
    handleAccept,
    handleRefuse,
    handleRequestLaunch,
    handleAuthorizeLaunch,
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
      <SpaceBackground />

      <View className="px-4 pt-4 pb-2 z-10">
        <Text className="text-white text-xl font-bold">Activité</Text>
        <Text className="text-white/40 text-xs mt-0.5">
          Historique complet — Altitude: +{altitude}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 pb-3 z-10"
      >
        <View className="flex-row gap-2">
          {FILTERS.map((f) => (
            <Pressable
              key={f.value}
              onPress={() => {
                setFilter(f.value);
                Haptics.selectionAsync();
              }}
              className={`px-3 py-1.5 rounded-lg border-2 border-black ${
                filter === f.value
                  ? "bg-[#4ade80]"
                  : "bg-[#f8f9fa] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  filter === f.value ? "text-black" : "text-black/50"
                }`}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <ScrollView
        contentContainerClassName="px-4 pb-8 z-10"
        showsVerticalScrollIndicator={false}
      >
        {filteredCapsules.length === 0 ? (
          <View className="bg-[#f8f9fa] border-2 border-dashed border-black rounded-2xl p-6 items-center mt-4">
            <Text className="text-black/30 text-sm">Aucune activité</Text>
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
              onRequestLaunch={handleRequestLaunch}
              onAuthorize={handleAuthorizeLaunch}
              isPending={pendingActionId === capsule.id}
            />
          ))
        )}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
