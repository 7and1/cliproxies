import { Button } from "./button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
    onClick?: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      {Icon && (
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-8 w-8 text-primary" />
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
      {action && (
        <Button asChild className="mt-6 min-h-[44px]">
          {action.href ? (
            <a href={action.href}>{action.label}</a>
          ) : (
            <button type="button" onClick={action.onClick}>
              {action.label}
            </button>
          )}
        </Button>
      )}
    </div>
  );
}
