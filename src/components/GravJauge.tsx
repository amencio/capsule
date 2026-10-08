import { useEffect } from "react";
import { View, Text, useWindowDimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { Image } from "expo-image";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import type { UserProfile } from "../types";

const AVATAR_W = 60;
const AVATAR_H = 90;

interface AvatarMarker {
  user: UserProfile;
  altitude: number;
}

interface GravJaugeProps {
  currentUserId: string;
  markers: AvatarMarker[];
}

function CosmonautAvatar({
  user,
  altitude,
  maxAltitude,
  gaugeHeight,
  isCurrentUser,
  isLeader,
}: {
  user: UserProfile;
  altitude: number;
  maxAltitude: number;
  gaugeHeight: number;
  isCurrentUser: boolean;
  isLeader: boolean;
}) {
  const translateY = useSharedValue(0);
  const floatAnim = useSharedValue(0);
  const safeMax = Math.max(maxAltitude, 1);
  const bottomPercent = (altitude / safeMax) * 100;
  const targetY = -(bottomPercent / 100) * (gaugeHeight - AVATAR_H - 20);
  const hasLaunched = altitude > 0;

  useEffect(() => {
    translateY.value = withSpring(targetY, {
      damping: hasLaunched ? 6 : 12,
      stiffness: hasLaunched ? 150 : 80,
      mass: 1,
    });

    if (hasLaunched) {
      floatAnim.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
          withTiming(3, { duration: 2500, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    } else {
      floatAnim.value = 0;
    }

    return () => {
      cancelAnimation(translateY);
      cancelAnimation(floatAnim);
    };
  }, [targetY, hasLaunched, translateY, floatAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value + floatAnim.value }],
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: "absolute",
          bottom: 10,
          left: 0,
          right: 0,
          alignItems: "center",
          zIndex: isCurrentUser ? 10 : 5,
        },
      ]}
    >
      <View style={{ width: AVATAR_W, height: AVATAR_H, position: "relative" }}>
        {isLeader && hasLaunched && (
          <Text style={{ position: "absolute", top: -18, right: -6, fontSize: 16, zIndex: 20 }}>
            👑
          </Text>
        )}

        <Svg width={AVATAR_W} height={AVATAR_H} viewBox="0 0 60 90">
          <Rect x="6" y="48" width="8" height="22" rx="3" fill="#e0e0e0" stroke="black" strokeWidth="1.5" />
          <Rect x="46" y="48" width="8" height="22" rx="3" fill="#e0e0e0" stroke="black" strokeWidth="1.5" />
          <Path
            d="M12 45 Q12 60 18 80 L42 80 Q48 60 48 45 Z"
            fill="white"
            stroke="black"
            strokeWidth="2"
          />
          <Circle cx="30" cy="25" r="22" fill="white" stroke="black" strokeWidth="2" />
          <Circle cx="30" cy="23" r="15" fill="#1a1a2e" />
        </Svg>

        <View
          style={{
            position: "absolute",
            top: 10,
            left: 17,
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

      <View
        style={{
          position: "absolute",
          bottom: -22,
          backgroundColor: "white",
          paddingHorizontal: 10,
          paddingVertical: 3,
          borderRadius: 999,
          borderWidth: 2,
          borderColor: "black",
        }}
      >
        <Text style={{ color: "black", fontSize: 9, fontWeight: "bold" }} numberOfLines={1}>
          {altitude > 0 ? `+${altitude} 🍻` : "Gravité Zéro"}
        </Text>
      </View>

      <Text
        style={{
          position: "absolute",
          top: -12,
          left: 0,
          right: 0,
          textAlign: "center",
          color: isCurrentUser ? "#00F0FF" : "rgba(255,255,255,0.8)",
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

  return (
    <View className="items-center" style={{ height: gaugeHeight + 40 }}>
      <View
        style={{
          width: 1,
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

      <View style={{ position: "absolute", top: -8, alignItems: "center" }}>
        <Text style={{ fontSize: 18 }}>🛰️</Text>
      </View>

      <View style={{ position: "absolute", bottom: -8, alignItems: "center" }}>
        <Text style={{ fontSize: 22 }}>🌍</Text>
      </View>

      {markers.map((marker) => (
        <CosmonautAvatar
          key={marker.user.id}
          user={marker.user}
          altitude={marker.altitude}
          maxAltitude={maxAltitude}
          gaugeHeight={gaugeHeight}
          isCurrentUser={marker.user.id === currentUserId}
          isLeader={marker.altitude === maxAltitude && marker.altitude > 0}
        />
      ))}
    </View>
  );
}
