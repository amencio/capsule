import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { SpaceBackground } from "../../components/SpaceBackground";
import { useAuthContext } from "../../context/AuthProvider";
import { useCapsuleStore } from "../../context/CapsuleProvider";
import { getNextRank, getProgressToNext } from "../../utils/ranks";

export default function ProfilScreen() {
  const { profile, signOut } = useAuthContext();
  const {
    capsules,
    currentUserId,
    altitude,
    carburantDisponible,
    karma,
    rank,
  } = useCapsuleStore();

  if (!profile) return null;

  const totalCapsules = capsules.filter(
    (c) => c.creditor_id === currentUserId || c.debtor_id === currentUserId
  ).length;

  const nextRank = getNextRank(altitude);
  const progress = getProgressToNext(altitude);

  const karmaLabel =
    karma > 0
      ? `Portance +${karma} ⬆️`
      : karma < 0
      ? `Gravité ${karma} ⬇️`
      : "Équilibre gravitationnel ⚖️";

  const karmaColor =
    karma > 0 ? "#4ade80" : karma < 0 ? "#f87171" : "#06b6d4";

  async function handleSignOut() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signOut();
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-space-deep">
      <SpaceBackground />

      <ScrollView
        contentContainerClassName="px-4 pt-8 pb-8 z-10"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-8">
          <View className="w-24 h-24 rounded-full items-center justify-center border-2 border-black overflow-hidden bg-[#f8f9fa] mb-4 shadow-[4px_6px_0px_0px_rgba(0,0,0,1)]">
            {profile.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={{ width: 92, height: 92 }}
                contentFit="cover"
              />
            ) : (
              <Text className="text-black text-3xl font-bold">
                {profile.pseudo.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>

          <Text className="text-white text-2xl font-bold">{profile.pseudo}</Text>
          <View className="flex-row items-center gap-2 mt-2">
            <Text style={{ color: rank.color }} className="text-sm font-bold">
              {rank.emoji} {rank.name}
            </Text>
            {nextRank && (
              <Text className="text-white/40 text-xs">
                → {nextRank.emoji} {nextRank.name}
              </Text>
            )}
          </View>

          {nextRank && (
            <View className="mt-2 items-center w-48">
              <View className="w-full h-3 bg-[#f8f9fa] rounded-full overflow-hidden border-2 border-black">
                <View
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    backgroundColor: rank.color,
                    borderRadius: 999,
                  }}
                />
              </View>
              <Text className="text-white/40 text-[10px] mt-1">
                {altitude}/{nextRank.minAltitude} vers {nextRank.name}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-[#f8f9fa] border-2 border-black rounded-xl p-4 items-center shadow-[2px_4px_0px_0px_rgba(0,0,0,1)]">
            <Text
              style={{ color: rank.color }}
              className="text-3xl font-bold"
            >
              {altitude}
            </Text>
            <Text className="text-black/50 text-xs mt-1">Altitude</Text>
          </View>
          <View className="flex-1 bg-[#f8f9fa] border-2 border-black rounded-xl p-4 items-center shadow-[2px_4px_0px_0px_rgba(0,0,0,1)]">
            <Text className="text-[#4ade80] text-3xl font-bold">
              {carburantDisponible}
            </Text>
            <Text className="text-black/50 text-xs mt-1">⛽ Carburant</Text>
          </View>
          <View className="flex-1 bg-[#f8f9fa] border-2 border-black rounded-xl p-4 items-center shadow-[2px_4px_0px_0px_rgba(0,0,0,1)]">
            <Text className="text-[#4ade80] text-3xl font-bold">
              {totalCapsules}
            </Text>
            <Text className="text-black/50 text-xs mt-1">Capsules</Text>
          </View>
        </View>

        <View
          className="rounded-xl p-4 mb-4 border-2 border-black shadow-[2px_4px_0px_0px_rgba(0,0,0,1)]"
          style={{ backgroundColor: "#f8f9fa" }}
        >
          <Text className="text-black/40 text-xs font-bold tracking-widest uppercase mb-2">
            Balance gravitationnelle
          </Text>
          <Text style={{ color: karmaColor }} className="text-lg font-bold">
            {karmaLabel}
          </Text>
          <Text className="text-black/40 text-xs mt-1">
            {karma > 0
              ? "Tu es porté — les autres te doivent plus que tu ne dois."
              : karma < 0
              ? "Tu es plaqué au sol — tu dois plus que tu ne reçois."
              : "Équilibre parfait entre dettes et crédits."}
          </Text>
        </View>

        <View className="bg-[#f8f9fa] border-2 border-black rounded-xl p-4 mb-4 shadow-[2px_4px_0px_0px_rgba(0,0,0,1)]">
          <Text className="text-black/40 text-xs font-bold tracking-widest uppercase mb-3">
            Paramètres
          </Text>

          <View className="flex-row items-center justify-between py-3 border-b border-black/10">
            <Text className="text-black/70 text-sm">Pseudo</Text>
            <Text className="text-black text-sm font-semibold">{profile.pseudo}</Text>
          </View>

          <View className="flex-row items-center justify-between py-3 border-b border-black/10">
            <Text className="text-black/70 text-sm">Avatar</Text>
            <Text className="text-black/50 text-xs">
              {profile.avatar_url ? "Configuré" : "Par défaut"}
            </Text>
          </View>

          <View className="flex-row items-center justify-between py-3">
            <Text className="text-black/70 text-sm">Solde global</Text>
            <Text className="text-black text-sm font-semibold">{profile.solde_global}</Text>
          </View>
        </View>

        <Pressable
          onPress={handleSignOut}
          className="bg-[#f87171] border-2 border-black rounded-xl py-4 items-center shadow-[2px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
        >
          <Text className="text-black text-sm font-bold">
            Déconnexion
          </Text>
        </Pressable>

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
