import { Tabs } from "expo-router";
import { LayoutDashboard, Activity, Users, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../constants/theme";
import { useAuthContext } from "../../context/AuthProvider";
import { useCapsulesRealtime } from "../../hooks/useCapsules";
import { useProfilesRealtime } from "../../hooks/useProfiles";
import { CapsuleProvider } from "../../context/CapsuleProvider";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuthContext();
  const userId = profile?.id;

  useCapsulesRealtime(userId);
  useProfilesRealtime(userId);

  return (
    <CapsuleProvider>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.space.surface,
          borderTopColor: COLORS.space.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 8,
        },
        tabBarActiveTintColor: COLORS.neon.green,
        tabBarInactiveTintColor: "#666",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="activite"
        options={{
          title: "Activité",
          tabBarIcon: ({ color, size }) => (
            <Activity color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="amis"
        options={{
          title: "Amis",
          tabBarIcon: ({ color, size }) => (
            <Users color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size} />
          ),
        }}
      />
    </Tabs>
    </CapsuleProvider>
  );
}
