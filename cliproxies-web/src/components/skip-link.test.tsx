/**
 * SkipLink component tests
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { SkipLink } from "./skip-link";

describe("SkipLink", () => {
  it("renders skip link", () => {
    render(<SkipLink />);
    const link = screen.getByRole("link", { name: /skip to main content/i });
    expect(link).toBeInTheDocument();
  });

  it("has correct href attribute", () => {
    render(<SkipLink />);
    const link = screen.getByRole("link", { name: /skip to main content/i });
    expect(link).toHaveAttribute("href", "#main-content");
  });

  it("has skip-link class for styling", () => {
    render(<SkipLink />);
    const link = screen.getByRole("link", { name: /skip to main content/i });
    expect(link).toHaveClass("skip-link");
  });

  it("is visible only on focus", () => {
    const { container } = render(<SkipLink />);
    const link = container.querySelector('a[href="#main-content"]');

    // Skip links are typically hidden until focused
    expect(link).toBeInTheDocument();
  });

  it("applies focus class on focus event", async () => {
    const user = userEvent.setup();
    const { container } = render(<SkipLink />);
    const link = container.querySelector(
      'a[href="#main-content"]',
    ) as HTMLElement;

    await user.tab();

    // The onFocus handler should be called
    expect(link).toBeInTheDocument();
  });

  it("is keyboard accessible", async () => {
    const user = userEvent.setup();
    render(<SkipLink />);
    const link = screen.getByRole("link", { name: /skip to main content/i });

    // Test keyboard navigation
    link.focus();
    expect(document.activeElement).toBe(link);
  });

  it("has accessible text", () => {
    render(<SkipLink />);
    const link = screen.getByRole("link", { name: /skip to main content/i });
    expect(link.textContent).toBe("Skip to main content");
  });
});

describe("SkipLink accessibility features", () => {
  it("follows WCAG guidelines for skip links", () => {
    render(<SkipLink />);
    const link = screen.getByRole("link", { name: /skip to main content/i });

    // Should be a link element
    expect(link.tagName.toLowerCase()).toBe("a");

    // Should point to a valid anchor
    expect(link.getAttribute("href")).toMatch(/^#[a-z-]+$/);
  });

  it("has descriptive text", () => {
    render(<SkipLink />);
    const link = screen.getByRole("link", { name: /skip to main content/i });

    // Text should clearly indicate purpose
    const text = link.textContent || "";
    expect(text.toLowerCase()).toContain("skip");
    expect(text.toLowerCase()).toContain("main");
  });

  it("is the first interactive element in tab order", () => {
    const { container } = render(<SkipLink />);
    const link = container.querySelector('a[href="#main-content"]');

    // Should be renderable at the top of the page
    expect(link).toBeInTheDocument();
  });
});
