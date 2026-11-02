// Metro resolves `WhatsNewModal.native.tsx` or `WhatsNewModal.web.tsx` per
// platform. This base module only exists so TypeScript — which does not know
// the platform suffixes — can resolve the import in `src/app/_layout.tsx`.
export { WhatsNewModal } from "./WhatsNewModal.native";
