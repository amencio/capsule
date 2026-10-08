import { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { SpaceBackground } from "../../components/SpaceBackground";
import { CapsuleLogo } from "../../components/CapsuleLogo";
import { GravJauge } from "../../components/GravJauge";
import { CapsuleCard } from "../../components/CapsuleCard";
import { PendingAlertBanner } from "../../components/PendingAlertBanner";
import { ProfileSwitcher } from "../../components/ProfileSwitcher";
import { LaunchModal } from "../../components/LaunchModal";
import { useCapsuleStore } from "../../context/CapsuleProvider";

export default function DashboardScreen() {
  const {
    currentUserId,
    setCurrentUserId,
    pendingActionId,
    handleAccept,
    handleRefuse,
    handleDecapsuler,
    handleAuthorize,
    handleLaunch,
    pendingLaunchDebtorCapsules,
    pendingReceivedCapsules,
    pendingSentCapsules,
    activeAndWaitingCapsules,
    profilesMap,
    friends,
    markers,
  } = useCapsuleStore();

  const [launchVisible, setLaunchVisible] = useState(false);

  const hasCapsules =
    pendingLaunchDebtorCapsules.length > 0 ||
    pendingReceivedCapsules.length > 0 ||
    pendingSentCapsules.length > 0 ||
    activeAndWaitingCapsules.length > 0;

  return (
    <SafeAreaView edges={["top"]} className="flex-1">
      <SpaceBackground />

      <View className="flex-row items-center justify-between px-4 pt-2 pb-3 z-10">
        <View className="flex-row items-center gap-2">
          <CapsuleLogo size={26} />
          <Text className="text-white text-base font-bold tracking-widest">
            CAPSULE
          </Text>
        </View>
        <ProfileSwitcher
          users={friends}
          currentUserId={currentUserId}
          onSelect={setCurrentUserId}
        />
      </View>

      <View className="px-4 mb-2 z-10">
        <PendingAlertBanner count={pendingReceivedCapsules.length} />
      </View>

      <View className="flex-1 flex-row px-4 z-10">
        <View className="w-[35%] items-center justify-start pt-4">
          <GravJauge currentUserId={currentUserId} markers={markers} />
        </View>

        <View className="flex-1 pl-2">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              setLaunchVisible(true);
            }}
            className="bg-[#f97316] text-white font-black border-2 border-black rounded-2xl px-4 py-4 mb-4 shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
          >
            <Text className="text-white font-black text-sm uppercase text-center tracking-wide">
              DEMANDER DU{"\n"}CARBURANT 🚀
            </Text>
          </Pressable>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {pendingLaunchDebtorCapsules.length > 0 && (
              <Text className="text-[#f97316] text-xs font-bold tracking-widest uppercase mb-2">
                🚨 Autorisations requises
              </Text>
            )}

            {pendingLaunchDebtorCapsules.map((capsule) => (
              <CapsuleCard
                key={capsule.id}
                capsule={capsule}
                currentUserId={currentUserId}
                profiles={profilesMap}
                onAuthorize={handleAuthorize}
                isPending={pendingActionId === capsule.id}
              />
            ))}

            {pendingReceivedCapsules.length > 0 && (
              <Text className="text-white/60 text-xs font-bold tracking-widest uppercase mb-2 mt-2">
                Demandes reçues
              </Text>
            )}

            {pendingReceivedCapsules.map((capsule) => (
              <CapsuleCard
                key={capsule.id}
                capsule={capsule}
                currentUserId={currentUserId}
                profiles={profilesMap}
                onAccept={handleAccept}
                onRefuse={handleRefuse}
                isPending={pendingActionId === capsule.id}
              />
            ))}

            {pendingSentCapsules.length > 0 && (
              <Text className="text-white/60 text-xs font-bold tracking-widest uppercase mb-2 mt-2">
                Demandes envoyées
              </Text>
            )}

            {pendingSentCapsules.map((capsule) => (
              <CapsuleCard
                key={capsule.id}
                capsule={capsule}
                currentUserId={currentUserId}
                profiles={profilesMap}
                isPending={pendingActionId === capsule.id}
              />
            ))}

            {activeAndWaitingCapsules.length > 0 && (
              <Text className="text-white/60 text-xs font-bold tracking-widest uppercase mb-2 mt-2">
                Mes Capsules
              </Text>
            )}

            {activeAndWaitingCapsules.map((capsule) => (
              <CapsuleCard
                key={capsule.id}
                capsule={capsule}
                currentUserId={currentUserId}
                profiles={profilesMap}
                onDecapsuler={handleDecapsuler}
                onAuthorize={handleAuthorize}
                isPending={pendingActionId === capsule.id}
              />
            ))}

            {!hasCapsules && (
              <View className="rounded-2xl p-6 items-center mt-2 border-2 border-dashed border-white/20">
                <Text className="text-white/30 text-sm">
                  Aucune capsule en orbite
                </Text>
                <Text className="text-white/20 text-xs mt-1">
                  Demande du carburant pour commencer 🚀
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      <LaunchModal
        visible={launchVisible}
        onClose={() => setLaunchVisible(false)}
        onLaunch={handleLaunch}
        friends={friends}
        currentUserId={currentUserId}
      />
    </SafeAreaView>
  );
}
