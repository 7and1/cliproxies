import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppCard } from "./app-card";
import type { App } from "@/data/types";

describe("AppCard component", () => {
  const mockApp: App = {
    id: "test-app",
    name: "Test Application",
    description: "A test application for unit testing",
    platforms: ["mac", "windows"],
    tags: ["CLI", "Developer Tools"],
    repo: "https://github.com/test/repo",
    featured: true,
    isPort: false,
  };

  describe("rendering", () => {
    it("renders app name", () => {
      render(<AppCard app={mockApp} />);
      expect(screen.getByText("Test Application")).toBeInTheDocument();
    });

    it("renders app description", () => {
      render(<AppCard app={mockApp} />);
      expect(
        screen.getByText("A test application for unit testing"),
      ).toBeInTheDocument();
    });

    it("renders all platforms as badges", () => {
      render(<AppCard app={mockApp} />);
      expect(screen.getByText("mac")).toBeInTheDocument();
      expect(screen.getByText("windows")).toBeInTheDocument();
    });

    it("renders all tags as badges", () => {
      render(<AppCard app={mockApp} />);
      expect(screen.getByText("CLI")).toBeInTheDocument();
      expect(screen.getByText("Developer Tools")).toBeInTheDocument();
    });

    it("renders GitHub link", () => {
      render(<AppCard app={mockApp} />);
      const link = screen.getByRole("link", { name: /view.*github/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "https://github.com/test/repo");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("badges", () => {
    it("shows Featured badge when app is featured", () => {
      render(<AppCard app={mockApp} />);
      expect(screen.getByText("Featured")).toBeInTheDocument();
    });

    it("shows Port badge when app is a port", () => {
      const portApp = { ...mockApp, isPort: true };
      render(<AppCard app={portApp} />);
      expect(screen.getByText("Port")).toBeInTheDocument();
    });

    it("does not show Featured badge when not featured", () => {
      const nonFeaturedApp = { ...mockApp, featured: false };
      render(<AppCard app={nonFeaturedApp} />);
      expect(screen.queryByText("Featured")).not.toBeInTheDocument();
    });

    it("does not show Port badge when not a port", () => {
      const nonPortApp = { ...mockApp, isPort: false };
      render(<AppCard app={nonPortApp} />);
      expect(screen.queryByText("Port")).not.toBeInTheDocument();
    });

    it("shows both Featured and Port badges when applicable", () => {
      const bothApp = { ...mockApp, featured: true, isPort: true };
      render(<AppCard app={bothApp} />);
      expect(screen.getByText("Featured")).toBeInTheDocument();
      expect(screen.getByText("Port")).toBeInTheDocument();
    });
  });

  describe("stars display", () => {
    it("does not show stars when not provided", () => {
      render(<AppCard app={mockApp} />);
      const starIcon = screen.queryByTestId("star-icon");
      expect(starIcon).not.toBeInTheDocument();
    });

    it("shows stars when provided", () => {
      render(<AppCard app={mockApp} stars={1234} />);
      expect(screen.getByText("1234")).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("has card styling classes", () => {
      render(<AppCard app={mockApp} />);
      const card = screen.getByText("Test Application").closest("[itemScope]");
      expect(card).toHaveClass("border");
      expect(card).toHaveClass("bg-card/70");
      expect(card).toHaveClass("rounded-xl");
    });

    it("has group class for hover effects", () => {
      render(<AppCard app={mockApp} />);
      const card = screen.getByText("Test Application").closest("[itemScope]");
      expect(card).toHaveClass("group");
    });

    it("has transition classes", () => {
      render(<AppCard app={mockApp} />);
      const card = screen.getByText("Test Application").closest("[itemScope]");
      expect(card).toHaveClass("transition-all");
    });
  });

  describe("microdata (schema.org)", () => {
    it("includes SoftwareApplication schema", () => {
      render(<AppCard app={mockApp} />);
      const card = screen.getByText("Test Application").closest("[itemScope]");
      expect(card).toHaveAttribute("itemscope");
      expect(card).toHaveAttribute(
        "itemtype",
        "https://schema.org/SoftwareApplication",
      );
    });

    it("includes app name as schema property", () => {
      render(<AppCard app={mockApp} />);
      const name = screen.getByText("Test Application");
      expect(name).toHaveAttribute("itemprop", "name");
    });

    it("includes description as schema property", () => {
      render(<AppCard app={mockApp} />);
      const description = screen.getByText(
        "A test application for unit testing",
      );
      expect(description).toHaveAttribute("itemprop", "description");
    });

    it("includes URL meta tag", () => {
      render(<AppCard app={mockApp} />);
      const link = document.querySelector("link[itemprop='url']");
      expect(link).toHaveAttribute("href", "https://github.com/test/repo");
    });

    it("includes operating system meta tag", () => {
      render(<AppCard app={mockApp} />);
      const os = document.querySelector("meta[itemprop='operatingSystem']");
      expect(os).toHaveAttribute("content", "mac, windows");
    });

    it("includes application category meta tag", () => {
      render(<AppCard app={mockApp} />);
      const category = document.querySelector(
        "meta[itemprop='applicationCategory']",
      );
      expect(category).toHaveAttribute("content", "DeveloperApplication");
    });

    it("includes rating meta when stars provided", () => {
      render(<AppCard app={mockApp} stars={5000} />);
      const rating = document.querySelector("meta[itemprop='ratingValue']");
      expect(rating).toHaveAttribute("content", "5000");
    });
  });

  describe("platform badges", () => {
    it("displays all platform variants", () => {
      const allPlatformsApp: App = {
        ...mockApp,
        platforms: ["mac", "windows", "linux", "web"],
      };
      render(<AppCard app={allPlatformsApp} />);

      expect(screen.getByText("mac")).toBeInTheDocument();
      expect(screen.getByText("windows")).toBeInTheDocument();
      expect(screen.getByText("linux")).toBeInTheDocument();
      expect(screen.getByText("web")).toBeInTheDocument();
    });

    it("handles single platform", () => {
      const singlePlatformApp: App = {
        ...mockApp,
        platforms: ["mac"],
      };
      render(<AppCard app={singlePlatformApp} />);
      expect(screen.getByText("mac")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has accessible GitHub link text", () => {
      render(<AppCard app={mockApp} />);
      const link = screen.getByRole("link", {
        name: /view test application on github/i,
      });
      expect(link).toBeInTheDocument();
    });

    it("link opens in new tab with proper security attributes", () => {
      render(<AppCard app={mockApp} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("edge cases", () => {
    it("handles app with no tags", () => {
      const noTagsApp: App = {
        ...mockApp,
        tags: [],
      };
      render(<AppCard app={noTagsApp} />);
      // Should still render the card
      expect(screen.getByText("Test Application")).toBeInTheDocument();
    });

    it("handles app with no platforms", () => {
      const noPlatformsApp: App = {
        ...mockApp,
        platforms: [],
      };
      render(<AppCard app={noPlatformsApp} />);
      expect(screen.getByText("Test Application")).toBeInTheDocument();
    });

    it("handles very long descriptions", () => {
      const longDescApp: App = {
        ...mockApp,
        description: "A".repeat(500),
      };
      render(<AppCard app={longDescApp} />);
      expect(screen.getByText(new RegExp("^A+$"))).toBeInTheDocument();
    });

    it("handles special characters in name", () => {
      const specialNameApp: App = {
        ...mockApp,
        name: 'App with <special> & "characters"',
      };
      render(<AppCard app={specialNameApp} />);
      expect(
        screen.getByText('App with <special> & "characters"'),
      ).toBeInTheDocument();
    });

    it("handles repo with trailing slash", () => {
      const trailingSlashApp: App = {
        ...mockApp,
        repo: "https://github.com/test/repo/",
      };
      render(<AppCard app={trailingSlashApp} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "https://github.com/test/repo/");
    });
  });

  describe("card layout", () => {
    it("maintains proper card structure", () => {
      const { container } = render(<AppCard app={mockApp} />);
      const card = container.querySelector("[itemScope]");
      expect(card).toBeInTheDocument();
      expect(card?.children.length).toBeGreaterThan(0);
    });

    it("renders content in correct order", () => {
      const { container } = render(<AppCard app={mockApp} />);
      const card = container.querySelector("[itemScope]");
      const children = Array.from(card?.children || []);

      // First section should have name and description
      expect(children[0].textContent).toContain("Test Application");
      expect(children[0].textContent).toContain("A test application");
    });
  });

  describe("custom className", () => {
    it("does not accept className prop (uses Card className)", () => {
      // The component uses Card component which handles className
      render(<AppCard app={mockApp} />);
      const card = screen.getByText("Test Application").closest("[itemScope]");
      expect(card).toBeInTheDocument();
    });
  });
});
