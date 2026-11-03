// Metro resolves `AppUpdatePrompt.native.tsx` or `AppUpdatePrompt.web.tsx` per
// platform. This base module only exists so TypeScript — which does not know
// the platform suffixes — can resolve `@/components/updates/AppUpdatePrompt`.
export { AppUpdatePrompt } from "./AppUpdatePrompt.native";
