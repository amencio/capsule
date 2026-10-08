import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useAuthContext } from "../context/AuthProvider";
import { useHoustonToast } from "../context/HoustonToastContext";

export default function LoginScreen() {
  const { signIn, signUp, session } = useAuthContext();
  const { showHoustonToast } = useHoustonToast();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email || !password || (mode === "register" && !pseudo)) {
      showHoustonToast("Houston, on a un problème !", "Remplis tous les champs requis.", "warning");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
        showHoustonToast("Connexion réussie !", "Mise en orbite immédiate...", "success");
        router.replace("/(tabs)");
      } else {
        await signUp(email, password, pseudo);
        showHoustonToast("Capsule enregistrée !", "Vérifie ton email pour activer ton compte.", "info");
        if (session) {
          router.replace("/(tabs)");
        } else {
          setMode("login");
          setEmail("");
          setPassword("");
          setPseudo("");
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      showHoustonToast("Houston, échec d'authentification", msg, "danger");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-space-deep"
    >
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-neon-green text-4xl font-bold mb-2">
          CAPSULE
        </Text>
        <Text className="text-white/40 text-sm mb-10">
          Suivi de dettes sociales 🚀
        </Text>

        {mode === "register" && (
          <TextInput
            value={pseudo}
            onChangeText={setPseudo}
            placeholder="Pseudo"
            placeholderTextColor="#666"
            className="w-full bg-space-surface border border-space-border rounded-xl px-4 py-3.5 text-white mb-3"
          />
        )}

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#666"
          keyboardType="email-address"
          autoCapitalize="none"
          className="w-full bg-space-surface border border-space-border rounded-xl px-4 py-3.5 text-white mb-3"
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Mot de passe"
          placeholderTextColor="#666"
          secureTextEntry
          className="w-full bg-space-surface border border-space-border rounded-xl px-4 py-3.5 text-white mb-6"
        />

        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          className="w-full bg-neon-green rounded-xl py-4 items-center"
        >
          <Text className="text-space-deep text-base font-bold">
            {loading
              ? "..."
              : mode === "login"
              ? "🚀 Entrer en orbite"
              : "🛰️ Lancer ma capsule"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setMode(mode === "login" ? "register" : "login")}
          className="mt-4"
        >
          <Text className="text-neon-green/70 text-sm">
            {mode === "login"
              ? "Pas de compte ? Inscris-toi"
              : "Déjà un compte ? Connecte-toi"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
