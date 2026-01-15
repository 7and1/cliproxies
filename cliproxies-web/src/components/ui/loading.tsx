export function PageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 animate-fade-in">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-border/30" />
        <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function InlineLoader({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-3",
  };

  return (
    <div
      className={`rounded-full ${sizeClasses[size]} border-border/30`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-border/60 glass p-5 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="h-5 w-32 rounded bg-muted animate-shimmer" />
          <div className="space-y-2">
            <div
              className="h-3.5 w-full rounded bg-muted animate-shimmer"
              style={{ animationDelay: "0.1s" }}
            />
            <div
              className="h-3.5 w-3/4 rounded bg-muted animate-shimmer"
              style={{ animationDelay: "0.2s" }}
            />
          </div>
        </div>
        <div
          className="h-8 w-12 rounded-lg bg-muted/50 animate-shimmer"
          style={{ animationDelay: "0.15s" }}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <div
          className="h-7 w-16 rounded-full bg-muted/50 animate-shimmer"
          style={{ animationDelay: "0.25s" }}
        />
        <div
          className="h-7 w-20 rounded-full bg-muted/50 animate-shimmer"
          style={{ animationDelay: "0.3s" }}
        />
        <div
          className="h-7 w-16 rounded-full bg-muted/50 animate-shimmer"
          style={{ animationDelay: "0.35s" }}
        />
      </div>
      <div className="mt-auto pt-2 border-t border-border/40">
        <div
          className="h-4 w-28 rounded bg-muted/50 animate-shimmer"
          style={{ animationDelay: "0.4s" }}
        />
      </div>
    </div>
  );
}
