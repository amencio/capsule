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
    tankLevel,
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
    karma > 0 ? "#00FF66" : karma < 0 ? "#FF3B30" : "#00F0FF";

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
          <View className="w-24 h-24 rounded-full items-center justify-center border-2 border-[#2E2E3A] overflow-hidden bg-[#22222E] mb-4">
            {profile.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={{ width: 92, height: 92 }}
                contentFit="cover"
              />
            ) : (
              <Text className="text-white text-3xl font-bold">
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
              <View className="w-full h-3 bg-[#22222E] rounded-full overflow-hidden border-2 border-[#2E2E3A]">
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
          <View className="flex-1 bg-[#22222E] border-2 border-[#2E2E3A] rounded-xl p-4 items-center">
            <Text
              style={{ color: rank.color }}
              className="text-3xl font-bold"
            >
              {altitude}
            </Text>
            <Text className="text-white/50 text-xs mt-1">Altitude</Text>
          </View>
          <View className="flex-1 bg-[#22222E] border-2 border-[#2E2E3A] rounded-xl p-4 items-center">
            <Text className="text-[#00FF66] text-3xl font-bold">
              {tankLevel}
            </Text>
            <Text className="text-white/50 text-xs mt-1">⛽ Carburant</Text>
          </View>
          <View className="flex-1 bg-[#22222E] border-2 border-[#2E2E3A] rounded-xl p-4 items-center">
            <Text className="text-[#00FF66] text-3xl font-bold">
              {totalCapsules}
            </Text>
            <Text className="text-white/50 text-xs mt-1">Capsules</Text>
          </View>
        </View>

        <View
          className="rounded-xl p-4 mb-4 border-2 border-[#2E2E3A] bg-[#22222E]"
        >
          <Text className="text-white/40 text-xs font-bold tracking-widest uppercase mb-2">
            Balance gravitationnelle
          </Text>
          <Text style={{ color: karmaColor }} className="text-lg font-bold">
            {karmaLabel}
          </Text>
          <Text className="text-white/40 text-xs mt-1">
            {karma > 0
              ? "Tu es porté — les autres te doivent plus de carburant que tu n'en dois."
              : karma < 0
              ? "Tu es plaqué au sol — tu dois plus de carburant que tu n'en reçois."
              : "Équilibre parfait — autant de carburant à donner qu'à recevoir."}
          </Text>
        </View>

        <View className="bg-[#22222E] border-2 border-[#2E2E3A] rounded-xl p-4 mb-4">
          <Text className="text-white/40 text-xs font-bold tracking-widest uppercase mb-3">
            Paramètres
          </Text>

          <View className="flex-row items-center justify-between py-3 border-b border-[#2E2E3A]">
            <Text className="text-white/70 text-sm">Pseudo</Text>
            <Text className="text-white text-sm font-semibold">{profile.pseudo}</Text>
          </View>

          <View className="flex-row items-center justify-between py-3 border-b border-[#2E2E3A]">
            <Text className="text-white/70 text-sm">Avatar</Text>
            <Text className="text-white/50 text-xs">
              {profile.avatar_url ? "Configuré" : "Par défaut"}
            </Text>
          </View>

          <View className="flex-row items-center justify-between py-3">
            <Text className="text-white/70 text-sm">Solde global</Text>
            <Text className="text-white text-sm font-semibold">{profile.solde_global}</Text>
          </View>
        </View>

        <Pressable
          onPress={handleSignOut}
          className="bg-[#FF3B30]/15 border-2 border-[#FF3B30] rounded-xl py-4 items-center active:opacity-70"
        >
          <Text className="text-[#FF3B30] text-sm font-bold">
            Déconnexion
          </Text>
        </Pressable>

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
