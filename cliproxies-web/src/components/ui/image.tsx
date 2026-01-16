import Image, { ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends Omit<ImageProps, "blurDataURL"> {
  blurClassName?: string;
}

/**
 * Optimized image component with automatic blur placeholder and loading states.
 * Uses Next.js Image with proper optimization for remote and local images.
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  blurClassName,
  priority = false,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        className={cn("bg-muted flex items-center justify-center", className)}
        style={{ width, height }}
        role="img"
        aria-label={alt}
      >
        <span className="text-muted-foreground text-xs">
          Image not available
        </span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {isLoading && (
        <div
          className={cn(
            "absolute inset-0 bg-muted animate-pulse",
            blurClassName,
          )}
          aria-hidden="true"
        />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setError(true);
        }}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        {...props}
      />
    </div>
  );
}

/**
 * Avatar component optimized for user avatars with fallback support.
 */
export function Avatar({
  src,
  alt,
  initials,
  size = "md",
}: {
  src?: string;
  alt: string;
  initials?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const sizes = {
    sm: { width: 32, height: 32, className: "h-8 w-8 text-xs" },
    md: { width: 64, height: 64, className: "h-16 w-16 text-sm" },
    lg: { width: 96, height: 96, className: "h-24 w-24 text-base" },
    xl: { width: 128, height: 128, className: "h-32 w-32 text-lg" },
  };

  const { width, height, className: sizeClass } = sizes[size];

  if (!src || hasError) {
    return (
      <div
        className={cn(
          "rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium",
          sizeClass,
        )}
        role="img"
        aria-label={alt}
      >
        {initials || alt.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <div className={cn("rounded-full overflow-hidden relative", sizeClass)}>
      {isLoading && (
        <div
          className={cn("absolute inset-0 bg-muted animate-pulse rounded-full")}
          aria-hidden="true"
        />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          "transition-opacity duration-300 rounded-full",
          isLoading ? "opacity-0" : "opacity-100",
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        sizes="(max-width: 640px) 32px, 64px"
      />
    </div>
  );
}
