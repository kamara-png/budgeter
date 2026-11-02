// Metro resolves `UpdatesSection.native.tsx` or `UpdatesSection.web.tsx` per
// platform. This base module only exists so TypeScript — which does not know
// the platform suffixes — can resolve `@/components/updates/UpdatesSection`.
export { UpdatesSection } from "./UpdatesSection.native";
