import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { SpaceBackground } from "../../components/SpaceBackground";
import { useAuthContext } from "../../context/AuthProvider";
import { MOCK_CAPSULES, CURRENT_USER_ID } from "../../data/mocks";
import { calculateAltitude } from "../../utils/karma";

export default function ProfilScreen() {
  const { profile, signOut } = useAuthContext();

  if (!profile) return null;

  const altitude = calculateAltitude(MOCK_CAPSULES, CURRENT_USER_ID);
  const totalCapsules = MOCK_CAPSULES.filter(
    (c) => c.creditor_id === CURRENT_USER_ID || c.debtor_id === CURRENT_USER_ID
  ).length;

  async function handleSignOut() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signOut();
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-space-deep">
      <SpaceBackground width={390} height={844} />

      <ScrollView
        contentContainerClassName="px-4 pt-8 pb-8 z-10"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-8">
          <View className="w-24 h-24 rounded-full items-center justify-center border-2 border-neon-cyan overflow-hidden bg-space-surface mb-4">
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
          <Text className="text-white/40 text-sm mt-1">{profile.id.slice(0, 8)}...</Text>
        </View>

        <View className="flex-row gap-3 mb-8">
          <View className="flex-1 bg-space-surface border border-space-border rounded-2xl p-4 items-center">
            <Text
              className={`text-3xl font-bold ${
                altitude > 0 ? "text-neon-green" : "text-neon-cyan"
              }`}
            >
              {altitude}
            </Text>
            <Text className="text-white/50 text-xs mt-1">Altitude</Text>
          </View>
          <View className="flex-1 bg-space-surface border border-space-border rounded-2xl p-4 items-center">
            <Text className="text-neon-green text-3xl font-bold">
              {totalCapsules}
            </Text>
            <Text className="text-white/50 text-xs mt-1">Capsules totales</Text>
          </View>
        </View>

        <View className="bg-space-surface border border-space-border rounded-2xl p-4 mb-4">
          <Text className="text-white/40 text-xs font-bold tracking-widest uppercase mb-3">
            Paramètres
          </Text>

          <View className="flex-row items-center justify-between py-3 border-b border-space-border">
            <Text className="text-white/70 text-sm">Pseudo</Text>
            <Text className="text-white text-sm font-semibold">{profile.pseudo}</Text>
          </View>

          <View className="flex-row items-center justify-between py-3 border-b border-space-border">
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
          className="bg-neon-red/20 border border-neon-red rounded-2xl py-4 items-center"
        >
          <Text className="text-neon-red text-sm font-bold">
            Déconnexion
          </Text>
        </Pressable>

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
