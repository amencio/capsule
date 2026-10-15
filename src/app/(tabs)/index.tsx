import { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SpaceBackground } from "../../components/SpaceBackground";
import { CapsuleLogo } from "../../components/CapsuleLogo";
import { ProfileSwitcher } from "../../components/ProfileSwitcher";
import { UserStatusCard } from "../../components/UserStatusCard";
import { TrajectoryMap } from "../../components/TrajectoryMap";
import { TableauBord } from "../../components/TableauBord";
import { DemanderModal } from "../../components/DemanderModal";
import { AllumageModal } from "../../components/AllumageModal";
import { RavitaillementModal } from "../../components/RavitaillementModal";
import { LaunchAlertModal } from "../../components/LaunchAlertModal";
import { RavitaillementAlertModal } from "../../components/RavitaillementAlertModal";
import { useCapsuleStore } from "../../context/CapsuleProvider";
import { useModalQueue } from "../../context/ModalQueueContext";

export default function CockpitScreen() {
  const {
    currentUserId,
    setCurrentUserId,
    pendingActionId,
    handleAccept,
    handleRefuse,
    handleRequestLaunch,
    handleAuthorizeLaunch,
    handleForceLaunch,
    handleLaunch,
    handleExpiryCheck,
    handleLaunchTimeoutCheck,
    receivedFuelRequests,
    myFuelCapsules,
    incomingLaunchRequests,
    profilesMap,
    friends,
    markers,
    altitude,
    tankLevel,
    rank,
    getCreditorTankLevel,
    pendingRequestsCount,
  } = useCapsuleStore();

  const { currentItem, enqueue, dismiss, isDismissed, clearDismissed } = useModalQueue();

  const [demanderVisible, setDemanderVisible] = useState(false);
  const [allumageVisible, setAllumageVisible] = useState(false);
  const [ravitaillementVisible, setRavitaillementVisible] = useState(false);

  useEffect(() => {
    handleExpiryCheck();
    handleLaunchTimeoutCheck();
  }, [handleExpiryCheck, handleLaunchTimeoutCheck]);

  useEffect(() => {
    incomingLaunchRequests.forEach((c) => {
      clearDismissed(c.id);
      enqueue({ id: c.id, type: "launch" });
    });
  }, [incomingLaunchRequests, enqueue, clearDismissed]);

  useEffect(() => {
    receivedFuelRequests.forEach((c) => {
      if (!isDismissed(c.id)) {
        enqueue({ id: c.id, type: "ravitaillement" });
      }
    });
  }, [receivedFuelRequests, enqueue, isDismissed]);

  useEffect(() => {
    const pendingIds = new Set(receivedFuelRequests.map((c) => c.id));
    const launchIds = new Set(incomingLaunchRequests.map((c) => c.id));
    [...incomingLaunchRequests, ...receivedFuelRequests].forEach((c) => {
      if (!pendingIds.has(c.id) && !launchIds.has(c.id)) {
        clearDismissed(c.id);
      }
    });
  }, [receivedFuelRequests, incomingLaunchRequests, clearDismissed]);

  const currentUser = friends.find((f) => f.id === currentUserId);

  return (
    <SafeAreaView edges={["top"]} className="flex-1">
      <SpaceBackground />

      <View className="w-full flex-row items-center justify-between px-4 pt-2 pb-2 z-10">
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

      <View className="flex-1 flex-col px-4 z-10 gap-3 pt-2">
        {currentUser && (
          <UserStatusCard
            user={currentUser}
            altitude={altitude}
            tankLevel={tankLevel}
            rank={rank}
          />
        )}

        <TrajectoryMap currentUserId={currentUserId} markers={markers} />
      </View>

      <TableauBord
        onPressDemander={() => setDemanderVisible(true)}
        onPressAllumage={() => setAllumageVisible(true)}
        onPressRavitaillement={() => setRavitaillementVisible(true)}
        pendingRequestsCount={pendingRequestsCount}
        allumageDisabled={myFuelCapsules.length === 0}
      />

      <DemanderModal
        visible={demanderVisible}
        onClose={() => setDemanderVisible(false)}
        onLaunch={handleLaunch}
        friends={friends}
        currentUserId={currentUserId}
        getCreditorTankLevel={getCreditorTankLevel}
        profilesMap={profilesMap}
      />

      <AllumageModal
        visible={allumageVisible}
        onClose={() => setAllumageVisible(false)}
        myFuelCapsules={myFuelCapsules}
        profilesMap={profilesMap}
        pendingActionId={pendingActionId}
        onRequestLaunch={handleRequestLaunch}
        onForceLaunch={handleForceLaunch}
      />

      <RavitaillementModal
        visible={ravitaillementVisible}
        onClose={() => setRavitaillementVisible(false)}
        receivedFuelRequests={receivedFuelRequests}
        currentUserId={currentUserId}
        profilesMap={profilesMap}
        pendingActionId={pendingActionId}
        onAccept={handleAccept}
        onRefuse={handleRefuse}
        getCreditorTankLevel={getCreditorTankLevel}
      />

      {currentItem?.type === "launch" && (
        <LaunchAlertModal
          visible
          incomingLaunchRequests={incomingLaunchRequests}
          profilesMap={profilesMap}
          pendingActionId={pendingActionId}
          onAuthorize={handleAuthorizeLaunch}
          onDismiss={() => dismiss(currentItem.id)}
        />
      )}

      {currentItem?.type === "ravitaillement" && (
        <RavitaillementAlertModal
          visible
          capsule={receivedFuelRequests.find((c) => c.id === currentItem.id) ?? null}
          profilesMap={profilesMap}
          pendingActionId={pendingActionId}
          onAccept={handleAccept}
          onRefuse={handleRefuse}
          onDismiss={() => dismiss(currentItem.id)}
          getCreditorTankLevel={getCreditorTankLevel}
        />
      )}
    </SafeAreaView>
  );
}
