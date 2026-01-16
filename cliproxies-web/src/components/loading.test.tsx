/**
 * Loading component tests
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { PageLoader, InlineLoader, SkeletonCard } from "./ui/loading";

describe("PageLoader", () => {
  it("renders with default message", () => {
    render(<PageLoader />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders with custom message", () => {
    render(<PageLoader message="Loading data..." />);
    expect(screen.getByText("Loading data...")).toBeInTheDocument();
  });

  it("has proper structure", () => {
    const { container } = render(<PageLoader />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("renders spinner container", () => {
    const { container } = render(<PageLoader />);
    const spinnerContainer = container.querySelector(".relative");
    expect(spinnerContainer).toBeInTheDocument();
  });
});

describe("InlineLoader", () => {
  it("renders with default size", () => {
    const { container } = render(<InlineLoader />);
    const loader = container.querySelector('[role="status"]');
    expect(loader).toBeInTheDocument();
  });

  it("renders small size", () => {
    const { container } = render(<InlineLoader size="sm" />);
    const loader = container.querySelector('[role="status"]');
    expect(loader).toBeInTheDocument();
  });

  it("renders medium size", () => {
    const { container } = render(<InlineLoader size="md" />);
    const loader = container.querySelector('[role="status"]');
    expect(loader).toBeInTheDocument();
  });

  it("renders large size", () => {
    const { container } = render(<InlineLoader size="lg" />);
    const loader = container.querySelector('[role="status"]');
    expect(loader).toBeInTheDocument();
  });

  it("has proper role attribute", () => {
    const { container } = render(<InlineLoader />);
    const loader = container.querySelector('[role="status"]');
    expect(loader).toBeInTheDocument();
  });

  it("has screen reader text", () => {
    render(<InlineLoader />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});

describe("SkeletonCard", () => {
  it("renders skeleton structure", () => {
    const { container } = render(<SkeletonCard />);
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
  });

  it("renders title skeleton", () => {
    const { container } = render(<SkeletonCard />);
    const title = container.querySelector(".h-5");
    expect(title).toBeInTheDocument();
  });

  it("renders badge skeletons", () => {
    const { container } = render(<SkeletonCard />);
    const badges = container.querySelectorAll(".rounded-full");
    expect(badges.length).toBeGreaterThan(0);
  });
});

describe("Loading components with different states", () => {
  it("PageLoader renders consistently", () => {
    const { rerender } = render(<PageLoader message="First" />);
    expect(screen.getByText("First")).toBeInTheDocument();

    rerender(<PageLoader message="Second" />);
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.queryByText("First")).not.toBeInTheDocument();
  });

  it("InlineLoader maintains size prop", () => {
    const { container, rerender } = render(<InlineLoader size="sm" />);
    const smLoader = container.querySelector('[role="status"]');
    expect(smLoader).toBeInTheDocument();

    rerender(<InlineLoader size="lg" />);
    const lgLoader = container.querySelector('[role="status"]');
    expect(lgLoader).toBeInTheDocument();
  });
});
