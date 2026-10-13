import { View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

export interface RingSegment {
  color: string;
  value: number;
}

interface Props {
  data: RingSegment[];
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  gap?: number;
}

export function CategoryRing({
  data,
  size = 210,
  strokeWidth = 22,
  trackColor,
  gap = 8,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const arcs = data.map((d, i) => {
    const before = data.slice(0, i).reduce((sum, x) => sum + x.value, 0);
    const fraction = total > 0 ? d.value / total : 0;
    const raw = fraction * circumference;
    const length =
      data.length > 1
        ? Math.max(raw - (gap + strokeWidth), 0.001)
        : raw;
    const start = total > 0 ? (before / total) * circumference : 0;
    return { color: d.color, length, start };
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation={90} origin={`${center}, ${center}`}>
          {trackColor ? (
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={trackColor}
              strokeWidth={strokeWidth}
              fill="none"
            />
          ) : null}
          {arcs.map((a, i) => (
            <Circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              stroke={a.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={
                data.length > 1
                  ? [a.length, Math.max(circumference - a.length, 0)]
                  : undefined
              }
              strokeDashoffset={-a.start}
            />
          ))}
        </G>
      </Svg>
    </View>
  );
}
