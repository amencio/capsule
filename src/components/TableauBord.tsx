import { View, Text, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { Fuel, Flame, Satellite } from "lucide-react-native";

interface TableauBordProps {
  onPressDemander: () => void;
  onPressAllumage: () => void;
  onPressRavitaillement: () => void;
  pendingRequestsCount: number;
  allumageDisabled?: boolean;
}

export function TableauBord({
  onPressDemander,
  onPressAllumage,
  onPressRavitaillement,
  pendingRequestsCount,
  allumageDisabled = false,
}: TableauBordProps) {
  return (
    <View className="w-full px-4 pb-2 z-10">
      <View className="flex-row items-stretch gap-2.5 rounded-2xl border-2 border-black bg-[#1a233a] p-3">
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onPressDemander();
          }}
          className="flex-1 rounded-xl border-2 border-black bg-[#4ade80] items-center justify-center py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
          style={{ minHeight: 70 }}
        >
          <Fuel color="#000" size={20} />
          <Text className="text-black text-[8px] font-black uppercase text-center mt-1 leading-tight tracking-wide">
            DEMANDER DU{"\n"}CARBURANT
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            if (allumageDisabled) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            onPressAllumage();
          }}
          disabled={allumageDisabled}
          className={`flex-[1.5] rounded-xl border-2 border-black items-center justify-center py-3 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 ${
            allumageDisabled
              ? "bg-[#f97316]/30"
              : "bg-[#f97316] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          }`}
          style={{ minHeight: 70 }}
        >
          <Flame color={allumageDisabled ? "rgba(255,255,255,0.3)" : "#fff"} size={24} />
          <Text
            className={`text-[9px] font-black uppercase text-center mt-1 leading-tight tracking-wide ${
              allumageDisabled ? "text-white/30" : "text-white"
            }`}
          >
            ALLUMAGE{"\n"}MOTEURS
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onPressRavitaillement();
          }}
          className="flex-1 rounded-xl border-2 border-black bg-[#1e3a5f] items-center justify-center py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 relative"
          style={{ minHeight: 70 }}
        >
          <Satellite color="#fff" size={20} />
          <Text className="text-white text-[8px] font-black uppercase text-center mt-1 leading-tight tracking-wide">
            RAVITAILLER{"\n"}LES AMIS
          </Text>

          {pendingRequestsCount > 0 && (
            <View className="absolute -top-1.5 -right-1.5 bg-[#FF3B30] border-2 border-black rounded-full min-w-[20px] h-5 items-center justify-center px-1">
              <Text className="text-white text-[9px] font-bold">
                {pendingRequestsCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}
