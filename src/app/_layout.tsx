import "../../global.css";
import { Stack, Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, ActivityIndicator } from "react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { AuthProvider, useAuthContext } from "../context/AuthProvider";
import { HoustonToastProvider } from "../context/HoustonToastContext";
import { ErrorBoundary } from "../components/ErrorBoundary";
import * as NavigationBar from "expo-navigation-bar";

NavigationBar.setStyle("dark");

function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-space-deep">
      <ActivityIndicator size="large" color="#00FF66" />
    </View>
  );
}

function AppContent() {
  const { session, loading } = useAuthContext();

  if (loading) return <LoadingScreen />;

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
        </Stack>
        {!session && <Redirect href="/login" />}
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HoustonToastProvider>
          <AppContent />
        </HoustonToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
