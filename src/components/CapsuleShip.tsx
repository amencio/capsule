import { View, Text } from "react-native";
import { Image } from "expo-image";
import Svg, { Rect, Path, Circle, Ellipse, Defs, ClipPath, LinearGradient, Stop } from "react-native-svg";
import { useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  useSharedValue,
} from "react-native-reanimated";
import { TANK_MAX_CAPACITY } from "../constants/game";
import type { UserProfile } from "../types";
import type { OrbitalRank } from "../utils/ranks";

interface CapsuleShipProps {
  user: UserProfile;
  altitude: number;
  tankLevel: number;
  rank: OrbitalRank;
}

const SHIP_W = 160;
const SHIP_H = 140;
const TANK_W = 50;
const TANK_H = 120;


function SpaceshipSVG({ avatarUrl, pseudo }: { avatarUrl?: string; pseudo: string }) {
  return (
    <Svg width={SHIP_W} height={SHIP_H} viewBox="0 0 160 140">
      <Defs>
        <ClipPath id="visorClip">
          <Ellipse cx="80" cy="50" rx="28" ry="24" />
        </ClipPath>
        <LinearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#f0f0f0" />
          <Stop offset="1" stopColor="#c0c0c0" />
        </LinearGradient>
      </Defs>

      <Ellipse cx="80" cy="120" rx="40" ry="10" fill="#1a233a" opacity="0.4" />

      <Path d="M80 10 Q105 12 108 40 L108 95 Q108 115 80 125 Q52 115 52 95 L52 40 Q55 12 80 10 Z" fill="url(#bodyGrad)" stroke="black" strokeWidth="3" />

      <Rect x="52" y="60" width="56" height="4" fill="#FF6B1A" />
      <Rect x="52" y="64" width="56" height="2" fill="#FFD60A" opacity="0.6" />

      <Circle cx="62" cy="78" r="3" fill="#00FF66" stroke="black" strokeWidth="1" />
      <Circle cx="80" cy="78" r="3" fill="#FFD60A" stroke="black" strokeWidth="1" />
      <Circle cx="98" cy="78" r="3" fill="#FF3B30" stroke="black" strokeWidth="1" />

      <Ellipse cx="80" cy="50" rx="28" ry="24" fill="#0d111a" stroke="black" strokeWidth="3" />
      <Ellipse cx="80" cy="50" rx="28" ry="24" fill="rgba(0,0,0,0.3)" opacity="0.3" />

      <Path d="M58 38 Q65 30 78 28" stroke="rgba(0,240,255,0.6)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <Path d="M60 34 Q68 27 80 26" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" fill="none" />

      <Path d="M52 60 Q30 70 28 95 Q28 100 35 98 L52 90 Z" fill="#d0d0d0" stroke="black" strokeWidth="3" />
      <Path d="M108 60 Q130 70 132 95 Q132 100 125 98 L108 90 Z" fill="#d0d0d0" stroke="black" strokeWidth="3" />

      <Rect x="60" y="125" width="12" height="8" rx="2" fill="#FF6B1A" stroke="black" strokeWidth="2" />
      <Rect x="88" y="125" width="12" height="8" rx="2" fill="#FF6B1A" stroke="black" strokeWidth="2" />

      <Path d="M63 133 Q60 140 64 134" fill="#FFD60A" opacity="0.9" />
      <Path d="M67 135 Q68 142 64 136" fill="#FF6B1A" opacity="0.7" />
      <Path d="M91 133 Q88 140 92 134" fill="#FFD60A" opacity="0.9" />
      <Path d="M95 135 Q96 142 92 136" fill="#FF6B1A" opacity="0.7" />

      <Circle cx="78" cy="48" r="12" fill="black" opacity="0.3" clipPath="url(#visorClip)" />
    </Svg>
  );
}

function ShipAvatar({ avatarUrl, pseudo }: { avatarUrl?: string; pseudo: string }) {
  const size = 24;
  return (
    <View
      style={{
        position: "absolute",
        top: 38,
        left: SHIP_W * 0.5 - size * 0.5,
        width: size,
        height: size,
        borderRadius: size * 0.5,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#000",
        zIndex: 5,
      }}
    >
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={{ width: size, height: size }} contentFit="cover" />
      ) : (
        <View style={{ width: size, height: size, backgroundColor: "#444", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "white", fontSize: 10, fontWeight: "bold" }}>
            {pseudo.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );
}

function FuelTank({ level, max }: { level: number; max: number }) {
  const flicker = useSharedValue(1);
  const flickerStyle = useAnimatedStyle(() => ({ opacity: flicker.value }));

  useEffect(() => {
    if (level > 0) {
      // eslint-disable-next-line react-hooks/immutability
      flicker.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      flicker.value = 1;
    }
  }, [level, flicker]);

  const sectionH = (TANK_H - 8) / max;
  const filledSections = Math.min(level, max);

  return (
    <View className="items-center">
      <Text className="text-white/50 text-[7px] font-bold tracking-widest uppercase mb-1">
        ⛽ RÉSERVOIR
      </Text>

      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6 }}>
        <Svg width={TANK_W + 6} height={TANK_H + 8} viewBox={`0 0 ${TANK_W + 6} ${TANK_H + 8}`}>
          <Defs>
            <ClipPath id="tankClipShip">
              <Rect x="3" y="6" width={TANK_W} height={TANK_H} rx="8" />
            </ClipPath>
            <LinearGradient id="fuelGradShip" x1="0" y1="1" x2="0" y2="0">
              <Stop offset="0" stopColor="#00CC52" />
              <Stop offset="1" stopColor="#00FF66" />
            </LinearGradient>
          </Defs>

          <Rect x="3" y="6" width={TANK_W} height={TANK_H} rx="8" fill="rgba(255,255,255,0.08)" stroke="black" strokeWidth="2.5" />

          {Array.from({ length: filledSections }).map((_, i) => {
            const y = TANK_H + 6 - (i + 1) * sectionH;
            return (
              <Rect
                key={`fill-${i}`}
                x="4"
                y={y}
                width={TANK_W - 2}
                height={sectionH - 1}
                fill="url(#fuelGradShip)"
                clipPath="url(#tankClipShip)"
              />
            );
          })}

          {Array.from({ length: max }).map((_, i) => {
            const y = TANK_H + 6 - (i + 1) * sectionH;
            return (
              <Rect
                key={`line-${i}`}
                x="3"
                y={y}
                width={TANK_W}
                height="1"
                fill="rgba(0,0,0,0.3)"
                clipPath="url(#tankClipShip)"
              />
            );
          })}

          <Rect x={TANK_W / 2 - 6} y="2" width="12" height="5" rx="2" fill="#444" stroke="black" strokeWidth="1.5" />
        </Svg>

        <View style={{ paddingBottom: 8 }}>
          <Animated.Text style={[{ color: "#00FF66", fontSize: 22, fontWeight: "bold" }, flickerStyle]}>
            {level}
          </Animated.Text>
          <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: "bold" }}>
            / {max}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 6, fontWeight: "bold", marginTop: 2 }}>
            {level >= max ? "PLEIN" : "OK"}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function CapsuleShip({ user, altitude, tankLevel, rank }: CapsuleShipProps) {
  return (
    <View className="flex-1 items-center justify-center">
      <View className="items-center">
        <View style={{ position: "relative", width: SHIP_W, height: SHIP_H }}>
          <SpaceshipSVG avatarUrl={user.avatar_url} pseudo={user.pseudo} />
          <ShipAvatar avatarUrl={user.avatar_url} pseudo={user.pseudo} />
        </View>

        <View className="flex-row items-end gap-4 mt-2">
          <FuelTank level={tankLevel} max={TANK_MAX_CAPACITY} />
        </View>

        <View
          className="mt-3 px-4 py-1.5 rounded-full border-2 border-black bg-white"
          style={{ shadowColor: "#000", shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}
        >
          <Text className="text-black text-sm font-bold">
            {user.pseudo} / Altitude : +{altitude}
          </Text>
        </View>

        <View className="mt-1.5 flex-row items-center gap-1">
          <Text style={{ color: rank.color }} className="text-xs font-bold">
            {rank.emoji} {rank.name}
          </Text>
        </View>

        {tankLevel > 0 && (
          <View className="flex-row items-center gap-1 mt-1.5">
            <View className="w-2 h-2 rounded-full bg-[#00FF66] border border-black" />
            <Text className="text-[#00FF66] text-[8px] font-bold tracking-wide">PRÊT</Text>
          </View>
        )}
      </View>
    </View>
  );
}
