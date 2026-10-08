import { createContext, useContext, useState, useCallback, useMemo } from "react";
import * as Haptics from "expo-haptics";
import {
  MOCK_USERS,
  MOCK_CAPSULES,
  MOCK_PROFILES_MAP,
  CURRENT_USER_ID,
} from "../data/mocks";
import { calculateAltitude, calculateAltitudeForAll, calculateKarma } from "../utils/karma";
import { getRank, type OrbitalRank } from "../utils/ranks";
import type { Capsule, UserProfile } from "../types";

interface CapsuleStoreValue {
  currentUserId: string;
  setCurrentUserId: (id: string) => void;
  capsules: Capsule[];
  profilesMap: Record<string, UserProfile>;
  friends: UserProfile[];
  pendingActionId: string | null;
  handleAccept: (id: string) => void;
  handleRefuse: (id: string) => void;
  handleDecapsuler: (id: string) => void;
  handleAuthorize: (id: string) => void;
  handleLaunch: (data: Omit<Capsule, "id" | "status" | "created_at" | "resolved_at">) => void;
  pendingLaunchDebtorCapsules: Capsule[];
  pendingReceivedCapsules: Capsule[];
  pendingSentCapsules: Capsule[];
  activeAndWaitingCapsules: Capsule[];
  allUserCapsules: Capsule[];
  altitude: number;
  carburantDisponible: number;
  carburantEnCombustion: number;
  karma: number;
  rank: OrbitalRank;
  markers: { user: UserProfile; altitude: number }[];
}

const CapsuleStoreContext = createContext<CapsuleStoreValue | null>(null);

export function CapsuleProvider({ children }: { children: React.ReactNode }) {
  const [currentUserId, setCurrentUserId] = useState(CURRENT_USER_ID);
  const [capsules, setCapsules] = useState<Capsule[]>(MOCK_CAPSULES);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

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

  const pendingLaunchDebtorCapsules = useMemo(
    () =>
      capsules.filter(
        (c) => c.status === "pending_launch" && c.debtor_id === currentUserId
      ),
    [capsules, currentUserId]
  );

  const pendingReceivedCapsules = useMemo(
    () =>
      capsules.filter(
        (c) => c.status === "pending" && c.debtor_id === currentUserId
      ),
    [capsules, currentUserId]
  );

  const pendingSentCapsules = useMemo(
    () =>
      capsules.filter(
        (c) => c.status === "pending" && c.creditor_id === currentUserId
      ),
    [capsules, currentUserId]
  );

  const activeAndWaitingCapsules = useMemo(
    () =>
      capsules.filter(
        (c) =>
          (c.status === "active" &&
            (c.creditor_id === currentUserId || c.debtor_id === currentUserId)) ||
          (c.status === "pending_launch" && c.creditor_id === currentUserId)
      ),
    [capsules, currentUserId]
  );

  const allUserCapsules = useMemo(
    () =>
      capsules
        .filter(
          (c) =>
            c.creditor_id === currentUserId || c.debtor_id === currentUserId
        )
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
    [capsules, currentUserId]
  );

  const altitude = useMemo(
    () => calculateAltitude(capsules, currentUserId),
    [capsules, currentUserId]
  );

  const carburantDisponible = useMemo(
    () =>
      capsules.filter(
        (c) => c.status === "active" && c.creditor_id === currentUserId
      ).reduce((sum, c) => sum + c.amount, 0),
    [capsules, currentUserId]
  );

  const carburantEnCombustion = useMemo(
    () =>
      capsules.filter(
        (c) => c.status === "pending_launch" && c.creditor_id === currentUserId
      ).reduce((sum, c) => sum + c.amount, 0),
    [capsules, currentUserId]
  );

  const karma = useMemo(
    () => calculateKarma(capsules, currentUserId),
    [capsules, currentUserId]
  );

  const rank = useMemo(
    () => getRank(altitude),
    [altitude]
  );

  const allAltitudes = useMemo(
    () => calculateAltitudeForAll(capsules, MOCK_USERS.map((u) => u.id)),
    [capsules]
  );

  const markers = useMemo(
    () =>
      MOCK_USERS.map((user) => ({
        user,
        altitude: allAltitudes[user.id] ?? 0,
      })),
    [allAltitudes]
  );

  const value: CapsuleStoreValue = {
    currentUserId,
    setCurrentUserId,
    capsules,
    profilesMap: MOCK_PROFILES_MAP,
    friends: MOCK_USERS,
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
    allUserCapsules,
    altitude,
    carburantDisponible,
    carburantEnCombustion,
    karma,
    rank,
    markers,
  };

  return (
    <CapsuleStoreContext.Provider value={value}>
      {children}
    </CapsuleStoreContext.Provider>
  );
}

export function useCapsuleStore() {
  const context = useContext(CapsuleStoreContext);
  if (!context) {
    throw new Error("useCapsuleStore must be used within CapsuleProvider");
  }
  return context;
}
