import { useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { SpaceBackground } from "../../components/SpaceBackground";
import { CapsuleCard } from "../../components/CapsuleCard";
import { useCapsuleStore } from "../../context/CapsuleProvider";
import type { CapsuleStatus } from "../../types";

type FilterType = "all" | CapsuleStatus | "terminated";
type ScopeType = "mine" | "friends";

const FILTERS: { label: string; value: FilterType }[] = [
  { label: "Tout", value: "all" },
  { label: "Ravitaillement", value: "pending" },
  { label: "Carburant", value: "active" },
  { label: "Mise à feu", value: "launch_requested" },
  { label: "Terminées", value: "terminated" },
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
    allFriendsCapsules,
    altitude,
    profilesMap,
  } = useCapsuleStore();

  const [filter, setFilter] = useState<FilterType>("all");
  const [scope, setScope] = useState<ScopeType>("mine");

  const sourceCapsules = scope === "mine" ? allUserCapsules : allFriendsCapsules;

  const filteredCapsules = sourceCapsules.filter((c) => {
    if (filter === "all") return true;
    if (filter === "terminated")
      return (
        c.status === "resolved" ||
        c.status === "rejected" ||
        c.status === "expired"
      );
    return c.status === filter;
  });

  const handleFilterPress = useCallback((value: FilterType) => {
    setFilter(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  const handleScopePress = useCallback((value: ScopeType) => {
    setScope(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-space-deep">
      <SpaceBackground />

      <View className="px-4 pt-3 pb-1 z-10">
        <Text className="text-white text-xl font-bold">Activité</Text>
        <Text className="text-white/40 text-xs mt-0.5">
          Historique complet — Altitude: +{altitude}
        </Text>
      </View>

      <View className="flex-row mx-4 mb-2 rounded-lg border border-[#2E2E3A] overflow-hidden z-10">
        {(["mine", "friends"] as ScopeType[]).map((s) => {
          const active = scope === s;
          return (
            <Pressable
              key={s}
              onPress={() => handleScopePress(s)}
              className={`flex-1 py-1.5 items-center ${active ? "bg-[#00F0FF]" : "bg-[#22222E]"}`}
            >
              <Text
                className={`text-xs font-bold ${active ? "text-black" : "text-white/50"}`}
              >
                {s === "mine" ? "Mes activités" : "Amis"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row gap-2 px-4 py-1 z-10">
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <Pressable
              key={f.value}
              onPress={() => handleFilterPress(f.value)}
              className={`px-3 py-1.5 rounded-lg border ${
                active
                  ? "bg-[#00FF66] border-[#00FF66]"
                  : "bg-[#22222E] border-[#2E2E3A]"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  active ? "text-black" : "text-white/50"
                }`}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        className="flex-1 z-10"
        contentContainerClassName="px-4 pb-8"
        showsVerticalScrollIndicator={false}
      >
        {filteredCapsules.length === 0 ? (
          <View className="bg-[#1a1a24] border border-dashed border-[#2E2E3A] rounded-2xl p-6 items-center mt-2">
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
