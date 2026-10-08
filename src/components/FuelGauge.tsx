import { View, Text } from "react-native";
import Svg, { Rect, Defs, ClipPath, LinearGradient, Stop } from "react-native-svg";
import { useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  useSharedValue,
} from "react-native-reanimated";

interface FuelGaugeProps {
  available: number;
  burning: number;
  max?: number;
}

const GAUGE_W = 110;
const TANK_W = 50;
const TANK_H = 55;
const FUEL_MAX = 10;

export function FuelGauge({ available, burning, max = FUEL_MAX }: FuelGaugeProps) {
  const fillPercent = Math.min(100, (available / max) * 100);
  const fuelH = (fillPercent / 100) * (TANK_H - 8);
  const fuelY = TANK_H - 4 - fuelH;

  const flicker = useSharedValue(1);
  const flickerStyle = useAnimatedStyle(() => ({
    opacity: flicker.value,
  }));

  useEffect(() => {
    if (burning > 0) {
      // eslint-disable-next-line react-hooks/immutability
      flicker.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 300, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      flicker.value = 1;
    }
  }, [burning, flicker]);

  return (
    <View className="items-center" style={{ width: GAUGE_W }}>
      <Text className="text-white/50 text-[8px] font-bold tracking-widest uppercase mb-1">
        ⛽ CARBURANT
      </Text>

      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6 }}>
        {/* Tank SVG */}
        <Svg width={TANK_W + 6} height={TANK_H + 6} viewBox={`0 0 ${TANK_W + 6} ${TANK_H + 6}`}>
          <Defs>
            <ClipPath id="tankClip">
              <Rect x="3" y="3" width={TANK_W} height={TANK_H} rx="6" />
            </ClipPath>
            <LinearGradient id="fuelGrad" x1="0" y1="1" x2="0" y2="0">
              <Stop offset="0" stopColor="#00CC52" />
              <Stop offset="1" stopColor="#00FF66" />
            </LinearGradient>
          </Defs>

          {/* Tank outline */}
          <Rect
            x="3" y="3" width={TANK_W} height={TANK_H} rx="6"
            fill="rgba(255,255,255,0.05)"
            stroke="black" strokeWidth="2"
          />

          {/* Fuel fill */}
          {fuelH > 0 && (
            <Rect
              x="3" y={fuelY + 3} width={TANK_W} height={fuelH}
              fill="url(#fuelGrad)"
              clipPath="url(#tankClip)"
            />
          )}

          {/* Fuel surface line */}
          {fuelH > 0 && (
            <Rect
              x="3" y={fuelY + 3} width={TANK_W} height="2"
              fill="#00FF66"
              clipPath="url(#tankClip)"
            />
          )}

          {/* Cap */}
          <Rect x={TANK_W / 2 - 6} y="0" width="12" height="4" rx="2" fill="#444" stroke="black" strokeWidth="1.5" />
        </Svg>

        {/* Numbers */}
        <View style={{ paddingBottom: 4 }}>
          <Text style={{ color: "#00FF66", fontSize: 18, fontWeight: "bold" }}>
            {available}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 8, fontWeight: "bold" }}>
            / {max}
          </Text>
          <Animated.Text style={[{ color: "#FF6B1A", fontSize: 10, fontWeight: "bold" }, flickerStyle]}>
            {burning > 0 ? `🔥 ${burning}` : ""}
          </Animated.Text>
        </View>
      </View>
    </View>
  );
}
