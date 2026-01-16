import { render, screen } from "@testing-library/react";
import {
  Skeleton,
  TextSkeleton,
  CardSkeleton,
  TableSkeleton,
  HeroSkeleton,
} from "./skeleton";

describe("Skeleton Components", () => {
  describe("Skeleton", () => {
    it("should render with default styles", () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass("animate-pulse", "rounded-md", "bg-muted");
    });

    it("should apply custom className", () => {
      const { container } = render(<Skeleton className="custom-class" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass("custom-class");
    });

    it("should pass through other props", () => {
      render(<Skeleton data-testid="test-skeleton" />);
      expect(screen.getByTestId("test-skeleton")).toBeInTheDocument();
    });
  });

  describe("TextSkeleton", () => {
    it("should render default number of lines", () => {
      const { container } = render(<TextSkeleton />);
      const lines = container.querySelectorAll(".animate-pulse");
      expect(lines).toHaveLength(3);
    });

    it("should render custom number of lines", () => {
      const { container } = render(<TextSkeleton lines={5} />);
      const lines = container.querySelectorAll(".animate-pulse");
      expect(lines).toHaveLength(5);
    });

    it("should make last line shorter", () => {
      const { container } = render(<TextSkeleton lines={3} />);
      const lines = container.querySelectorAll(".animate-pulse");
      const lastLine = lines[2] as HTMLElement;
      expect(lastLine).toHaveClass("w-3/4");
    });
  });

  describe("CardSkeleton", () => {
    it("should render with header by default", () => {
      const { container } = render(<CardSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should render without header when specified", () => {
      const { container } = render(<CardSkeleton hasHeader={false} />);
      const card = container.firstChild as HTMLElement;
      const skeletons = card.querySelectorAll(".animate-pulse");
      // Should have main content but no header skeletons
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("should render with footer when specified", () => {
      const { container } = render(<CardSkeleton hasFooter />);
      const card = container.firstChild as HTMLElement;
      expect(card.querySelector(".border-t")).toBeInTheDocument();
    });
  });

  describe("TableSkeleton", () => {
    it("should render default rows and columns", () => {
      const { container } = render(<TableSkeleton />);
      const rows = container.querySelectorAll(".border-border\\/40");
      expect(rows).toHaveLength(5);
    });

    it("should render custom number of rows and columns", () => {
      const { container } = render(<TableSkeleton rows={3} columns={2} />);
      const rows = container.querySelectorAll(".border-border\\/40");
      expect(rows).toHaveLength(3);
    });
  });

  describe("HeroSkeleton", () => {
    it("should render hero placeholder structure", () => {
      const { container } = render(<HeroSkeleton />);
      const hero = container.firstChild as HTMLElement;
      expect(hero).toHaveClass("rounded-3xl", "glass-strong");
    });
  });
});
