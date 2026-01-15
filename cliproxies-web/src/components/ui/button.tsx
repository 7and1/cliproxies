import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 shadow-sm hover:shadow-md",
        outline:
          "border border-border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground hover:border-accent dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-xs",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline focus-visible:underline",
        success:
          "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md dark:bg-emerald-600 dark:hover:bg-emerald-700",
        warning:
          "bg-amber-500 text-white hover:bg-amber-600 shadow-sm hover:shadow-md dark:bg-amber-500 dark:hover:bg-amber-600",
        info: "bg-sky-500 text-white hover:bg-sky-600 shadow-sm hover:shadow-md dark:bg-sky-500 dark:hover:bg-sky-600",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3 min-h-[44px]",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 min-h-[36px]",
        lg: "h-12 rounded-md px-6 has-[>svg]:px-4 min-h-[48px]",
        icon: "size-10 min-h-[44px] min-w-[44px]",
        "icon-sm": "size-8 rounded-md min-h-[36px] min-w-[36px]",
        "icon-lg": "size-12 min-h-[48px] min-w-[48px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      loadingText,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        aria-disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {loadingText ?? "Loading..."}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
