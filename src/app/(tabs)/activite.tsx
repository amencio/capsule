import { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { SpaceBackground } from "../../components/SpaceBackground";
import { CapsuleCard } from "../../components/CapsuleCard";
import {
  MOCK_CAPSULES,
  MOCK_PROFILES_MAP,
  CURRENT_USER_ID,
} from "../../data/mocks";
import { calculateAltitude } from "../../utils/karma";
import type { Capsule, CapsuleStatus } from "../../types";

type FilterType = "all" | CapsuleStatus;

const FILTERS: { label: string; value: FilterType }[] = [
  { label: "Tout", value: "all" },
  { label: "En attente", value: "pending" },
  { label: "En orbite", value: "active" },
  { label: "Lancement", value: "pending_launch" },
  { label: "Résolues", value: "resolved" },
];

export default function ActiviteScreen() {
  const [currentUserId] = useState(CURRENT_USER_ID);
  const [capsules, setCapsules] = useState<Capsule[]>(MOCK_CAPSULES);
  const [filter, setFilter] = useState<FilterType>("all");
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const allCapsules = capsules
    .filter((c) => c.creditor_id === currentUserId || c.debtor_id === currentUserId)
    .filter((c) => filter === "all" || c.status === filter)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const altitude = calculateAltitude(capsules, currentUserId);

  const handleAccept = (id: string) => {
    setPendingActionId(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCapsules((prev) => prev.map((c) => (c.id === id ? { ...c, status: "active" } : c)));
    setPendingActionId(null);
  };

  const handleRefuse = (id: string) => {
    setPendingActionId(id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setCapsules((prev) => prev.filter((c) => c.id !== id));
    setPendingActionId(null);
  };

  const handleDecapsuler = (id: string) => {
    setPendingActionId(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCapsules((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "pending_launch" } : c))
    );
    setPendingActionId(null);
  };

  const handleAuthorize = (id: string) => {
    setPendingActionId(id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCapsules((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: "resolved", resolved_at: new Date().toISOString() } : c
      )
    );
    setPendingActionId(null);
  };

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
        {allCapsules.length === 0 ? (
          <View className="bg-space-card/50 border border-dashed border-space-border rounded-2xl p-6 items-center mt-4">
            <Text className="text-white/30 text-sm">Aucune activité</Text>
          </View>
        ) : (
          allCapsules.map((capsule) => (
            <CapsuleCard
              key={capsule.id}
              capsule={capsule}
              currentUserId={currentUserId}
              profiles={MOCK_PROFILES_MAP}
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
