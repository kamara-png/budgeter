import type { StyleProp, ViewStyle } from "react-native";
import { SimChips } from "@/components/SimChips";
import { useStore } from "@/store/useStore";

interface Props {
  contentStyle?: StyleProp<ViewStyle>;
}

/** Chips for switching the SIM that the whole app is looking at. */
export function SimFilter({ contentStyle }: Props) {
  const sims = useStore((s) => s.sims);
  const activeSimId = useStore((s) => s.activeSimId);
  const setActiveSim = useStore((s) => s.setActiveSim);

  if (sims.length <= 1) return null;

  return (
    <SimChips
      value={activeSimId}
      onChange={setActiveSim}
      includeAll
      contentStyle={contentStyle}
    />
  );
}
