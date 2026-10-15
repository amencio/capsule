import { useEffect } from "react";
import { View, Text, useWindowDimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { Image } from "expo-image";
import Svg, { Circle, Path, Rect, Ellipse, Line } from "react-native-svg";
import { ORBITAL_RANKS } from "../utils/ranks";
import type { UserProfile } from "../types";

const AVATAR_W = 48;
const AVATAR_H = 80;

interface AvatarMarker {
  user: UserProfile;
  altitude: number;
}

interface RadarProps {
  currentUserId: string;
  markers: AvatarMarker[];
}

function CosmonautSVG() {
  return (
    <Svg width={AVATAR_W} height={AVATAR_H} viewBox="0 0 60 100">
      <Rect x="10" y="45" width="40" height="28" rx="6" fill="#d0d0d0" stroke="black" strokeWidth="2" />
      <Circle cx="15" cy="51" r="2" fill="#888" />
      <Circle cx="15" cy="57" r="2" fill="#888" />
      <Circle cx="45" cy="51" r="2" fill="#888" />
      <Circle cx="45" cy="57" r="2" fill="#888" />
      <Path d="M14 50 Q8 55 6 63" stroke="white" strokeWidth="7" strokeLinecap="round" fill="none" />
      <Path d="M14 50 Q8 55 6 63" stroke="black" strokeWidth="2" strokeLinecap="round" fill="none" />
      <Path d="M46 50 Q52 55 54 63" stroke="white" strokeWidth="7" strokeLinecap="round" fill="none" />
      <Path d="M46 50 Q52 55 54 63" stroke="black" strokeWidth="2" strokeLinecap="round" fill="none" />
      <Path d="M14 47 Q14 65 18 83 L42 83 Q46 65 46 47 Z" fill="white" stroke="black" strokeWidth="2" />
      <Rect x="18" y="67" width="24" height="4" fill="#FF6B1A" stroke="black" strokeWidth="1" />
      <Rect x="22" y="83" width="7" height="14" rx="3" fill="white" stroke="black" strokeWidth="2" />
      <Rect x="31" y="83" width="7" height="14" rx="3" fill="white" stroke="black" strokeWidth="2" />
      <Rect x="20" y="95" width="11" height="5" rx="2" fill="#333" stroke="black" strokeWidth="1.5" />
      <Rect x="29" y="95" width="11" height="5" rx="2" fill="#333" stroke="black" strokeWidth="1.5" />
      <Circle cx="30" cy="30" r="22" fill="white" stroke="black" strokeWidth="2" />
      <Ellipse cx="30" cy="28" rx="16" ry="14" fill="#1a1a2e" stroke="black" strokeWidth="1.5" />
      <Path d="M18 21 Q22 17 28 17" stroke="rgba(0,240,255,0.5)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <Path d="M20 19 Q24 16 29 16" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <Line x1="30" y1="8" x2="30" y2="3" stroke="black" strokeWidth="1.5" />
      <Circle cx="30" cy="4" r="2" fill="#FF3B30" stroke="black" strokeWidth="1" />
    </Svg>
  );
}

function ISSSVG() {
  return (
    <Svg width={30} height={20} viewBox="0 0 36 24">
      <Rect x="0" y="8" width="10" height="8" fill="#1a3a5c" stroke="#6699cc" strokeWidth="0.5" />
      <Line x1="2" y1="8" x2="2" y2="16" stroke="#6699cc" strokeWidth="0.3" />
      <Line x1="5" y1="8" x2="5" y2="16" stroke="#6699cc" strokeWidth="0.3" />
      <Line x1="8" y1="8" x2="8" y2="16" stroke="#6699cc" strokeWidth="0.3" />
      <Line x1="0" y1="11" x2="10" y2="11" stroke="#6699cc" strokeWidth="0.3" />
      <Line x1="0" y1="14" x2="10" y2="14" stroke="#6699cc" strokeWidth="0.3" />
      <Rect x="10" y="11" width="3" height="2" fill="#999" stroke="black" strokeWidth="0.5" />
      <Rect x="13" y="6" width="10" height="12" rx="3" fill="#c0c0c0" stroke="black" strokeWidth="0.8" />
      <Circle cx="16" cy="10" r="1" fill="#444" />
      <Circle cx="20" cy="10" r="1" fill="#444" />
      <Circle cx="16" cy="14" r="1" fill="#444" />
      <Circle cx="20" cy="14" r="1" fill="#444" />
      <Rect x="23" y="11" width="3" height="2" fill="#999" stroke="black" strokeWidth="0.5" />
      <Rect x="26" y="8" width="10" height="8" fill="#1a3a5c" stroke="#6699cc" strokeWidth="0.5" />
      <Line x1="28" y1="8" x2="28" y2="16" stroke="#6699cc" strokeWidth="0.3" />
      <Line x1="31" y1="8" x2="31" y2="16" stroke="#6699cc" strokeWidth="0.3" />
      <Line x1="34" y1="8" x2="34" y2="16" stroke="#6699cc" strokeWidth="0.3" />
      <Line x1="26" y1="11" x2="36" y2="11" stroke="#6699cc" strokeWidth="0.3" />
      <Line x1="26" y1="14" x2="36" y2="14" stroke="#6699cc" strokeWidth="0.3" />
    </Svg>
  );
}

function EarthCurve() {
  return (
    <Svg width={100} height={24} viewBox="0 0 100 24">
      <Path d="M 0 20 Q 50 -8 100 20 L 100 24 L 0 24 Z" fill="#1B4D8C" />
      <Path d="M 10 19 Q 50 -4 90 19" stroke="#2A7F3E" strokeWidth="2" fill="none" opacity="0.4" />
      <Circle cx="25" cy="18" r="3" fill="#2A7F3E" opacity="0.3" />
      <Circle cx="60" cy="16" r="4" fill="#2A7F3E" opacity="0.25" />
      <Circle cx="80" cy="18" r="2.5" fill="#2A7F3E" opacity="0.2" />
    </Svg>
  );
}

function CosmonautAvatar({
  user,
  altitude,
  maxAltitude,
  isCurrentUser,
  isLeader,
  index,
}: {
  user: UserProfile;
  altitude: number;
  maxAltitude: number;
  isCurrentUser: boolean;
  isLeader: boolean;
  index: number;
}) {
  const floatAnim = useSharedValue(0);
  const safeMax = Math.max(maxAltitude, 1);
  const bottomPercent = (altitude / safeMax) * 100;
  const hasLaunched = altitude > 0;

  useEffect(() => {
    if (hasLaunched) {
      floatAnim.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 2500 + index * 300, easing: Easing.inOut(Easing.sin) }),
          withTiming(3, { duration: 2500 + index * 300, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    } else {
      floatAnim.value = 0;
    }

    return () => cancelAnimation(floatAnim);
  }, [hasLaunched, floatAnim, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }],
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: "absolute",
          bottom: `${bottomPercent}%`,
          left: 0,
          right: 0,
          alignItems: "center",
          zIndex: isCurrentUser ? 20 : 5 + index,
        },
      ]}
    >
      <View style={{ width: AVATAR_W, height: AVATAR_H, position: "relative" }}>
        {isLeader && hasLaunched && (
          <Text
            style={{
              position: "absolute",
              top: -8,
              left: AVATAR_W * 0.5 - 7,
              fontSize: 14,
              zIndex: 20,
            }}
          >
            👑
          </Text>
        )}

        <CosmonautSVG />

        <View
          style={{
            position: "absolute",
            top: 13,
            left: AVATAR_W * 0.5 - 11,
            width: 22,
            height: 22,
            borderRadius: 11,
            overflow: "hidden",
            borderWidth: 1.5,
            borderColor: "#000",
          }}
        >
          {user.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              style={{ width: 22, height: 22 }}
              contentFit="cover"
            />
          ) : (
            <View style={{ width: 22, height: 22, backgroundColor: "#444", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "white", fontSize: 9, fontWeight: "bold" }}>
                {user.pseudo.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View
        style={{
          position: "absolute",
          top: AVATAR_H + 2,
          backgroundColor: "white",
          paddingHorizontal: 5,
          paddingVertical: 1,
          borderRadius: 999,
          borderWidth: 1.5,
          borderColor: "black",
        }}
      >
        <Text style={{ color: "black", fontSize: 7, fontWeight: "bold" }} numberOfLines={1}>
          {user.pseudo} {altitude > 0 ? `(+${altitude})` : "(0)"}
        </Text>
      </View>
    </Animated.View>
  );
}

export function Radar({ currentUserId, markers }: RadarProps) {
  const { height: screenHeight } = useWindowDimensions();
  const gaugeHeight = screenHeight * 0.42;

  const maxAltitude = Math.max(1, ...markers.map((m) => m.altitude));
  const safeMax = Math.max(maxAltitude, 1);

  const sortedMarkers = [...markers].sort((a, b) => a.altitude - b.altitude);

  return (
    <View className="items-center flex-1" style={{ height: gaugeHeight + 40, overflow: "visible" }}>
      <Text className="text-white/40 text-[7px] font-bold tracking-widest uppercase mb-1">
        📡 Radar
      </Text>

      <View style={{ width: "100%", flex: 1, position: "relative" }}>
        <View
          style={{
            width: 0,
            borderLeftWidth: 2,
            borderStyle: "dashed",
            borderColor: "rgba(255,255,255,0.5)",
            height: gaugeHeight,
            position: "absolute",
            left: "50%",
            transform: [{ translateX: -1 }],
            top: 10,
          }}
        />

        <View style={{ position: "absolute", top: -2, left: "50%", transform: [{ translateX: -15 }] }}>
          <ISSSVG />
          <Text
            style={{
              color: "rgba(0,240,255,0.6)",
              fontSize: 6,
              fontWeight: "bold",
              textAlign: "center",
              marginTop: 0,
              letterSpacing: 1,
            }}
          >
            ISS / +{maxAltitude}
          </Text>
        </View>

        {ORBITAL_RANKS.filter(
          (r) => r.minAltitude > 0 && r.minAltitude <= maxAltitude
        ).map((rank) => {
          const percent = (rank.minAltitude / safeMax) * 100;
          const bottomPx = (percent / 100) * gaugeHeight;
          return (
            <View
              key={rank.minAltitude}
              style={{
                position: "absolute",
                bottom: bottomPx + 10,
                left: "50%",
                transform: [{ translateX: -1 }],
                zIndex: 1,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                <View style={{ width: 6, height: 1.5, backgroundColor: rank.color, opacity: 0.5 }} />
                <Text style={{ fontSize: 6, opacity: 0.4 }}>{rank.emoji}</Text>
              </View>
            </View>
          );
        })}

        {sortedMarkers.map((marker, index) => (
          <CosmonautAvatar
            key={marker.user.id}
            user={marker.user}
            altitude={marker.altitude}
            maxAltitude={maxAltitude}
            isCurrentUser={marker.user.id === currentUserId}
            isLeader={marker.altitude === maxAltitude && marker.altitude > 0}
            index={index}
          />
        ))}

        <View style={{ position: "absolute", bottom: -8, left: "50%", transform: [{ translateX: -50 }] }}>
          <EarthCurve />
          <Text style={{ color: "rgba(0,240,255,0.5)", fontSize: 6, fontWeight: "bold", textAlign: "center", marginTop: 0 }}>
            Terre / 0
          </Text>
        </View>
      </View>
    </View>
  );
}
