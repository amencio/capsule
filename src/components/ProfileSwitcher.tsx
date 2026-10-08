import { useState } from "react";
import { View, Text, Pressable, Modal, FlatList } from "react-native";
import type { UserProfile } from "../types";

interface ProfileSwitcherProps {
  users: UserProfile[];
  currentUserId: string;
  onSelect: (userId: string) => void;
}

export function ProfileSwitcher({
  users,
  currentUserId,
  onSelect,
}: ProfileSwitcherProps) {
  const [open, setOpen] = useState(false);
  const currentUser = users.find((u) => u.id === currentUserId);

  return (
    <View>
      <Pressable
        onPress={() => setOpen(true)}
        className="bg-space-surface border border-space-border rounded-xl px-3 py-1.5 flex-row items-center gap-1.5"
      >
        <View className="w-5 h-5 rounded-full bg-neon-cyan/20 border border-neon-cyan/50 items-center justify-center">
          <Text className="text-neon-cyan text-[9px] font-bold">
            {currentUser?.pseudo.charAt(0).toUpperCase() ?? "?"}
          </Text>
        </View>
        <Text className="text-white/70 text-[10px] font-semibold">
          Vue: {currentUser?.pseudo ?? "???"}
        </Text>
        <Text className="text-white/40 text-[8px]">▼</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/60 items-center justify-center" onPress={() => setOpen(false)}>
          <View className="bg-space-surface border border-space-border rounded-2xl p-2 w-64 max-h-80">
            <Text className="text-white/40 text-[10px] font-bold tracking-widest uppercase px-3 py-2">
              Simuler profil
            </Text>
            <FlatList
              data={users}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onSelect(item.id);
                    setOpen(false);
                  }}
                  className={`flex-row items-center gap-2.5 rounded-xl px-3 py-2.5 ${
                    item.id === currentUserId ? "bg-neon-cyan/10" : ""
                  }`}
                >
                  <View className="w-7 h-7 rounded-full bg-space-card border border-space-border items-center justify-center">
                    <Text className="text-white text-xs font-bold">
                      {item.pseudo.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    className={`text-sm font-semibold ${
                      item.id === currentUserId ? "text-neon-cyan" : "text-white"
                    }`}
                  >
                    {item.pseudo}
                  </Text>
                  {item.id === currentUserId && (
                    <Text className="text-neon-cyan text-xs ml-auto">✓</Text>
                  )}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
