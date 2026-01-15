import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./badge";

describe("Badge component", () => {
  describe("rendering", () => {
    it("renders children correctly", () => {
      render(<Badge>New</Badge>);
      expect(screen.getByText("New")).toBeInTheDocument();
    });

    it("renders as span by default", () => {
      render(<Badge>Test</Badge>);
      const badge = screen.getByText("Test");
      expect(badge.tagName).toBe("SPAN");
    });

    it("applies default variant classes", () => {
      render(<Badge>Test</Badge>);
      const badge = screen.getByText("Test");
      expect(badge).toHaveClass("bg-primary");
      expect(badge).toHaveClass("text-primary-foreground");
    });
  });

  describe("variants", () => {
    it("applies default variant", () => {
      render(<Badge variant="default">Test</Badge>);
      const badge = screen.getByText("Test");
      expect(badge).toHaveClass("bg-primary");
      expect(badge).toHaveClass("border-transparent");
    });

    it("applies secondary variant", () => {
      render(<Badge variant="secondary">Test</Badge>);
      const badge = screen.getByText("Test");
      expect(badge).toHaveClass("bg-secondary");
      expect(badge).toHaveClass("text-secondary-foreground");
    });

    it("applies destructive variant", () => {
      render(<Badge variant="destructive">Test</Badge>);
      const badge = screen.getByText("Test");
      expect(badge).toHaveClass("bg-destructive");
      expect(badge).toHaveClass("text-white");
    });

    it("applies outline variant", () => {
      render(<Badge variant="outline">Test</Badge>);
      const badge = screen.getByText("Test");
      expect(badge).toHaveClass("text-foreground");
      // Outline should not have background
      expect(badge).not.toHaveClass("bg-primary");
    });
  });

  describe("custom className", () => {
    it("merges custom className with base classes", () => {
      render(<Badge className="custom-class">Test</Badge>);
      const badge = screen.getByText("Test");
      expect(badge).toHaveClass("custom-class");
      expect(badge).toHaveClass("bg-primary");
    });

    it("handles multiple custom classes", () => {
      render(<Badge className="class1 class2">Test</Badge>);
      const badge = screen.getByText("Test");
      expect(badge).toHaveClass("class1");
      expect(badge).toHaveClass("class2");
    });
  });

  describe("styling", () => {
    it("has rounded-full border", () => {
      render(<Badge>Test</Badge>);
      const badge = screen.getByText("Test");
      expect(badge).toHaveClass("rounded-full");
      expect(badge).toHaveClass("border");
    });

    it("has small text size", () => {
      render(<Badge>Test</Badge>);
      const badge = screen.getByText("Test");
      expect(badge).toHaveClass("text-xs");
    });

    it("has font-medium", () => {
      render(<Badge>Test</Badge>);
      const badge = screen.getByText("Test");
      expect(badge).toHaveClass("font-medium");
    });

    it("has inline-flex display", () => {
      render(<Badge>Test</Badge>);
      const badge = screen.getByText("Test");
      expect(badge).toHaveClass("inline-flex");
    });
  });

  describe("props", () => {
    it("passes through data attributes", () => {
      render(<Badge data-testid="custom-badge">Test</Badge>);
      const badge = screen.getByTestId("custom-badge");
      expect(badge).toBeInTheDocument();
    });

    it("passes through standard HTML props", () => {
      render(
        <Badge id="my-badge" title="Badge title">
          Test
        </Badge>,
      );
      const badge = screen.getByText("Test");
      expect(badge).toHaveAttribute("id", "my-badge");
      expect(badge).toHaveAttribute("title", "Badge title");
    });
  });

  describe("accessibility", () => {
    it("has accessible text content", () => {
      render(<Badge>New Feature</Badge>);
      const badge = screen.getByText("New Feature");
      expect(badge).toBeInTheDocument();
    });

    it("supports aria-label", () => {
      render(<Badge aria-label="3 notifications">3</Badge>);
      const badge = screen.getByLabelText("3 notifications");
      expect(badge).toBeInTheDocument();
    });

    it("has visible focus indicator", () => {
      render(<Badge>Test</Badge>);
      const badge = screen.getByText("Test");
      expect(badge).toHaveClass("focus-visible:ring-[3px]");
    });
  });

  describe("with icons", () => {
    it("renders icon alongside text", () => {
      render(
        <Badge>
          <span data-testid="icon">●</span>
          Active
        </Badge>,
      );
      expect(screen.getByTestId("icon")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("renders icon-only badge", () => {
      render(
        <Badge>
          <span data-testid="icon">●</span>
        </Badge>,
      );
      expect(screen.getByTestId("icon")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("handles empty content", () => {
      render(<Badge></Badge>);
      const badge = screen.queryByRole("generic");
      expect(badge).toBeInTheDocument();
    });

    it("handles long text content", () => {
      render(<Badge>This is a very long badge text that might overflow</Badge>);
      const badge = screen.getByText(
        "This is a very long badge text that might overflow",
      );
      expect(badge).toHaveClass("whitespace-nowrap");
    });

    it("handles special characters", () => {
      render(<Badge>Test & "demo"</Badge>);
      const badge = screen.getByText('Test & "demo"');
      expect(badge).toBeInTheDocument();
    });

    it("handles numbers", () => {
      render(<Badge>42</Badge>);
      const badge = screen.getByText("42");
      expect(badge).toBeInTheDocument();
    });
  });

  describe("asChild prop", () => {
    it("renders as child component when asChild is true", () => {
      render(
        <Badge asChild>
          <a href="/tag">Tag Link</a>
        </Badge>,
      );
      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/tag");
    });

    it("applies badge styles to child element", () => {
      render(
        <Badge asChild>
          <span>Custom Badge</span>
        </Badge>,
      );
      const span = screen.getByText("Custom Badge");
      expect(span).toHaveClass("bg-primary");
      expect(span).toHaveClass("rounded-full");
    });
  });

  describe("data attributes", () => {
    it("includes data-slot attribute", () => {
      render(<Badge>Test</Badge>);
      const badge = screen.getByText("Test");
      expect(badge).toHaveAttribute("data-slot", "badge");
    });

    it("includes data-variant attribute", () => {
      render(<Badge variant="secondary">Test</Badge>);
      const badge = screen.getByText("Test");
      expect(badge).toHaveAttribute("data-variant", "secondary");
    });
  });

  describe("visual consistency", () => {
    it("has consistent padding across variants", () => {
      const { rerender } = render(<Badge variant="default">Test</Badge>);
      const defaultBadge = screen.getByText("Test");
      const defaultClasses = defaultBadge.className;

      rerender(<Badge variant="outline">Test</Badge>);
      const outlineBadge = screen.getByText("Test");

      // Both should have padding classes
      expect(defaultClasses).toContain("px-2");
      expect(outlineBadge.className).toContain("px-2");
    });
  });
});
