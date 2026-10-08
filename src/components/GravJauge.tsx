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
import type { UserProfile } from "../types";

const AVATAR_W = 60;
const AVATAR_H = 95;

interface AvatarMarker {
  user: UserProfile;
  altitude: number;
}

interface GravJaugeProps {
  currentUserId: string;
  markers: AvatarMarker[];
}

function CosmonautSVG() {
  return (
    <Svg width={AVATAR_W} height={AVATAR_H} viewBox="0 0 60 95">
      {/* Backpack */}
      <Rect x="10" y="40" width="40" height="28" rx="6" fill="#d0d0d0" stroke="black" strokeWidth="2" />
      <Circle cx="15" cy="46" r="2" fill="#888" />
      <Circle cx="15" cy="52" r="2" fill="#888" />
      <Circle cx="45" cy="46" r="2" fill="#888" />
      <Circle cx="45" cy="52" r="2" fill="#888" />

      {/* Arms */}
      <Path d="M14 45 Q8 50 6 58" stroke="white" strokeWidth="7" strokeLinecap="round" fill="none" />
      <Path d="M14 45 Q8 50 6 58" stroke="black" strokeWidth="2" strokeLinecap="round" fill="none" />
      <Path d="M46 45 Q52 50 54 58" stroke="white" strokeWidth="7" strokeLinecap="round" fill="none" />
      <Path d="M46 45 Q52 50 54 58" stroke="black" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* Body */}
      <Path
        d="M14 42 Q14 60 18 78 L42 78 Q46 60 46 42 Z"
        fill="white"
        stroke="black"
        strokeWidth="2"
      />

      {/* Belt */}
      <Rect x="18" y="62" width="24" height="4" fill="#FF6B1A" stroke="black" strokeWidth="1" />

      {/* Legs */}
      <Rect x="22" y="78" width="7" height="14" rx="3" fill="white" stroke="black" strokeWidth="2" />
      <Rect x="31" y="78" width="7" height="14" rx="3" fill="white" stroke="black" strokeWidth="2" />

      {/* Boots */}
      <Rect x="20" y="90" width="11" height="5" rx="2" fill="#333" stroke="black" strokeWidth="1.5" />
      <Rect x="29" y="90" width="11" height="5" rx="2" fill="#333" stroke="black" strokeWidth="1.5" />

      {/* Helmet */}
      <Circle cx="30" cy="25" r="22" fill="white" stroke="black" strokeWidth="2" />

      {/* Visor */}
      <Ellipse cx="30" cy="23" rx="16" ry="14" fill="#1a1a2e" stroke="black" strokeWidth="1.5" />

      {/* Visor reflection */}
      <Path d="M18 16 Q22 12 28 12" stroke="rgba(0,240,255,0.5)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <Path d="M20 14 Q24 11 29 11" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* Antenna */}
      <Line x1="30" y1="3" x2="30" y2="-2" stroke="black" strokeWidth="1.5" />
      <Circle cx="30" cy="-1" r="2" fill="#FF3B30" stroke="black" strokeWidth="1" />
    </Svg>
  );
}

function ISSSVG() {
  return (
    <Svg width={36} height={24} viewBox="0 0 36 24">
      {/* Left solar panel */}
      <Rect x="0" y="8" width="10" height="8" fill="#1a3a5c" stroke="#6699cc" strokeWidth="0.5" />
      <Line x1="2" y1="8" x2="2" y2="16" stroke="#6699cc" strokeWidth="0.3" />
      <Line x1="5" y1="8" x2="5" y2="16" stroke="#6699cc" strokeWidth="0.3" />
      <Line x1="8" y1="8" x2="8" y2="16" stroke="#6699cc" strokeWidth="0.3" />
      <Line x1="0" y1="11" x2="10" y2="11" stroke="#6699cc" strokeWidth="0.3" />
      <Line x1="0" y1="14" x2="10" y2="14" stroke="#6699cc" strokeWidth="0.3" />

      {/* Left connector */}
      <Rect x="10" y="11" width="3" height="2" fill="#999" stroke="black" strokeWidth="0.5" />

      {/* Central module */}
      <Rect x="13" y="6" width="10" height="12" rx="3" fill="#c0c0c0" stroke="black" strokeWidth="0.8" />
      <Circle cx="16" cy="10" r="1" fill="#444" />
      <Circle cx="20" cy="10" r="1" fill="#444" />
      <Circle cx="16" cy="14" r="1" fill="#444" />
      <Circle cx="20" cy="14" r="1" fill="#444" />

      {/* Right connector */}
      <Rect x="23" y="11" width="3" height="2" fill="#999" stroke="black" strokeWidth="0.5" />

      {/* Right solar panel */}
      <Rect x="26" y="8" width="10" height="8" fill="#1a3a5c" stroke="#6699cc" strokeWidth="0.5" />
      <Line x1="28" y1="8" x2="28" y2="16" stroke="#6699cc" strokeWidth="0.3" />
      <Line x1="31" y1="8" x2="31" y2="16" stroke="#6699cc" strokeWidth="0.3" />
      <Line x1="34" y1="8" x2="34" y2="16" stroke="#6699cc" strokeWidth="0.3" />
      <Line x1="26" y1="11" x2="36" y2="11" stroke="#6699cc" strokeWidth="0.3" />
      <Line x1="26" y1="14" x2="36" y2="14" stroke="#6699cc" strokeWidth="0.3" />
    </Svg>
  );
}

function CosmonautAvatar({
  user,
  altitude,
  maxAltitude,
  gaugeHeight,
  isCurrentUser,
  isLeader,
  index,
}: {
  user: UserProfile;
  altitude: number;
  maxAltitude: number;
  gaugeHeight: number;
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
          withTiming(-4, { duration: 2500 + index * 300, easing: Easing.inOut(Easing.sin) }),
          withTiming(4, { duration: 2500 + index * 300, easing: Easing.inOut(Easing.sin) })
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
        {/* Crown on helmet */}
        {isLeader && hasLaunched && (
          <Text
            style={{
              position: "absolute",
              top: -10,
              left: AVATAR_W * 0.5 - 8,
              fontSize: 16,
              zIndex: 20,
            }}
          >
            👑
          </Text>
        )}

        <CosmonautSVG />

        {/* Avatar face inside visor */}
        <View
          style={{
            position: "absolute",
            top: 12,
            left: AVATAR_W * 0.5 - 13,
            width: 26,
            height: 26,
            borderRadius: 13,
            overflow: "hidden",
            borderWidth: 1.5,
            borderColor: "#000",
          }}
        >
          {user.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              style={{ width: 26, height: 26 }}
              contentFit="cover"
            />
          ) : (
            <View style={{ width: 26, height: 26, backgroundColor: "#444", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "white", fontSize: 10, fontWeight: "bold" }}>
                {user.pseudo.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Score label attached below cosmonaut */}
      <View
        style={{
          position: "absolute",
          top: AVATAR_H + 2,
          backgroundColor: "white",
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 999,
          borderWidth: 2,
          borderColor: "black",
        }}
      >
        <Text style={{ color: "black", fontSize: 8, fontWeight: "bold" }} numberOfLines={1}>
          {altitude > 0 ? `+${altitude} 🍻` : "Gravité Zéro"}
        </Text>
      </View>

      {/* Pseudo above */}
      <Text
        style={{
          position: "absolute",
          top: -14,
          left: 0,
          right: 0,
          textAlign: "center",
          color: isCurrentUser ? "#00F0FF" : "rgba(255,255,255,0.85)",
          fontSize: 8,
          fontWeight: "bold",
        }}
        numberOfLines={1}
      >
        {user.pseudo}
      </Text>
    </Animated.View>
  );
}

export function GravJauge({ currentUserId, markers }: GravJaugeProps) {
  const { height: screenHeight } = useWindowDimensions();
  const gaugeHeight = screenHeight * 0.55;

  const maxAltitude = Math.max(1, ...markers.map((m) => m.altitude));

  const sortedMarkers = [...markers].sort((a, b) => a.altitude - b.altitude);

  return (
    <View className="items-center" style={{ height: gaugeHeight + 50 }}>
      {/* Dashed vertical line */}
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
          top: 15,
        }}
      />

      {/* ISS at top of line */}
      <View style={{ position: "absolute", top: -5, left: "50%", transform: [{ translateX: -18 }] }}>
        <ISSSVG />
        <Text
          style={{
            color: "rgba(0,240,255,0.6)",
            fontSize: 7,
            fontWeight: "bold",
            textAlign: "center",
            marginTop: 1,
            letterSpacing: 1,
          }}
        >
          ISS
        </Text>
      </View>

      {/* Cosmonaut avatars positioned by percentage bottom */}
      {sortedMarkers.map((marker, index) => (
        <CosmonautAvatar
          key={marker.user.id}
          user={marker.user}
          altitude={marker.altitude}
          maxAltitude={maxAltitude}
          gaugeHeight={gaugeHeight}
          isCurrentUser={marker.user.id === currentUserId}
          isLeader={marker.altitude === maxAltitude && marker.altitude > 0}
          index={index}
        />
      ))}
    </View>
  );
}
