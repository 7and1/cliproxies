import { cn } from "@/lib/utils";

/**
 * Skeleton component for placeholder content during loading.
 * Provides visual feedback that content is being loaded.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

/**
 * Skeleton variant for text lines
 */
export function TextSkeleton({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 ? "w-3/4" : "w-full")}
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton variant for card containers
 */
export function CardSkeleton({
  className,
  hasHeader = true,
  hasFooter = false,
}: {
  className?: string;
  hasHeader?: boolean;
  hasFooter?: boolean;
}) {
  return (
    <div
      className={cn("rounded-2xl border border-border/60 glass p-5", className)}
    >
      {hasHeader && (
        <div className="space-y-3 mb-4">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-3 w-full" />
        </div>
      )}
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      {hasFooter && (
        <div className="mt-4 pt-4 border-t border-border/40">
          <Skeleton className="h-4 w-24" />
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton variant for table rows
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 p-3 border border-border/40 rounded-lg"
        >
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton
              key={j}
              className="h-4 flex-1"
              style={{ animationDelay: `${(i * columns + j) * 50}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton variant for hero/featured content
 */
export function HeroSkeleton() {
  return (
    <div className="rounded-3xl border border-border/60 glass-strong p-8 md:p-12">
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-40" />
        <div className="space-y-3">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-12 w-1/2" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-12 w-32 rounded-lg" />
          <Skeleton className="h-12 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
