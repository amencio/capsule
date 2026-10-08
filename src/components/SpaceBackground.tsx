import { useMemo } from "react";
import { View, Text, useWindowDimensions } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";

interface Star {
  cx: number;
  cy: number;
  r: number;
  opacity: number;
}

const STARS: Star[] = [
  { cx: 30, cy: 40, r: 1.5, opacity: 0.9 },
  { cx: 80, cy: 70, r: 1, opacity: 0.6 },
  { cx: 140, cy: 30, r: 1.2, opacity: 0.8 },
  { cx: 200, cy: 90, r: 1, opacity: 0.5 },
  { cx: 260, cy: 50, r: 1.5, opacity: 0.7 },
  { cx: 320, cy: 80, r: 0.8, opacity: 0.4 },
  { cx: 60, cy: 130, r: 1.3, opacity: 0.7 },
  { cx: 120, cy: 160, r: 1, opacity: 0.5 },
  { cx: 190, cy: 120, r: 1.2, opacity: 0.8 },
  { cx: 250, cy: 170, r: 0.9, opacity: 0.6 },
  { cx: 310, cy: 140, r: 1.1, opacity: 0.7 },
  { cx: 360, cy: 180, r: 1, opacity: 0.4 },
  { cx: 40, cy: 220, r: 1.2, opacity: 0.7 },
  { cx: 100, cy: 250, r: 0.8, opacity: 0.5 },
  { cx: 170, cy: 210, r: 1.4, opacity: 0.8 },
  { cx: 230, cy: 260, r: 1, opacity: 0.4 },
  { cx: 290, cy: 230, r: 1.2, opacity: 0.6 },
  { cx: 350, cy: 270, r: 1, opacity: 0.7 },
  { cx: 70, cy: 320, r: 1.1, opacity: 0.6 },
  { cx: 150, cy: 300, r: 1, opacity: 0.4 },
  { cx: 210, cy: 340, r: 1.3, opacity: 0.8 },
  { cx: 280, cy: 310, r: 0.9, opacity: 0.5 },
  { cx: 330, cy: 350, r: 1, opacity: 0.6 },
];

interface SpaceBackgroundProps {
  width?: number;
  height?: number;
}

export function SpaceBackground({ width: propWidth, height: propHeight }: SpaceBackgroundProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const width = propWidth ?? screenWidth;
  const height = propHeight ?? screenHeight;

  const earthR = width * 0.7;
  const earthCx = width * 0.5;
  const earthCy = height + earthR * 0.55;

  const stars = useMemo(
    () => STARS.filter((s) => s.cx < width && s.cy < height - earthR * 0.35),
    [width, height, earthR]
  );

  return (
    <View className="absolute inset-0" pointerEvents="none">
      <LinearGradient
        colors={["#1a233a", "#0d111a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <Svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0 }}>
        {stars.map((star, i) => (
          <Circle
            key={`star-${i}`}
            cx={star.cx}
            cy={star.cy}
            r={star.r}
            fill="white"
            opacity={star.opacity}
          />
        ))}

        <Circle cx={width * 0.85} cy={height * 0.06} r={2.5} fill="#00F0FF" opacity={0.8} />
        <Circle cx={width * 0.15} cy={height * 0.04} r={2} fill="white" opacity={0.9} />

        <Circle cx={earthCx} cy={earthCy} r={earthR} fill="#1B4D8C" opacity={0.85} />
        <Circle cx={earthCx - earthR * 0.3} cy={earthCy - earthR * 0.35} r={earthR * 0.22} fill="#2A7F3E" opacity={0.35} />
        <Circle cx={earthCx + earthR * 0.15} cy={earthCy - earthR * 0.45} r={earthR * 0.16} fill="#2A7F3E" opacity={0.3} />
        <Circle cx={earthCx + earthR * 0.35} cy={earthCy - earthR * 0.1} r={earthR * 0.12} fill="#2A7F3E" opacity={0.25} />
        <Circle cx={earthCx - earthR * 0.1} cy={earthCy - earthR * 0.15} r={earthR * 0.1} fill="#2A7F3E" opacity={0.2} />
      </Svg>

      <View className="absolute top-6 left-4 items-center">
        <Text className="text-2xl">🛰️</Text>
        <Text className="text-white/30 text-[8px] font-bold tracking-widest mt-0.5">ISS</Text>
      </View>
    </View>
  );
}
