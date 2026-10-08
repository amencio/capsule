import { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import * as Haptics from "expo-haptics";
import { useAuthContext } from "../../context/AuthProvider";
import { useHoustonToast } from "../../context/HoustonToastContext";
import { useTickets } from "../../hooks/useTickets";
import { useProfiles } from "../../hooks/useProfiles";
import { CapsuleCard } from "../../components/CapsuleCard";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FrigoScreen() {
  const { profile } = useAuthContext();
  const { showHoustonToast } = useHoustonToast();
  const userId = profile?.id;
  const { activeTickets, pendingTickets, accept, refuse, decapsuler } = useTickets(userId);
  const { profiles } = useProfiles(userId);

  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  if (!userId) return null;

  function handleAccept(id: string) {
    if (pendingActionId) return;
    setPendingActionId(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    accept.mutate(id, {
      onSuccess: () => {
        showHoustonToast("Capsule acceptée !", "Verre ajouté au Frigo en orbite.", "success");
      },
      onError: (err) => {
        const msg = err instanceof Error ? err.message : "Erreur inconnue";
        showHoustonToast("Houston, échec", msg, "danger");
      },
      onSettled: () => setPendingActionId(null),
    });
  }

  function handleRefuse(id: string) {
    if (pendingActionId) return;
    setPendingActionId(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refuse.mutate(id, {
      onSuccess: () => {
        showHoustonToast("Capsule rejetée", "Demande annulée.", "warning");
      },
      onError: (err) => {
        const msg = err instanceof Error ? err.message : "Erreur inconnue";
        showHoustonToast("Houston, échec", msg, "danger");
      },
      onSettled: () => setPendingActionId(null),
    });
  }

  function handleDecapsuler(id: string) {
    if (pendingActionId) return;
    setPendingActionId(id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    decapsuler.mutate(id, {
      onSuccess: () => {
        showHoustonToast("Décapsulé ! 🍾", "Contrat social validé et soldé.", "success");
      },
      onError: (err) => {
        const msg = err instanceof Error ? err.message : "Erreur inconnue";
        showHoustonToast("Houston, échec", msg, "danger");
      },
      onSettled: () => setPendingActionId(null),
    });
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-space-deep">
      <View className="px-6 pt-12 pb-4">
        <Text className="text-white text-2xl font-bold">Le Frigo 🧊</Text>
        <Text className="text-white/40 text-sm mt-1">
          Tes capsules en cours
        </Text>
      </View>

      <ScrollView
        contentContainerClassName="px-6 pb-8"
        showsVerticalScrollIndicator={false}
      >
        {pendingTickets.length > 0 && (
          <View className="mb-6">
            <Text className="text-neon-yellow text-xs font-bold tracking-widest uppercase mb-3">
              ⚠ Capsules en approche
            </Text>
            {pendingTickets.map((ticket) => (
              <CapsuleCard
                key={ticket.id}
                ticket={ticket}
                currentUserId={userId}
                profiles={profiles}
                onAccept={handleAccept}
                onRefuse={handleRefuse}
                isPending={pendingActionId === ticket.id}
              />
            ))}
          </View>
        )}

        <Text className="text-neon-green text-xs font-bold tracking-widest uppercase mb-3">
          🍻 En orbite
        </Text>

        {activeTickets.length === 0 ? (
          <View className="bg-space-surface border border-space-border rounded-2xl p-6 items-center">
            <Text className="text-white/40 text-sm">
              Aucune capsule en orbite.
            </Text>
            <Text className="text-white/30 text-xs mt-1">
              {"Va dans l'onglet \"Lancer\" pour réclamer un verre 🚀"}
            </Text>
          </View>
        ) : (
          activeTickets.map((ticket) => (
            <CapsuleCard
              key={ticket.id}
              ticket={ticket}
              currentUserId={userId}
              profiles={profiles}
              onDecapsuler={handleDecapsuler}
              isPending={pendingActionId === ticket.id}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
