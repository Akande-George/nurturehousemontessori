import { PageSkeleton } from "@/components/PageSkeletons";

// Covers every route under this segment that does not define its own
// loading.tsx. Renders inside the role layout, so the sidebar stays put.
export default function Loading() {
  return <PageSkeleton />;
}
