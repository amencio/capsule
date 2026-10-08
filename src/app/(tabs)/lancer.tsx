import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
} from "react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useAuthContext } from "../../context/AuthProvider";
import { useHoustonToast } from "../../context/HoustonToastContext";
import { useTickets } from "../../hooks/useTickets";
import { useProfiles } from "../../hooks/useProfiles";
import { SafeAreaView } from "react-native-safe-area-context";

const SUGGESTED_MOTIFS = [
  "Tu m'as chauffé sur un projet 🚀",
  "J'ai payé le dernier tour 🍻",
  "Tu as oublié ton portefeuille 💸",
  "Pour fêter ça 🎉",
  "Parce que tu le vaux bien 😎",
];

export default function LancerScreen() {
  const { profile } = useAuthContext();
  const { showHoustonToast } = useHoustonToast();
  const userId = profile?.id;
  const { launchCapsule } = useTickets(userId);
  const { list, loading } = useProfiles(userId);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [motif, setMotif] = useState("");

  const submitting = launchCapsule.isPending;
  const friends = list.filter((p) => p.id !== userId);

  function handleLaunch() {
    if (!selectedId || !motif.trim()) {
      showHoustonToast("Houston, on a un problème !", "Sélectionne un astronaute et un motif.", "warning");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    launchCapsule.mutate(
      { toUserId: selectedId, motif: motif.trim() },
      {
        onSuccess: () => {
          setSelectedId(null);
          setMotif("");
          showHoustonToast("Capsule mise en orbite !", "En attente de validation bilatérale.", "success");
          router.push("/(tabs)/frigo");
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : "Erreur inconnue";
          showHoustonToast("Houston, échec de lancement", msg, "danger");
        },
      }
    );
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-space-deep">
      <ScrollView
        contentContainerClassName="px-6 pt-12 pb-8"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-white text-2xl font-bold mb-1">
          Lancer une capsule 🚀
        </Text>
        <Text className="text-white/40 text-sm mb-6">
          Réclame un verre à un ami
        </Text>

        <Text className="text-white/60 text-sm font-semibold mb-3">
          À qui ?
        </Text>

        {loading ? (
          <Text className="text-white/40 text-sm">Chargement des astronautes...</Text>
        ) : friends.length === 0 ? (
          <Text className="text-white/40 text-sm">
            Aucun autre astronaute trouvé.
          </Text>
        ) : (
          <View className="flex-row flex-wrap gap-2 mb-6">
            {friends.map((friend) => (
              <Pressable
                key={friend.id}
                onPress={() => setSelectedId(friend.id)}
                className={`px-4 py-2.5 rounded-xl border ${
                  selectedId === friend.id
                    ? "bg-neon-green/20 border-neon-green"
                    : "bg-space-surface border-space-border"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    selectedId === friend.id ? "text-neon-green" : "text-white/70"
                  }`}
                >
                  {friend.pseudo}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <Text className="text-white/60 text-sm font-semibold mb-3">
          Motif
        </Text>
        <TextInput
          value={motif}
          onChangeText={setMotif}
          placeholder="Pourquoi ce verre ?"
          placeholderTextColor="#666"
          multiline
          className="bg-space-surface border border-space-border rounded-xl px-4 py-3.5 text-white min-h-[80px] mb-3"
        />

        <View className="flex-row flex-wrap gap-2 mb-6">
          {SUGGESTED_MOTIFS.map((m) => (
            <Pressable
              key={m}
              onPress={() => setMotif(m)}
              className="bg-space-card border border-space-border rounded-lg px-3 py-1.5"
            >
              <Text className="text-white/50 text-xs">{m}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={handleLaunch}
          disabled={submitting || !selectedId || !motif.trim()}
          className={`rounded-xl py-4 items-center ${
            submitting || !selectedId || !motif.trim()
              ? "bg-space-border"
              : "bg-neon-green"
          }`}
        >
          <Text
            className={`text-base font-bold ${
              submitting || !selectedId || !motif.trim()
                ? "text-white/30"
                : "text-space-deep"
            }`}
          >
            {submitting ? "..." : "🚀 Lancer la capsule"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
