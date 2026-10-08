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
        <View className="bg-[#f8f9fa] border-t-2 border-black rounded-t-3xl px-5 pt-3 pb-8">
          <View className="w-12 h-1 bg-black/20 rounded-full self-center mb-4" />

          <Text className="text-black text-lg font-bold mb-4">
            🚀 Demander du carburant
          </Text>

          <Text className="text-black/50 text-xs font-bold tracking-wide uppercase mb-2">
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
                    className={`px-4 py-2 rounded-full border-2 border-black ${
                      selectedId === friend.id
                        ? "bg-[#f97316]"
                        : "bg-white"
                    }`}
                  >
                    <Text
                      className={`text-sm font-bold ${
                        selectedId === friend.id ? "text-white" : "text-black"
                      }`}
                    >
                      {friend.pseudo}
                    </Text>
                  </Pressable>
                ))}
            </View>
          </ScrollView>

          <Text className="text-black/50 text-xs font-bold tracking-wide uppercase mb-2">
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
                  className={`px-3 py-1.5 rounded-lg border-2 border-black ${
                    drinkType === drink && !customDrink
                      ? "bg-[#4ade80]"
                      : "bg-white"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      drinkType === drink && !customDrink ? "text-black" : "text-black/60"
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
            placeholderTextColor="rgba(0,0,0,0.25)"
            className="bg-white border-2 border-black rounded-xl px-4 py-2.5 text-black text-sm mb-4"
          />

          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-black/50 text-xs font-bold tracking-wide uppercase">
              Quantité
            </Text>
            <View className="flex-row items-center gap-4">
              <Pressable
                onPress={() => setAmount(Math.max(1, amount - 1))}
                className="w-8 h-8 rounded-full bg-white border-2 border-black items-center justify-center"
              >
                <Text className="text-black text-lg font-bold">−</Text>
              </Pressable>
              <Text className="text-black text-lg font-bold w-6 text-center">
                {amount}
              </Text>
              <Pressable
                onPress={() => setAmount(amount + 1)}
                className="w-8 h-8 rounded-full bg-white border-2 border-black items-center justify-center"
              >
                <Text className="text-black text-lg font-bold">+</Text>
              </Pressable>
            </View>
          </View>

          <Text className="text-black/50 text-xs font-bold tracking-wide uppercase mb-2">
            Motif
          </Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Ex: Pari Ligue 1 !"
            placeholderTextColor="rgba(0,0,0,0.25)"
            className="bg-white border-2 border-black rounded-xl px-4 py-3 text-black text-sm mb-4"
            multiline
            numberOfLines={2}
          />

          <View className="flex-row gap-3">
            <Pressable
              onPress={onClose}
              className="flex-1 bg-white border-2 border-black rounded-xl py-3 items-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5"
            >
              <Text className="text-black/60 text-sm font-bold">Annuler</Text>
            </Pressable>
            <Pressable
              onPress={handleLaunch}
              disabled={!canLaunch}
              className={`flex-[2] rounded-xl py-3 items-center border-2 border-black ${
                canLaunch
                  ? "bg-[#f97316] shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
                  : "bg-[#f97316]/20"
              }`}
            >
              <Text
                className={`text-sm font-bold tracking-wide ${
                  canLaunch ? "text-white" : "text-white/50"
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
