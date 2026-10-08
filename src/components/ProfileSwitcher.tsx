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
        className="bg-[#f8f9fa] border-2 border-black rounded-xl px-3 py-1.5 flex-row items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5"
      >
        <View className="w-5 h-5 rounded-full bg-[#06b6d4]/20 border border-[#06b6d4]/50 items-center justify-center">
          <Text className="text-[#06b6d4] text-[9px] font-bold">
            {currentUser?.pseudo.charAt(0).toUpperCase() ?? "?"}
          </Text>
        </View>
        <Text className="text-black/70 text-[10px] font-bold">
          Vue: {currentUser?.pseudo ?? "???"}
        </Text>
        <Text className="text-black/40 text-[8px]">▼</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/60 items-center justify-center" onPress={() => setOpen(false)}>
          <View className="bg-[#f8f9fa] border-2 border-black rounded-2xl p-2 w-64 max-h-80 shadow-[4px_6px_0px_0px_rgba(0,0,0,1)]">
            <Text className="text-black/40 text-[10px] font-bold tracking-widest uppercase px-3 py-2">
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
                  className={`flex-row items-center gap-2.5 rounded-xl px-3 py-2.5 border-2 ${item.id === currentUserId ? "bg-[#06b6d4]/10 border-[#06b6d4]/50" : "border-transparent"}`}
                >
                  <View className="w-7 h-7 rounded-full bg-white border-2 border-black items-center justify-center">
                    <Text className="text-black text-xs font-bold">
                      {item.pseudo.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    className={`text-sm font-bold ${
                      item.id === currentUserId ? "text-[#06b6d4]" : "text-black"
                    }`}
                  >
                    {item.pseudo}
                  </Text>
                  {item.id === currentUserId && (
                    <Text className="text-[#06b6d4] text-xs ml-auto">✓</Text>
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
