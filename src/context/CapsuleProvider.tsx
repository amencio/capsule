import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  MOCK_USERS,
  MOCK_CAPSULES,
  MOCK_PROFILES_MAP,
  CURRENT_USER_ID,
} from "../data/mocks";
import { calculateAltitude, calculateAltitudeForAll, calculateKarma } from "../utils/karma";
import { getRank, type OrbitalRank } from "../utils/ranks";
import { isExpired, isLaunchTimedOut, computeExpiresAt } from "../utils/capsule";
import { TANK_MAX_CAPACITY } from "../constants/game";
import { useHoustonToast } from "./HoustonToastContext";
import type { Capsule, UserProfile } from "../types";

const STORAGE_KEY = "capsule_mock_state";

interface CapsuleStoreValue {
  currentUserId: string;
  setCurrentUserId: (id: string) => void;
  capsules: Capsule[];
  profilesMap: Record<string, UserProfile>;
  friends: UserProfile[];
  pendingActionId: string | null;
  handleAccept: (id: string) => void;
  handleRefuse: (id: string) => void;
  handleRequestLaunch: (id: string) => void;
  handleAuthorizeLaunch: (id: string) => void;
  handleForceLaunch: (id: string) => void;
  handleLaunch: (data: Omit<Capsule, "id" | "status" | "created_at" | "resolved_at" | "expires_at" | "launch_requested_at" | "resolution" | "amount">) => void;
  handleExpiryCheck: () => void;
  handleLaunchTimeoutCheck: () => void;
  receivedFuelRequests: Capsule[];
  myFuelCapsules: Capsule[];
  incomingLaunchRequests: Capsule[];
  sentFuelRequests: Capsule[];
  allUserCapsules: Capsule[];
  allFriendsCapsules: Capsule[];
  altitude: number;
  tankLevel: number;
  carburantEnCombustion: number;
  karma: number;
  rank: OrbitalRank;
  markers: { user: UserProfile; altitude: number }[];
  getCreditorTankLevel: (userId: string) => number;
  pendingRequestsCount: number;
}

const CapsuleStoreContext = createContext<CapsuleStoreValue | null>(null);

export function CapsuleProvider({ children }: { children: React.ReactNode }) {
  const { showHoustonToast } = useHoustonToast();
  const [currentUserId, setCurrentUserId] = useState(CURRENT_USER_ID);
  const [capsules, setCapsules] = useState<Capsule[]>(MOCK_CAPSULES);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const capsulesRef = useRef(capsules);

  useEffect(() => {
    capsulesRef.current = capsules;
  }, [capsules]);

  const persistRef = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Capsule[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCapsules(parsed);
            capsulesRef.current = parsed;
          }
        } catch {
          // ignore corrupted state
        }
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!persistRef.current) {
      persistRef.current = true;
      return;
    }
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(capsules)).catch(() => {});
  }, [capsules, hydrated]);

  const updateCapsules = useCallback((next: Capsule[]) => {
    capsulesRef.current = next;
    setCapsules(next);
  }, []);

  const handleAccept = useCallback((id: string) => {
    setPendingActionId(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = capsulesRef.current.map((c) =>
      c.id === id ? { ...c, status: "active" as const } : c
    );
    updateCapsules(next);
    setPendingActionId(null);
  }, [updateCapsules]);

  const handleRefuse = useCallback((id: string) => {
    setPendingActionId(id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const capsule = capsulesRef.current.find((c) => c.id === id);
    if (capsule) {
      const debtor = MOCK_PROFILES_MAP[capsule.debtor_id];
      showHoustonToast(
        "🚫 Refus envoyé",
        `${debtor?.pseudo ?? "L'ami"} a refusé de te ravitailler (${capsule.drink_type}).`,
        "danger"
      );
    }
    const next = capsulesRef.current.map((c) =>
      c.id === id ? { ...c, status: "rejected" as const } : c
    );
    updateCapsules(next);
    setPendingActionId(null);
  }, [showHoustonToast, updateCapsules]);

  const handleRequestLaunch = useCallback((id: string) => {
    setPendingActionId(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = capsulesRef.current.map((c) =>
      c.id === id
        ? { ...c, status: "launch_requested" as const, launch_requested_at: new Date().toISOString() }
        : c
    );
    updateCapsules(next);
    setPendingActionId(null);
  }, [updateCapsules]);

  const handleAuthorizeLaunch = useCallback((id: string) => {
    setPendingActionId(id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const next = capsulesRef.current.map((c) =>
      c.id === id
        ? { ...c, status: "resolved" as const, resolved_at: new Date().toISOString(), resolution: "validated" as const }
        : c
    );
    updateCapsules(next);
    setPendingActionId(null);
  }, [updateCapsules]);

  const handleForceLaunch = useCallback((id: string) => {
    setPendingActionId(id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const capsule = capsulesRef.current.find((c) => c.id === id);
    if (capsule) {
      const debtor = MOCK_PROFILES_MAP[capsule.debtor_id];
      showHoustonToast(
        "🔥 Allumage forcé",
        `Carburant consommé sans validation de ${debtor?.pseudo ?? "l'ami"}.`,
        "warning"
      );
    }
    const next = capsulesRef.current.map((c) =>
      c.id === id
        ? { ...c, status: "resolved" as const, resolved_at: new Date().toISOString(), resolution: "forced" as const }
        : c
    );
    updateCapsules(next);
    setPendingActionId(null);
  }, [showHoustonToast, updateCapsules]);

  const handleLaunch = useCallback(
    (data: Omit<Capsule, "id" | "status" | "created_at" | "resolved_at" | "expires_at" | "launch_requested_at" | "resolution" | "amount">) => {
      const newCapsule: Capsule = {
        ...data,
        id: `c${Date.now()}`,
        amount: 1,
        status: "pending",
        created_at: new Date().toISOString(),
        resolved_at: null,
        expires_at: computeExpiresAt(),
        launch_requested_at: null,
        resolution: null,
      };
      updateCapsules([newCapsule, ...capsulesRef.current]);
    },
    [updateCapsules]
  );

  const handleExpiryCheck = useCallback(() => {
    let toasts: { title: string; desc: string }[] = [];
    let changed = false;
    const next = capsulesRef.current.map((c) => {
      if (isExpired(c)) {
        changed = true;
        const debtor = MOCK_PROFILES_MAP[c.debtor_id];
        toasts.push({
          title: "⏳ Demande expirée",
          desc: `Ta demande de carburant à ${debtor?.pseudo ?? "l'ami"} a expiré sans réponse.`,
        });
        return { ...c, status: "expired" as const };
      }
      return c;
    });
    if (changed) {
      toasts.forEach((t) => showHoustonToast(t.title, t.desc, "warning"));
      updateCapsules(next);
    }
  }, [showHoustonToast, updateCapsules]);

  const handleLaunchTimeoutCheck = useCallback(() => {
    let toasts: { title: string; desc: string }[] = [];
    let changed = false;
    const next = capsulesRef.current.map((c) => {
      if (isLaunchTimedOut(c)) {
        changed = true;
        toasts.push({
          title: "🔥 Mise à feu avortée",
          desc: "Ta mise à feu n'a pas abouti : le carburant est retourné dans ton réservoir.",
        });
        return { ...c, status: "active" as const, launch_requested_at: null };
      }
      return c;
    });
    if (changed) {
      toasts.forEach((t) => showHoustonToast(t.title, t.desc, "warning"));
      updateCapsules(next);
    }
  }, [showHoustonToast, updateCapsules]);

  const hasRunChecks = useRef(false);
  useEffect(() => {
    if (!hydrated || hasRunChecks.current) return;
    hasRunChecks.current = true;
    handleExpiryCheck();
    handleLaunchTimeoutCheck();
  }, [hydrated, handleExpiryCheck, handleLaunchTimeoutCheck]);

  const receivedFuelRequests = useMemo(
    () =>
      capsules.filter(
        (c) => c.status === "pending" && c.debtor_id === currentUserId
      ),
    [capsules, currentUserId]
  );

  const myFuelCapsules = useMemo(
    () =>
      capsules.filter(
        (c) =>
          (c.status === "active" || c.status === "launch_requested") &&
          c.creditor_id === currentUserId
      ),
    [capsules, currentUserId]
  );

  const incomingLaunchRequests = useMemo(
    () =>
      capsules.filter(
        (c) => c.status === "launch_requested" && c.debtor_id === currentUserId
      ),
    [capsules, currentUserId]
  );

  const sentFuelRequests = useMemo(
    () =>
      capsules.filter(
        (c) => c.status === "pending" && c.creditor_id === currentUserId
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

  const allFriendsCapsules = useMemo(
    () =>
      capsules
        .slice()
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
    [capsules]
  );

  const altitude = useMemo(
    () => calculateAltitude(capsules, currentUserId),
    [capsules, currentUserId]
  );

  const tankLevel = useMemo(
    () =>
      Math.min(
        TANK_MAX_CAPACITY,
        capsules.filter(
          (c) => c.status === "active" && c.creditor_id === currentUserId
        ).reduce((sum, c) => sum + 1, 0)
      ),
    [capsules, currentUserId]
  );

  const carburantEnCombustion = useMemo(
    () =>
      capsules.filter(
        (c) => c.status === "launch_requested" && c.creditor_id === currentUserId
      ).reduce((sum, c) => sum + 1, 0),
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

  const getCreditorTankLevel = useCallback(
    (userId: string) =>
      Math.min(
        TANK_MAX_CAPACITY,
        capsules.filter(
          (c) => c.status === "active" && c.creditor_id === userId
        ).reduce((sum, c) => sum + 1, 0)
      ),
    [capsules]
  );

  const pendingRequestsCount = receivedFuelRequests.length;

  const value: CapsuleStoreValue = {
    currentUserId,
    setCurrentUserId,
    capsules,
    profilesMap: MOCK_PROFILES_MAP,
    friends: MOCK_USERS,
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
    sentFuelRequests,
    allUserCapsules,
    allFriendsCapsules,
    altitude,
    tankLevel,
    carburantEnCombustion,
    karma,
    rank,
    markers,
    getCreditorTankLevel,
    pendingRequestsCount,
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
