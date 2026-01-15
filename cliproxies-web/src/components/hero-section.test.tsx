import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroSection } from "./hero-section";

// Mock the useOS hook
vi.mock("@/hooks/use-os", () => ({
  useOS: () => "mac",
}));

describe("HeroSection component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders the main heading", () => {
      render(<HeroSection />);
      expect(
        screen.getByRole("heading", { level: 1, name: /the hub for/i }),
      ).toBeInTheDocument();
    });

    it("renders the gradient text span", () => {
      render(<HeroSection />);
      const gradient = screen.getByText("AI proxy tooling");
      expect(gradient).toBeInTheDocument();
      expect(gradient.className).toContain("bg-gradient-to-r");
    });

    it("renders the description text", () => {
      render(<HeroSection />);
      expect(
        screen.getByText(/find production-ready clients/i),
      ).toBeInTheDocument();
    });

    it("renders the ecosystem badge", () => {
      render(<HeroSection />);
      expect(screen.getByText("CLIProxyAPI ecosystem")).toBeInTheDocument();
    });

    it("renders all feature cards", () => {
      render(<HeroSection />);
      expect(screen.getByText("Docs")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Config")).toBeInTheDocument();
    });

    it("renders feature descriptions", () => {
      render(<HeroSection />);
      expect(
        screen.getByText(/reference guides at help.router-for.me/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/monitor openai, anthropic, and google status/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/download a standardized config.yaml/i),
      ).toBeInTheDocument();
    });

    it("renders the documentation link", () => {
      render(<HeroSection />);
      const link = screen.getByRole("link", {
        name: /view full documentation/i,
      });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "https://help.router-for.me");
      expect(link).toHaveAttribute("target", "_blank");
    });
  });

  describe("CTA buttons", () => {
    it("renders primary CTA button", () => {
      render(<HeroSection />);
      const primaryBtn = screen.getByRole("link", {
        name: /explore mac apps/i,
      });
      expect(primaryBtn).toBeInTheDocument();
      expect(primaryBtn).toHaveAttribute("href", "/apps?platform=mac");
    });

    it("renders secondary CTA button", () => {
      render(<HeroSection />);
      const secondaryBtn = screen.getByRole("link", {
        name: /get config.yaml/i,
      });
      expect(secondaryBtn).toBeInTheDocument();
      expect(secondaryBtn).toHaveAttribute("href", "/#config");
    });

    it("renders arrow icon in primary button", () => {
      render(<HeroSection />);
      const primaryBtn = screen.getByRole("link", {
        name: /explore mac apps/i,
      });
      // Arrow icon should be present (checked via aria-hidden or data-testid)
      const icon = primaryBtn.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("has section element with aria-labelledby", () => {
      render(<HeroSection />);
      const section = screen.getByRole("region", { name: "" });
      const heroSection = document.querySelector(
        'section[aria-labelledby="hero-heading"]',
      );
      expect(heroSection).toBeInTheDocument();
    });

    it("has rounded corners styling", () => {
      render(<HeroSection />);
      const section = document.querySelector(
        'section[aria-labelledby="hero-heading"]',
      );
      expect(section).toHaveClass("rounded-3xl");
    });

    it("has border styling", () => {
      render(<HeroSection />);
      const section = document.querySelector(
        'section[aria-labelledby="hero-heading"]',
      );
      expect(section).toHaveClass("border");
    });

    it("has shadow styling", () => {
      render(<HeroSection />);
      const section = document.querySelector(
        'section[aria-labelledby="hero-heading"]',
      );
      expect(section).toHaveClass("shadow-2xl");
    });
  });

  describe("background effects", () => {
    it("renders animated background elements", () => {
      render(<HeroSection />);
      const blobs = document.querySelectorAll(".animate-pulse-slow");
      expect(blobs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("feature cards", () => {
    it("renders feature cards with icons", () => {
      render(<HeroSection />);
      // Icons are rendered within feature cards
      const icons = document.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it("feature cards have hover effects", () => {
      render(<HeroSection />);
      const cards = document.querySelectorAll(".group");
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe("accessibility", () => {
    it("has proper heading structure", () => {
      render(<HeroSection />);
      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1).toBeInTheDocument();
      expect(h1).toHaveAttribute("id", "hero-heading");
    });

    it("buttons are keyboard accessible", () => {
      render(<HeroSection />);
      const buttons = screen.getAllByRole("link");
      buttons.forEach((button) => {
        expect(button.tagName).toBe("A");
      });
    });

    it("feature cards have proper labels", () => {
      render(<HeroSection />);
      const featureSections = screen.getAllByText(/docs|status|config/i);
      expect(featureSections.length).toBeGreaterThan(0);
    });
  });

  describe("layout", () => {
    it("uses responsive grid layout", () => {
      render(<HeroSection />);
      const section = document.querySelector(
        'section[aria-labelledby="hero-heading"]',
      );
      const grid = section?.querySelector(".grid");
      expect(grid).toBeInTheDocument();
    });

    it("has proper spacing classes", () => {
      render(<HeroSection />);
      const section = document.querySelector(
        'section[aria-labelledby="hero-heading"]',
      );
      expect(section).toHaveClass("gap-8");
      expect(section?.querySelector(".md\\:grid-cols")).toBeInTheDocument();
    });
  });

  describe("external links", () => {
    it("documentation link has security attributes", () => {
      render(<HeroSection />);
      const link = screen.getByRole("link", {
        name: /view full documentation/i,
      });
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("external link opens in new tab", () => {
      render(<HeroSection />);
      const link = screen.getByRole("link", {
        name: /view full documentation/i,
      });
      expect(link).toHaveAttribute("target", "_blank");
    });
  });

  describe("responsive design", () => {
    it("has responsive padding", () => {
      render(<HeroSection />);
      const section = document.querySelector(
        'section[aria-labelledby="hero-heading"]',
      );
      expect(section).toHaveClass("px-6");
      expect(section).toHaveClass("md:px-10");
    });

    it("has responsive text sizing", () => {
      render(<HeroSection />);
      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1.className).toMatch(/text-4xl.*md:text-5xl.*lg:text-6xl/);
    });
  });

  describe("color scheme", () => {
    it("uses primary color for gradient text", () => {
      render(<HeroSection />);
      const gradientText = screen.getByText("AI proxy tooling");
      expect(gradientText.className).toContain("from-primary");
    });

    it("uses secondary color for badge", () => {
      render(<HeroSection />);
      const badge = screen.getByText("CLIProxyAPI ecosystem");
      expect(badge.className).toContain("variant-secondary");
    });
  });
});
