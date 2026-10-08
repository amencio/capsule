import { Tabs } from "expo-router";
import { Orbit, Beer, Rocket } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../constants/theme";
import { useAuthContext } from "../../context/AuthProvider";
import { useTicketsRealtime } from "../../hooks/useTickets";
import { useProfilesRealtime } from "../../hooks/useProfiles";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuthContext();
  const userId = profile?.id;

  useTicketsRealtime(userId);
  useProfilesRealtime(userId);

  return (
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
          fontSize: 11,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Orbite",
          tabBarIcon: ({ color, size }) => (
            <Orbit color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="frigo"
        options={{
          title: "Frigo",
          tabBarIcon: ({ color, size }) => (
            <Beer color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="lancer"
        options={{
          title: "Lancer",
          tabBarIcon: ({ color, size }) => (
            <Rocket color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
