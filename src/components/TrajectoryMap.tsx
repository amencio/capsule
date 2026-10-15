import { useEffect } from "react";
import { View, Text, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import Svg, { Defs, LinearGradient, Stop, Path, Circle, Ellipse, Rect, Line } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { ORBITAL_RANKS } from "../utils/ranks";
import type { UserProfile } from "../types";

const AVATAR_SIZE = 36;

interface AvatarMarker {
  user: UserProfile;
  altitude: number;
}

interface TrajectoryMapProps {
  currentUserId: string;
  markers: AvatarMarker[];
}

function EarthSVG({ width }: { width: number }) {
  const w = Math.min(width * 0.8, 320);
  const h = w * 0.5;

  return (
    <Svg width={w} height={h} viewBox="0 0 200 100">
      <Ellipse cx={100} cy={100} rx={98} ry={88} fill="none" stroke="rgba(0,240,255,0.2)" strokeWidth="4" />
      <Ellipse cx={100} cy={100} rx={95} ry={85} fill="#1B4D8C" />
      <Ellipse cx={62} cy={72} rx={22} ry={13} fill="#2A7F3E" opacity={0.5} />
      <Ellipse cx={120} cy={65} rx={16} ry={11} fill="#2A7F3E" opacity={0.45} />
      <Ellipse cx={150} cy={78} rx={13} ry={9} fill="#2A7F3E" opacity={0.4} />
      <Ellipse cx={85} cy={88} rx={11} ry={7} fill="#2A7F3E" opacity={0.35} />
      <Ellipse cx={40} cy={85} rx={10} ry={6} fill="#2A7F3E" opacity={0.3} />
      <Ellipse cx={100} cy={30} rx={18} ry={10} fill="#2A7F3E" opacity={0.5} />
    </Svg>
  );
}

function ISSSVG({ width }: { width: number }) {
  const w = Math.min(width * 0.35, 120);
  const h = w * 0.6;

  return (
    <Svg width={w} height={h} viewBox="0 0 90 54">
      <Rect x={0} y={18} width={18} height={16} fill="#1a3a5c" stroke="#6699cc" strokeWidth="0.8" />
      <Line x1={3} y1={18} x2={3} y2={34} stroke="#6699cc" strokeWidth="0.5" />
      <Line x1={8} y1={18} x2={8} y2={34} stroke="#6699cc" strokeWidth="0.5" />
      <Line x1={13} y1={18} x2={13} y2={34} stroke="#6699cc" strokeWidth="0.5" />
      <Line x1={0} y1={24} x2={18} y2={24} stroke="#6699cc" strokeWidth="0.5" />
      <Line x1={0} y1={29} x2={18} y2={29} stroke="#6699cc" strokeWidth="0.5" />

      <Rect x={18} y={24} width={5} height={4} fill="#999" stroke="black" strokeWidth="0.5" />

      <Rect x={23} y={14} width={20} height={24} rx={4} fill="#c0c0c0" stroke="black" strokeWidth="1" />
      <Rect x={23} y={14} width={20} height={6} rx={3} fill="#d8d8d8" stroke="black" strokeWidth="0.8" />
      <Circle cx={28} cy={21} r={1.5} fill="#444" />
      <Circle cx={33} cy={21} r={1.5} fill="#444" />
      <Circle cx={38} cy={21} r={1.5} fill="#444" />
      <Circle cx={28} cy={29} r={1.5} fill="#444" />
      <Circle cx={33} cy={29} r={1.5} fill="#444" />
      <Circle cx={38} cy={29} r={1.5} fill="#444" />

      <Rect x={43} y={24} width={5} height={4} fill="#999" stroke="black" strokeWidth="0.5" />

      <Rect x={48} y={18} width={18} height={16} fill="#1a3a5c" stroke="#6699cc" strokeWidth="0.8" />
      <Line x1={51} y1={18} x2={51} y2={34} stroke="#6699cc" strokeWidth="0.5" />
      <Line x1={56} y1={18} x2={56} y2={34} stroke="#6699cc" strokeWidth="0.5" />
      <Line x1={61} y1={18} x2={61} y2={34} stroke="#6699cc" strokeWidth="0.5" />
      <Line x1={48} y1={24} x2={66} y2={24} stroke="#6699cc" strokeWidth="0.5" />
      <Line x1={48} y1={29} x2={66} y2={29} stroke="#6699cc" strokeWidth="0.5" />

      <Line x1={66} y1={26} x2={74} y2={20} stroke="#999" strokeWidth="1.5" />
      <Line x1={66} y1={26} x2={74} y2={32} stroke="#999" strokeWidth="1.5" />
      <Rect x={71} y={16} width={7} height={4} fill="#4169E1" stroke="#6699cc" strokeWidth="0.5" />
      <Rect x={71} y={32} width={7} height={4} fill="#4169E1" stroke="#6699cc" strokeWidth="0.5" />
    </Svg>
  );
}

function MapAvatar({
  user,
  x,
  y,
  altitude,
  isCurrentUser,
  isLeader,
  index,
}: {
  user: UserProfile;
  x: number;
  y: number;
  altitude: number;
  isCurrentUser: boolean;
  isLeader: boolean;
  index: number;
}) {
  const floatAnim = useSharedValue(0);

  useEffect(() => {
    if (altitude > 0) {
      floatAnim.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 2500 + index * 400, easing: Easing.inOut(Easing.sin) }),
          withTiming(3, { duration: 2500 + index * 400, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    } else {
      floatAnim.value = 0;
    }
    return () => cancelAnimation(floatAnim);
  }, [altitude, floatAnim, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }],
  }));

  const borderColor = isCurrentUser ? "#00F0FF" : "#fff";

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: "absolute",
          left: x - AVATAR_SIZE / 2,
          top: y - AVATAR_SIZE / 2,
          zIndex: isCurrentUser ? 30 : 10 + index,
        },
      ]}
    >
      {isLeader && altitude > 0 && (
        <Text
          style={{
            position: "absolute",
            top: -14,
            left: AVATAR_SIZE / 2 - 7,
            fontSize: 13,
            zIndex: 30,
          }}
        >
          👑
        </Text>
      )}

      <View
        style={{
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          borderRadius: AVATAR_SIZE / 2,
          borderWidth: 2.5,
          borderColor: borderColor,
          overflow: "hidden",
          backgroundColor: "#444",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={{ width: AVATAR_SIZE - 5, height: AVATAR_SIZE - 5 }} contentFit="cover" />
        ) : (
          <Text style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>
            {user.pseudo.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>

      <View
        style={{
          position: "absolute",
          top: AVATAR_SIZE + 2,
          left: "50%",
          transform: [{ translateX: -30 }],
          backgroundColor: "white",
          paddingHorizontal: 5,
          paddingVertical: 1,
          borderRadius: 999,
          borderWidth: 1.5,
          borderColor: "#000",
          minWidth: 60,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "black", fontSize: 8, fontWeight: "bold" }} numberOfLines={1}>
          {user.pseudo} {altitude > 0 ? `(+${altitude})` : "(0)"}
        </Text>
      </View>
    </Animated.View>
  );
}

function getPositionOnCurve(
  t: number,
  centerX: number,
  amplitude: number,
  bottomY: number,
  topY: number,
  midY: number
) {
  const mt = 1 - t;
  const x = centerX + 4 * amplitude * t * mt;
  const y = mt * mt * bottomY + 2 * mt * t * midY + t * t * topY;
  return { x, y };
}

export function TrajectoryMap({ currentUserId, markers }: TrajectoryMapProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const mapHeight = screenHeight * 0.55;
  const mapWidth = screenWidth;

  const rawMax = Math.max(1, ...markers.map((m) => m.altitude));
  const scaleMax = Math.max(rawMax + Math.ceil(rawMax * 0.2), 5);

  const centerX = mapWidth / 2;
  const amplitude = mapWidth * 0.12;
  const bottomY = mapHeight - 35;
  const topY = 30;
  const midY = (bottomY + topY) / 2;

  const sortedMarkers = [...markers].sort((a, b) => a.altitude - b.altitude);

  const curvePath = `M ${centerX} ${bottomY} Q ${centerX + 2 * amplitude} ${midY} ${centerX} ${topY}`;

  const ranksOnMap = ORBITAL_RANKS.filter(
    (r) => r.minAltitude > 0 && r.minAltitude < scaleMax
  );

  return (
    <View style={{ width: "100%", height: mapHeight, position: "relative", overflow: "visible" }}>
      <Svg width={mapWidth} height={mapHeight} style={{ position: "absolute", top: 0, left: 0 }}>
        <Defs>
          <LinearGradient id="curveGrad" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor="#1B4D8C" />
            <Stop offset="0.5" stopColor="#0099CC" />
            <Stop offset="1" stopColor="#00F0FF" />
          </LinearGradient>
        </Defs>

        <Path d={curvePath} fill="none" stroke="url(#curveGrad)" strokeWidth={2.5} opacity={0.6} />

        {ranksOnMap.map((rank) => {
          const t = rank.minAltitude / scaleMax;
          const pos = getPositionOnCurve(t, centerX, amplitude, bottomY, topY, midY);
          return (
            <Circle
              key={`rank-dot-${rank.minAltitude}`}
              cx={pos.x}
              cy={pos.y}
              r={3}
              fill={rank.color}
              opacity={0.7}
            />
          );
        })}
      </Svg>

      <View
        style={{
          position: "absolute",
          top: topY - 30,
          left: centerX - 60,
          width: 120,
          alignItems: "center",
        }}
      >
        <ISSSVG width={mapWidth} />
        <Text style={{ color: "rgba(0,240,255,0.7)", fontSize: 8, fontWeight: "bold", textAlign: "center", marginTop: 2 }}>
          ISS / +{rawMax}
        </Text>
      </View>

      {ranksOnMap.map((rank) => {
        const t = rank.minAltitude / scaleMax;
        const pos = getPositionOnCurve(t, centerX, amplitude, bottomY, topY, midY);
        return (
          <View
            key={`rank-label-${rank.minAltitude}`}
            style={{
              position: "absolute",
              left: pos.x + 8,
              top: pos.y - 6,
            }}
          >
            <Text style={{ fontSize: 8, opacity: 0.5 }}>{rank.emoji}</Text>
          </View>
        );
      })}

      {(() => {
        const rawPositions = sortedMarkers.map((m) => {
          const t = m.altitude / scaleMax;
          return getPositionOnCurve(t, centerX, amplitude, bottomY, topY, midY);
        });

        const CLUSTER_THRESHOLD = AVATAR_SIZE + 6;
        const clusters: number[][] = [];
        let currentCluster: number[] = [];
        for (let i = 0; i < rawPositions.length; i++) {
          if (currentCluster.length === 0) {
            currentCluster.push(i);
          } else {
            const prevY = rawPositions[currentCluster[currentCluster.length - 1]].y;
            if (Math.abs(rawPositions[i].y - prevY) < CLUSTER_THRESHOLD) {
              currentCluster.push(i);
            } else {
              clusters.push(currentCluster);
              currentCluster = [i];
            }
          }
        }
        if (currentCluster.length > 0) clusters.push(currentCluster);

        const adjustedX = rawPositions.map((p) => p.x);
        for (const cluster of clusters) {
          if (cluster.length <= 1) continue;
          const n = cluster.length;
          const spacing = AVATAR_SIZE + 4;
          const startX = rawPositions[cluster[0]].x - ((n - 1) * spacing) / 2;
          cluster.forEach((idx, i) => {
            adjustedX[idx] = startX + i * spacing;
          });
        }

        return sortedMarkers.map((marker, index) => (
          <MapAvatar
            key={marker.user.id}
            user={marker.user}
            x={adjustedX[index]}
            y={rawPositions[index].y}
            altitude={marker.altitude}
            isCurrentUser={marker.user.id === currentUserId}
            isLeader={marker.altitude === rawMax && marker.altitude > 0}
            index={index}
          />
        ));
      })()}

      <View
        style={{
          position: "absolute",
          bottom: -100,
          left: centerX - 130,
          width: 260,
          alignItems: "center",
        }}
      >
        <EarthSVG width={mapWidth} />
      </View>

      <View
        style={{
          position: "absolute",
          bottom: 10,
          left: centerX - 40,
          width: 80,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "rgba(0,240,255,0.6)", fontSize: 8, fontWeight: "bold", textAlign: "center" }}>
          TERRE / 0
        </Text>
      </View>
    </View>
  );
}
