import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90 shadow-sm",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive dark:bg-destructive/60 shadow-sm",
        outline:
          "text-foreground border-border [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        success:
          "border-transparent bg-emerald-600 text-white [a&]:hover:bg-emerald-700 shadow-sm",
        warning:
          "border-transparent bg-amber-500 text-white [a&]:hover:bg-amber-600 shadow-sm",
        info: "border-transparent bg-sky-500 text-white [a&]:hover:bg-sky-600 shadow-sm",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface BadgeProps
  extends React.ComponentProps<"span">, VariantProps<typeof badgeVariants> {
  asChild?: boolean;
  dot?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { className, variant, size, asChild = false, dot, children, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "span";

    return (
      <Comp
        ref={ref}
        data-slot="badge"
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full animate-pulse",
              variant === "success" && "bg-emerald-200",
              variant === "warning" && "bg-amber-200",
              variant === "destructive" && "bg-red-200",
              variant === "info" && "bg-sky-200",
              variant === "default" && "bg-primary-foreground/50",
              !variant && "bg-primary-foreground/50",
            )}
            aria-hidden="true"
          />
        )}
        {children}
      </Comp>
    );
  },
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };
