import { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SpaceBackground } from "../../components/SpaceBackground";
import { CapsuleLogo } from "../../components/CapsuleLogo";
import { ProfileSwitcher } from "../../components/ProfileSwitcher";
import { Radar } from "../../components/Radar";
import { CapsuleShip } from "../../components/CapsuleShip";
import { TableauBord } from "../../components/TableauBord";
import { DemanderModal } from "../../components/DemanderModal";
import { AllumageModal } from "../../components/AllumageModal";
import { RavitaillementModal } from "../../components/RavitaillementModal";
import { LaunchAlertModal } from "../../components/LaunchAlertModal";
import { useCapsuleStore } from "../../context/CapsuleProvider";

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

  const [demanderVisible, setDemanderVisible] = useState(false);
  const [allumageVisible, setAllumageVisible] = useState(false);
  const [ravitaillementVisible, setRavitaillementVisible] = useState(false);
  const [launchAlertVisible, setLaunchAlertVisible] = useState(false);

  useEffect(() => {
    handleExpiryCheck();
    handleLaunchTimeoutCheck();
  }, [handleExpiryCheck, handleLaunchTimeoutCheck]);

  useEffect(() => {
    if (incomingLaunchRequests.length > 0 && !launchAlertVisible && !allumageVisible && !ravitaillementVisible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLaunchAlertVisible(true);
    }
  }, [incomingLaunchRequests.length, launchAlertVisible, allumageVisible, ravitaillementVisible]);

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

      <View className="flex-1 flex-row px-2 z-10">
        <View className="w-1/3 items-center justify-start pt-2">
          <Radar currentUserId={currentUserId} markers={markers} />
        </View>

        <View className="w-2/3 items-center justify-center">
          {currentUser && (
            <CapsuleShip
              user={currentUser}
              altitude={altitude}
              tankLevel={tankLevel}
              rank={rank}
            />
          )}
        </View>
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

      <LaunchAlertModal
        visible={launchAlertVisible}
        incomingLaunchRequests={incomingLaunchRequests}
        profilesMap={profilesMap}
        pendingActionId={pendingActionId}
        onAuthorize={handleAuthorizeLaunch}
        onDismiss={() => setLaunchAlertVisible(false)}
      />
    </SafeAreaView>
  );
}
