import Svg, { Path, Rect, Ellipse } from "react-native-svg";
import { View } from "react-native";

interface CapsuleLogoProps {
  size?: number;
}

export function CapsuleLogo({ size = 28 }: CapsuleLogoProps) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        {/* Shuttle body */}
        <Path
          d="M16 2 Q19 2 20 8 L20 22 Q20 26 16 28 Q12 26 12 22 L12 8 Q13 2 16 2 Z"
          fill="white"
          stroke="black"
          strokeWidth="1.5"
        />
        {/* Cockpit */}
        <Ellipse cx="16" cy="9" rx="3" ry="3.5" fill="#00F0FF" stroke="black" strokeWidth="1" />
        {/* Left wing */}
        <Path
          d="M12 14 L4 24 L12 22 Z"
          fill="white"
          stroke="black"
          strokeWidth="1.5"
        />
        {/* Right wing */}
        <Path
          d="M20 14 L28 24 L20 22 Z"
          fill="white"
          stroke="black"
          strokeWidth="1.5"
        />
        {/* Engine nozzle left */}
        <Rect x="13" y="28" width="2.5" height="3" rx="1" fill="#FF6B1A" stroke="black" strokeWidth="0.8" />
        {/* Engine nozzle right */}
        <Rect x="16.5" y="28" width="2.5" height="3" rx="1" fill="#FF6B1A" stroke="black" strokeWidth="0.8" />
        {/* Flame */}
        <Path d="M14.25 31 Q13 33 14 30" fill="#FFD60A" opacity="0.8" />
        <Path d="M17.75 31 Q19 33 18 30" fill="#FFD60A" opacity="0.8" />
        {/* Body stripe */}
        <Rect x="12" y="16" width="8" height="1.5" fill="#FF6B1A" />
      </Svg>
    </View>
  );
}
