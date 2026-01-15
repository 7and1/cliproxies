import { render, RenderOptions } from "@testing-library/react";
import { ReactElement } from "react";

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  // Add custom providers here if needed
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions,
) {
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    // Add providers here (Zustand, Theme, etc.)
    return <>{children}</>;
  };

  return render(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything from testing-library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
