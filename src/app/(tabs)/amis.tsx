import { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { SpaceBackground } from "../../components/SpaceBackground";
import {
  MOCK_USERS,
  MOCK_CAPSULES,
  CURRENT_USER_ID,
} from "../../data/mocks";
import { calculateAltitude } from "../../utils/karma";
import { STATUS_LABELS } from "../../constants/theme";

export default function AmisScreen() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const allAltitudes = MOCK_USERS.map((user) => ({
    user,
    altitude: calculateAltitude(MOCK_CAPSULES, user.id),
  }));
  allAltitudes.sort((a, b) => b.altitude - a.altitude);

  const selectedUser = selectedUserId
    ? MOCK_USERS.find((u) => u.id === selectedUserId)
    : null;

  const capsulesWithSelected = selectedUser
    ? MOCK_CAPSULES.filter(
        (c) =>
          (c.creditor_id === selectedUser.id || c.debtor_id === selectedUser.id) &&
          (c.creditor_id === CURRENT_USER_ID || c.debtor_id === CURRENT_USER_ID)
      )
    : [];

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-space-deep">
      <SpaceBackground width={390} height={844} />

      <View className="px-4 pt-4 pb-2 z-10">
        <Text className="text-white text-xl font-bold">Amis</Text>
        <Text className="text-white/40 text-xs mt-0.5">
          Classement par altitude
        </Text>
      </View>

      <ScrollView
        contentContainerClassName="px-4 pb-8 z-10"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-4">
          {allAltitudes.map(({ user, altitude }, index) => {
            const isCurrentUser = user.id === CURRENT_USER_ID;
            const isSelected = selectedUserId === user.id;
            return (
              <Pressable
                key={user.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedUserId(isSelected ? null : user.id);
                }}
                className={`flex-row items-center gap-3 rounded-2xl px-4 py-3 mb-2 border ${
                  isSelected
                    ? "bg-space-card border-neon-cyan/50"
                    : "bg-space-surface border-space-border"
                }`}
              >
                <Text className="text-white/30 text-sm font-bold w-6">
                  #{index + 1}
                </Text>

                <View className="w-10 h-10 rounded-full items-center justify-center border-2 overflow-hidden bg-space-card">
                  {user.avatar_url ? (
                    <Image
                      source={{ uri: user.avatar_url }}
                      style={{ width: 36, height: 36 }}
                      contentFit="cover"
                    />
                  ) : (
                    <Text className="text-white text-sm font-bold">
                      {user.pseudo.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>

                <View className="flex-1">
                  <Text
                    className={`text-sm font-bold ${
                      isCurrentUser ? "text-neon-cyan" : "text-white"
                    }`}
                  >
                    {user.pseudo} {isCurrentUser && "(toi)"}
                  </Text>
                  <Text className="text-white/40 text-[10px]">
                    {altitude === 0
                      ? "Houston (sur Terre)"
                      : capsulesWithSelected.length > 0 && isSelected
                      ? `${capsulesWithSelected.length} capsule(s) en commun`
                      : "Cliquer pour détails"}
                  </Text>
                </View>

                <View className="items-end">
                  <Text
                    className={`text-lg font-bold ${
                      altitude > 0 ? "text-neon-green" : "text-neon-cyan"
                    }`}
                  >
                    {altitude}
                  </Text>
                  <Text className="text-white/30 text-[8px]">altitude</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {selectedUser && (
          <View className="bg-space-card/80 border border-space-border rounded-2xl p-4 mb-4">
            <Text className="text-white/60 text-xs font-bold tracking-widest uppercase mb-3">
              Capsules avec {selectedUser.pseudo}
            </Text>
            {capsulesWithSelected.length === 0 ? (
              <Text className="text-white/30 text-sm">Aucune capsule en commun</Text>
            ) : (
              capsulesWithSelected.map((c) => {
                const isCreditor = c.creditor_id === CURRENT_USER_ID;
                const direction = isCreditor
                  ? `→ Tu réclames à ${selectedUser.pseudo}`
                  : `← ${selectedUser.pseudo} te réclame`;
                return (
                  <View key={c.id} className="mb-3 pb-3 border-b border-space-border last:border-b-0">
                    <Text className="text-white/60 text-[10px] mb-1">{direction}</Text>
                    <View className="flex-row items-center gap-2">
                      <View className="bg-neon-green/10 border border-neon-green/30 rounded px-2 py-0.5">
                        <Text className="text-neon-green text-[10px] font-bold">
                          {c.drink_type}
                        </Text>
                      </View>
                      <Text className="text-white/70 text-xs flex-1">{c.reason}</Text>
                    </View>
                    <Text className="text-white/30 text-[10px] mt-1">
                      {STATUS_LABELS[c.status]}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        )}

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
