import { cn } from "@/lib/utils";

/**
 * Placeholder block for loading states. Uses the `.shimmer` utility from
 * globals.css so loading UI matches the rest of the app's motion language.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("shimmer rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
