import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useAuthContext } from "../../context/AuthProvider";
import { useTickets } from "../../hooks/useTickets";
import { GravJauge } from "../../components/GravJauge";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OrbiteScreen() {
  const { profile, signOut } = useAuthContext();
  const router = useRouter();
  const userId = profile?.id;
  const { pendingTickets, activeTickets } = useTickets(userId);

  if (!profile) return null;

  const solde = profile.solde_global;
  const isZeroGravity = solde === 0;

  async function handleSignOut() {
    await signOut();
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-space-deep">
      <View className="flex-row items-center justify-between px-6 pt-4">
        <Text className="text-neon-green text-sm font-bold tracking-widest uppercase">
          Capsule
        </Text>
        <Pressable
          onPress={handleSignOut}
          className="bg-space-surface border border-space-border rounded-xl px-3 py-1.5"
        >
          <Text className="text-neon-red/80 text-xs font-semibold">
            Déconnexion
          </Text>
        </Pressable>
      </View>
      <ScrollView
        contentContainerClassName="flex-1 items-center pt-12 px-6"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-white/40 text-xs tracking-widest uppercase mb-1">
          Bonjour,
        </Text>
        <Text className="text-white text-2xl font-bold mb-8">
          {profile.pseudo} 🛰️
        </Text>

        <GravJauge solde={solde} pseudo={profile.pseudo} avatarUrl={profile.avatar_url} />

        <View className="flex-row gap-3 mt-8 w-full max-w-xs">
          <View className="flex-1 bg-space-surface border border-space-border rounded-2xl p-4 items-center">
            <Text className="text-neon-green text-2xl font-bold">
              {activeTickets.length}
            </Text>
            <Text className="text-white/50 text-xs mt-1">Capsules actives</Text>
          </View>
          <View className="flex-1 bg-space-surface border border-space-border rounded-2xl p-4 items-center">
            <Text className="text-neon-yellow text-2xl font-bold">
              {pendingTickets.length}
            </Text>
            <Text className="text-white/50 text-xs mt-1">En attente</Text>
          </View>
        </View>

        {pendingTickets.length > 0 && (
          <Pressable
            onPress={() => router.push("/(tabs)/frigo")}
            className="mt-6 bg-neon-yellow/20 border border-neon-yellow rounded-xl px-5 py-3"
          >
            <Text className="text-neon-yellow text-sm font-bold">
              ⚠ Houston, {pendingTickets.length} capsule{pendingTickets.length > 1 ? "s" : ""} en approche !
            </Text>
          </Pressable>
        )}

        {isZeroGravity && (
          <View className="mt-6 bg-neon-cyan/10 border border-neon-cyan rounded-2xl px-5 py-4">
            <Text className="text-neon-cyan text-sm font-bold text-center">
              ⚖ GRAVITÉ ZÉRO
            </Text>
            <Text className="text-white/50 text-xs text-center mt-1">
              Équilibre parfait. Aucune dette, aucun crédit.
            </Text>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
      <View className="h-4" />
    </SafeAreaView>
  );
}
