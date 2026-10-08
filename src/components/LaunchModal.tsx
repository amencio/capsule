import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { DRINK_TYPES } from "../constants/theme";
import type { UserProfile, Capsule } from "../types";

interface LaunchModalProps {
  visible: boolean;
  onClose: () => void;
  onLaunch: (capsule: Omit<Capsule, "id" | "status" | "created_at" | "resolved_at">) => void;
  friends: UserProfile[];
  currentUserId: string;
}

export function LaunchModal({
  visible,
  onClose,
  onLaunch,
  friends,
  currentUserId,
}: LaunchModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drinkType, setDrinkType] = useState<string>(DRINK_TYPES[0]);
  const [customDrink, setCustomDrink] = useState("");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState(1);

  const finalDrink = customDrink.trim() || drinkType;
  const canLaunch = selectedId && reason.trim().length > 0;

  function handleLaunch() {
    if (!canLaunch || !selectedId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    onLaunch({
      creditor_id: currentUserId,
      debtor_id: selectedId,
      drink_type: finalDrink,
      amount,
      reason: reason.trim(),
    });

    setSelectedId(null);
    setDrinkType(DRINK_TYPES[0]);
    setCustomDrink("");
    setReason("");
    setAmount(1);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/70" onPress={onClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end"
      >
        <View className="bg-space-surface border-t border-space-border rounded-t-3xl px-5 pt-3 pb-8">
          <View className="w-12 h-1 bg-space-border rounded-full self-center mb-4" />

          <Text className="text-white text-lg font-bold mb-4">
            🚀 Demander du carburant
          </Text>

          <Text className="text-white/50 text-xs font-bold tracking-wide uppercase mb-2">
            Cible
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <View className="flex-row gap-2">
              {friends
                .filter((f) => f.id !== currentUserId)
                .map((friend) => (
                  <Pressable
                    key={friend.id}
                    onPress={() => {
                      setSelectedId(friend.id);
                      Haptics.selectionAsync();
                    }}
                    className={`px-4 py-2 rounded-full border ${
                      selectedId === friend.id
                        ? "bg-neon-orange/20 border-neon-orange"
                        : "bg-space-card border-space-border"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        selectedId === friend.id ? "text-neon-orange" : "text-white/70"
                      }`}
                    >
                      {friend.pseudo}
                    </Text>
                  </Pressable>
                ))}
            </View>
          </ScrollView>

          <Text className="text-white/50 text-xs font-bold tracking-wide uppercase mb-2">
            Boisson
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            <View className="flex-row gap-2">
              {DRINK_TYPES.map((drink) => (
                <Pressable
                  key={drink}
                  onPress={() => {
                    setDrinkType(drink);
                    setCustomDrink("");
                  }}
                  className={`px-3 py-1.5 rounded-lg border ${
                    drinkType === drink && !customDrink
                      ? "bg-neon-green/15 border-neon-green/50"
                      : "bg-space-card border-space-border"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      drinkType === drink && !customDrink ? "text-neon-green" : "text-white/60"
                    }`}
                  >
                    {drink}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <TextInput
            value={customDrink}
            onChangeText={setCustomDrink}
            placeholder="Ou boisson personnalisée..."
            placeholderTextColor="rgba(255,255,255,0.25)"
            className="bg-space-card border border-space-border rounded-xl px-4 py-2.5 text-white text-sm mb-4"
          />

          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white/50 text-xs font-bold tracking-wide uppercase">
              Quantité
            </Text>
            <View className="flex-row items-center gap-4">
              <Pressable
                onPress={() => setAmount(Math.max(1, amount - 1))}
                className="w-8 h-8 rounded-full bg-space-card border border-space-border items-center justify-center"
              >
                <Text className="text-white text-lg font-bold">−</Text>
              </Pressable>
              <Text className="text-white text-lg font-bold w-6 text-center">
                {amount}
              </Text>
              <Pressable
                onPress={() => setAmount(amount + 1)}
                className="w-8 h-8 rounded-full bg-space-card border border-space-border items-center justify-center"
              >
                <Text className="text-white text-lg font-bold">+</Text>
              </Pressable>
            </View>
          </View>

          <Text className="text-white/50 text-xs font-bold tracking-wide uppercase mb-2">
            Motif
          </Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Ex: Pari Ligue 1 !"
            placeholderTextColor="rgba(255,255,255,0.25)"
            className="bg-space-card border border-space-border rounded-xl px-4 py-3 text-white text-sm mb-4"
            multiline
            numberOfLines={2}
          />

          <View className="flex-row gap-3">
            <Pressable
              onPress={onClose}
              className="flex-1 bg-space-card border border-space-border rounded-xl py-3 items-center"
            >
              <Text className="text-white/60 text-sm font-bold">Annuler</Text>
            </Pressable>
            <Pressable
              onPress={handleLaunch}
              disabled={!canLaunch}
              className={`flex-[2] rounded-xl py-3 items-center ${
                canLaunch ? "bg-neon-orange" : "bg-neon-orange/20"
              }`}
            >
              <Text
                className={`text-sm font-bold tracking-wide ${
                  canLaunch ? "text-white" : "text-white/30"
                }`}
              >
                🚀 DEMANDER !
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
