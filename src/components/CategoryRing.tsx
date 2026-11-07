import { View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

export interface RingSegment {
  color: string;
  value: number;
}

interface Props {
  data: RingSegment[];
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
}

/**
 * Smallest visible slice. Tiny categories stay on the ring as a hairline
 * instead of disappearing under the gaps.
 */
const MIN_SWEEP_DEG = 1.4;
/** Breathing room between neighboring slices, so they never touch. */
const GAP_DEG = 2.5;

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as const;
}

/** Clockwise arc path from `start` to `end`, both in degrees around `cx, cy`. */
function arcPath(
  cx: number,
  cy: number,
  r: number,
  start: number,
  end: number,
): string {
  const [x1, y1] = polar(cx, cy, r, start);
  const [x2, y2] = polar(cx, cy, r, end);
  const largeArc = end - start > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

export function CategoryRing({
  data,
  size = 210,
  strokeWidth = 22,
  trackColor,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const positive = data.filter((d) => d.value > 0);
  const total = positive.reduce((sum, d) => sum + d.value, 0);
  const count = positive.length;

  const paths: { color: string; d: string }[] = [];

  if (total > 0 && count > 0) {
    // Sweep each slice by its true share of the circle, then reserve room so
    // neighboring slices always keep `GAP_DEG` of distance. Slices that fall
    // below the minimum borrow that angle from the largest slice, which keeps
    // the ring readable without ever over-drawing a neighbor.
    const budget = 360 - (count > 1 ? count * GAP_DEG : 0);
    const sweeps = positive.map((d) => (d.value / total) * 360);
    if (count > 1) {
      const scale = budget / sweeps.reduce((sum, s) => sum + s, 0);
      for (let i = 0; i < sweeps.length; i++) sweeps[i] *= scale;
      const deficit = sweeps.reduce(
        (sum, s) => sum + Math.max(0, MIN_SWEEP_DEG - s),
        0,
      );
      if (deficit > 0) {
        // Donors are slices with room above the minimum.
        const capacity = sweeps.reduce(
          (sum, s) => sum + Math.max(0, s - MIN_SWEEP_DEG),
          0,
        );
        for (let i = 0; i < sweeps.length; i++) {
          const below = Math.max(0, MIN_SWEEP_DEG - sweeps[i]);
          if (below > 0) {
            sweeps[i] = MIN_SWEEP_DEG;
          } else if (capacity > 0) {
            sweeps[i] -= deficit * ((sweeps[i] - MIN_SWEEP_DEG) / capacity);
          }
        }
        // Pathological many-tiny-slices case (deficit can exceed the donors'
        // capacity): scale everything back so the ring still closes at 360°.
        const totalSweep = sweeps.reduce((sum, s) => sum + s, 0);
        if (count * GAP_DEG + totalSweep > 360) {
          const factor = (360 - count * GAP_DEG) / totalSweep;
          for (let i = 0; i < sweeps.length; i++) sweeps[i] *= factor;
        }
      }
    } else {
      sweeps[0] = 360;
    }

    let angle = -90; // start from the top, like a clock face
    if (count === 1) {
      paths.push({
        color: positive[0].color,
        d: arcPath(cx, cy, radius, angle, angle + 359.999),
      });
    } else {
      positive.forEach((d, i) => {
        const start = angle + GAP_DEG / 2;
        const end = start + sweeps[i];
        paths.push({ color: d.color, d: arcPath(cx, cy, radius, start, end) });
        angle += sweeps[i] + GAP_DEG;
      });
    }
  }

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {trackColor ? (
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
        ) : null}
        {paths.map((p, i) => (
          <Path
            key={i}
            d={p.d}
            stroke={p.color}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            fill="none"
          />
        ))}
      </Svg>
    </View>
  );
}
