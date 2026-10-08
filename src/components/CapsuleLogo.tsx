import Svg, { Path, Circle, Rect } from "react-native-svg";
import { View } from "react-native";

interface CapsuleLogoProps {
  size?: number;
}

export function CapsuleLogo({ size = 28 }: CapsuleLogoProps) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Rect x="11" y="4" width="10" height="5" rx="2.5" stroke="#00FF66" strokeWidth="1.5" />
        <Rect x="9" y="9" width="14" height="16" rx="7" stroke="#00FF66" strokeWidth="1.5" />
        <Path d="M16 9 L16 4 M14 6 L18 6" stroke="#00FF66" strokeWidth="1.2" strokeLinecap="round" />
        <Path d="M13 25 L11 30 M19 25 L21 30" stroke="#00FF66" strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M11 30 L9 31 M21 30 L23 31" stroke="#FF6B1A" strokeWidth="1.2" strokeLinecap="round" />
        <Circle cx="16" cy="15" r="2" fill="#00FF66" opacity="0.5" />
        <Path d="M9 16 L6 18 M23 16 L26 18" stroke="#00F0FF" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      </Svg>
    </View>
  );
}
