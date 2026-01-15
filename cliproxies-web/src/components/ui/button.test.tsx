import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";

describe("Button component", () => {
  describe("rendering", () => {
    it("renders children correctly", () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole("button")).toHaveTextContent("Click me");
    });

    it("renders as button by default", () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole("button");
      expect(button.tagName).toBe("BUTTON");
    });

    it("applies default variant classes", () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-primary");
    });

    it("applies default size classes", () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-9");
    });
  });

  describe("variants", () => {
    it("applies default variant", () => {
      render(<Button variant="default">Test</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-primary");
    });

    it("applies destructive variant", () => {
      render(<Button variant="destructive">Test</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-destructive");
    });

    it("applies outline variant", () => {
      render(<Button variant="outline">Test</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("border");
    });

    it("applies secondary variant", () => {
      render(<Button variant="secondary">Test</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-secondary");
    });

    it("applies ghost variant", () => {
      render(<Button variant="ghost">Test</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("hover:bg-accent");
    });

    it("applies link variant", () => {
      render(<Button variant="link">Test</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-primary");
      expect(button).toHaveClass("underline");
    });
  });

  describe("sizes", () => {
    it("applies default size", () => {
      render(<Button size="default">Test</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-9");
    });

    it("applies sm size", () => {
      render(<Button size="sm">Test</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-8");
    });

    it("applies lg size", () => {
      render(<Button size="lg">Test</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-10");
    });

    it("applies icon size", () => {
      render(<Button size="icon">Test</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("size-9");
    });

    it("applies icon-sm size", () => {
      render(<Button size="icon-sm">Test</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("size-8");
    });

    it("applies icon-lg size", () => {
      render(<Button size="icon-lg">Test</Button>);
      const button = screen.getByRole("button");
      expect button).toHaveClass("size-10");
    });
  });

  describe("custom className", () => {
    it("merges custom className with base classes", () => {
      render(<Button className="custom-class">Test</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
      expect(button).toHaveClass("bg-primary");
    });

    it("handles multiple custom classes", () => {
      render(<Button className="class1 class2">Test</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("class1");
      expect(button).toHaveClass("class2");
    });
  });

  describe("props", () => {
    it("passes through standard button props", () => {
      render(
        <Button type="submit" disabled>
          Submit
        </Button>,
      );
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "submit");
      expect(button).toBeDisabled();
    });

    it("passes through data attributes", () => {
      render(<Button data-testid="custom-button">Test</Button>);
      const button = screen.getByTestId("custom-button");
      expect(button).toBeInTheDocument();
    });

    it("handles click events", () => {
      let clicked = false;
      const handleClick = () => {
        clicked = true;
      };

      render(<Button onClick={handleClick}>Click me</Button>);
      screen.getByRole("button").click();
      expect(clicked).toBe(true);
    });

    it("can be focused", () => {
      render(<Button>Focus me</Button>);
      const button = screen.getByRole("button");
      button.focus();
      expect(button).toHaveFocus();
    });
  });

  describe("disabled state", () => {
    it("applies disabled styling", () => {
      render(<Button disabled>Test</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("disabled:opacity-50");
      expect(button).toHaveClass("disabled:pointer-events-none");
    });

    it("prevents click when disabled", () => {
      let clicked = false;
      const handleClick = () => {
        clicked = true;
      };

      render(
        <Button disabled onClick={handleClick}>
          Test
        </Button>,
      );
      screen.getByRole("button").click();
      expect(clicked).toBe(false);
    });
  });

  describe("accessibility", () => {
    it("has accessible name", () => {
      render(<Button>Submit Form</Button>);
      const button = screen.getByRole("button", { name: "Submit Form" });
      expect(button).toBeInTheDocument();
    });

    it("supports aria-label", () => {
      render(<Button aria-label="Close dialog">X</Button>);
      const button = screen.getByRole("button", { name: "Close dialog" });
      expect(button).toBeInTheDocument();
    });

    it("supports aria-describedby", () => {
      render(
        <>
          <span id="description">Additional info</span>
          <Button aria-describedby="description">Test</Button>
        </>,
      );
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-describedby", "description");
    });

    it("has visible focus indicator", () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("focus-visible:ring-[3px]");
    });
  });

  describe("with icons", () => {
    it("renders icon alongside text", () => {
      render(
        <Button>
          <span data-testid="icon">→</span>
          Continue
        </Button>,
      );
      expect(screen.getByTestId("icon")).toBeInTheDocument();
      expect(screen.getByRole("button")).toHaveTextContent("Continue");
    });

    it("renders icon-only button", () => {
      render(
        <Button size="icon">
          <span data-testid="icon">+</span>
        </Button>,
      );
      expect(screen.getByRole("button")).toBeInTheDocument();
      expect(screen.getByTestId("icon")).toBeInTheDocument();
    });
  });

  describe("asChild prop", () => {
    it("renders as child component when asChild is true", () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>,
      );
      // When using asChild with Slot, the element becomes an anchor
      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/test");
    });

    it("applies button styles to child element", () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>,
      );
      const link = screen.getByRole("link");
      // Should have button variant classes
      expect(link).toHaveClass("bg-primary");
    });
  });
});
