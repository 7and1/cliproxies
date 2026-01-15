"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Toast variants for styling
const toastVariants = cva(
  "pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all duration-300",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground shadow-md",
        destructive:
          "group border-destructive bg-destructive text-destructive-foreground shadow-md",
        success:
          "border-emerald-500/50 bg-emerald-500/10 text-emerald-200 shadow-md",
        warning: "border-amber-500/50 bg-amber-500/10 text-amber-200 shadow-md",
        info: "border-sky-500/50 bg-sky-500/10 text-sky-200 shadow-md",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface ToastProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  icon?: React.ReactNode;
}

interface ToastTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
interface ToastDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(toastVariants({ variant }), className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Toast.displayName = "Toast";

const ToastTitle = React.forwardRef<HTMLHeadingElement, ToastTitleProps>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn("text-sm font-semibold", className)}
      {...props}
    />
  ),
);
ToastTitle.displayName = "ToastTitle";

const ToastDescription = React.forwardRef<
  HTMLParagraphElement,
  ToastDescriptionProps
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm opacity-90", className)} {...props} />
));
ToastDescription.displayName = "ToastDescription";

const ToastClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 min-h-[28px] min-w-[28px] flex items-center justify-center",
      className,
    )}
    {...props}
  >
    <X className="h-4 w-4" />
  </button>
));
ToastClose.displayName = "ToastClose";

type ToasterProps = React.HTMLAttributes<HTMLDivElement>;

// Export Toaster as a fragment for now (placeholder)
const Toaster = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
);

export {
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  Toaster,
  type ToastProps,
  type ToasterProps,
};

export { toastVariants };
export type { VariantProps };
