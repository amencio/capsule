import { useState, useCallback } from "react";
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
import {
  MOCK_USERS,
  MOCK_CAPSULES,
  MOCK_PROFILES_MAP,
  CURRENT_USER_ID,
} from "../../data/mocks";
import { calculateAltitudeForAll } from "../../utils/karma";
import type { Capsule, UserProfile } from "../../types";

export default function DashboardScreen() {
  const [currentUserId, setCurrentUserId] = useState(CURRENT_USER_ID);
  const [capsules, setCapsules] = useState<Capsule[]>(MOCK_CAPSULES);
  const [launchVisible, setLaunchVisible] = useState(false);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const allAltitudes = calculateAltitudeForAll(
    capsules,
    MOCK_USERS.map((u) => u.id)
  );

  const markers = MOCK_USERS.map((user) => ({
    user,
    altitude: allAltitudes[user.id] ?? 0,
  }));

  const pendingLaunchDebtorCapsules = capsules.filter(
    (c) => c.status === "pending_launch" && c.debtor_id === currentUserId
  );
  const pendingCapsules = capsules.filter(
    (c) => c.status === "pending" && c.debtor_id === currentUserId
  );
  const activeAndWaitingCapsules = capsules.filter(
    (c) =>
      (c.status === "active" &&
        (c.creditor_id === currentUserId || c.debtor_id === currentUserId)) ||
      (c.status === "pending_launch" && c.creditor_id === currentUserId)
  );

  const handleAccept = useCallback((id: string) => {
    setPendingActionId(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCapsules((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "active" } : c))
    );
    setPendingActionId(null);
  }, []);

  const handleRefuse = useCallback((id: string) => {
    setPendingActionId(id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setCapsules((prev) => prev.filter((c) => c.id !== id));
    setPendingActionId(null);
  }, []);

  const handleDecapsuler = useCallback((id: string) => {
    setPendingActionId(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCapsules((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: "pending_launch" } : c
      )
    );
    setPendingActionId(null);
  }, []);

  const handleAuthorize = useCallback((id: string) => {
    setPendingActionId(id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCapsules((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: "resolved", resolved_at: new Date().toISOString() }
          : c
      )
    );
    setPendingActionId(null);
  }, []);

  const handleLaunch = useCallback(
    (data: Omit<Capsule, "id" | "status" | "created_at" | "resolved_at">) => {
      const newCapsule: Capsule = {
        ...data,
        id: `c${Date.now()}`,
        status: "pending",
        created_at: new Date().toISOString(),
        resolved_at: null,
      };
      setCapsules((prev) => [newCapsule, ...prev]);
    },
    []
  );

  const friends = MOCK_USERS;
  const profilesMap: Record<string, UserProfile> = MOCK_PROFILES_MAP;

  const hasCapsules =
    pendingLaunchDebtorCapsules.length > 0 ||
    pendingCapsules.length > 0 ||
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
          users={MOCK_USERS}
          currentUserId={currentUserId}
          onSelect={setCurrentUserId}
        />
      </View>

      <View className="px-4 mb-2 z-10">
        <PendingAlertBanner count={pendingCapsules.length} />
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
              LANCER UNE{"\n"}CAPSULE ! 🚀
            </Text>
          </Pressable>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            <Text className="text-white/60 text-xs font-bold tracking-widest uppercase mb-2">
              Mes Capsules
            </Text>

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

            {pendingCapsules.map((capsule) => (
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
                  Lance-en une pour commencer 🚀
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
