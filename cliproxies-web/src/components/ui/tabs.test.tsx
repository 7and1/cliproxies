import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";

describe("Tabs components", () => {
  describe("rendering", () => {
    it("renders all tab components", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      );

      expect(screen.getByRole("tab", { name: "Tab 1" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Tab 2" })).toBeInTheDocument();
      expect(screen.getByText("Content 1")).toBeVisible();
    });

    it("shows default tab content on mount", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      );

      expect(screen.getByText("Content 1")).toBeVisible();
      expect(screen.getByText("Content 2")).not.toBeVisible();
    });
  });

  describe("Tabs", () => {
    it("has data-slot attribute", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>,
      );
      const tabs = document.querySelector("[data-slot='tabs']");
      expect(tabs).toBeInTheDocument();
    });

    it("applies custom className", () => {
      render(
        <Tabs defaultValue="tab1" className="custom-tabs">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>,
      );
      const tabs = document.querySelector(".custom-tabs");
      expect(tabs).toBeInTheDocument();
    });
  });

  describe("TabsList", () => {
    it("has data-slot attribute", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList data-testid="tab-list">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>,
      );
      expect(screen.getByTestId("tab-list")).toHaveAttribute(
        "data-slot",
        "tabs-list",
      );
    });

    it("has proper styling classes", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>,
      );
      const list = document.querySelector("[data-slot='tabs-list']");
      expect(list).toHaveClass("bg-muted");
      expect(list).toHaveClass("rounded-lg");
    });

    it("applies custom className", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList className="custom-list">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>,
      );
      const list = document.querySelector(".custom-list");
      expect(list).toBeInTheDocument();
    });
  });

  describe("TabsTrigger", () => {
    it("renders as button with role tab", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>,
      );
      const trigger = screen.getByRole("tab", { name: "Tab 1" });
      expect(trigger.tagName).toBe("BUTTON");
    });

    it("has data-slot attribute", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>,
      );
      const trigger = screen.getByRole("tab", { name: "Tab 1" });
      expect(trigger).toHaveAttribute("data-slot", "tabs-trigger");
    });

    it("has selected state for active tab", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      );
      const trigger1 = screen.getByRole("tab", { name: "Tab 1" });
      const trigger2 = screen.getByRole("tab", { name: "Tab 2" });
      expect(trigger1).toHaveAttribute("data-state", "active");
      expect(trigger2).toHaveAttribute("data-state", "inactive");
    });
  });

  describe("TabsContent", () => {
    it("has data-slot attribute", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>,
      );
      const content = document.querySelector("[data-slot='tabs-content']");
      expect(content).toBeInTheDocument();
    });

    it("shows content when tab is active", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      );
      const content1 = screen.getByText("Content 1");
      const content2 = screen.getByText("Content 2");
      expect(content1).toHaveAttribute("data-state", "active");
      expect(content2).toHaveAttribute("data-state", "inactive");
    });
  });

  describe("user interactions", () => {
    it("switches tabs when clicking trigger", async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      );

      await user.click(screen.getByRole("tab", { name: "Tab 2" }));

      expect(screen.getByText("Content 2")).toBeVisible();
      expect(screen.getByText("Content 1")).not.toBeVisible();
    });

    it("switches between multiple tabs", async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>,
      );

      expect(screen.getByText("Content 1")).toBeVisible();

      await user.click(screen.getByRole("tab", { name: "Tab 2" }));
      expect(screen.getByText("Content 2")).toBeVisible();

      await user.click(screen.getByRole("tab", { name: "Tab 3" }));
      expect(screen.getByText("Content 3")).toBeVisible();

      await user.click(screen.getByRole("tab", { name: "Tab 1" }));
      expect(screen.getByText("Content 1")).toBeVisible();
    });
  });

  describe("accessibility", () => {
    it("has proper ARIA attributes", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList aria-label="Sample tabs">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      );

      const triggers = screen.getAllByRole("tab");
      expect(triggers).toHaveLength(2);

      const tabList = screen.getByRole("tablist");
      expect(tabList).toHaveAttribute("aria-label", "Sample tabs");
    });

    it("associates triggers with content via aria-controls", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      );

      const trigger1 = screen.getByRole("tab", { name: "Tab 1" });
      expect(trigger1).toHaveAttribute("aria-controls");
    });

    it("navigates with arrow keys", async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>,
      );

      const tab1 = screen.getByRole("tab", { name: "Tab 1" });
      tab1.focus();

      await user.keyboard("{ArrowRight}");
      // Focus should move to next tab
      const tab2 = screen.getByRole("tab", { name: "Tab 2" });
      expect(tab2).toHaveFocus();
    });
  });

  describe("keyboard navigation", () => {
    it("supports Enter to activate focused tab", async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      );

      const tab2 = screen.getByRole("tab", { name: "Tab 2" });
      tab2.focus();
      await user.keyboard("{Enter}");

      expect(screen.getByText("Content 2")).toBeVisible();
    });

    it("supports Space to activate focused tab", async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      );

      const tab2 = screen.getByRole("tab", { name: "Tab 2" });
      tab2.focus();
      await user.keyboard(" ");

      expect(screen.getByText("Content 2")).toBeVisible();
    });
  });

  describe("edge cases", () => {
    it("handles empty tabs", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>,
      );
      expect(screen.getByRole("tab", { name: "Tab 1" })).toBeInTheDocument();
    });

    it("handles tabs without content", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>,
      );
      // Tab 2 trigger should still work even without content
      expect(screen.getByRole("tab", { name: "Tab 2" })).toBeInTheDocument();
    });

    it("handles special characters in tab labels", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">
              Tab with &amp; "special" chars
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>,
      );
      expect(screen.getByRole("tab", { name: /Tab with/ })).toBeInTheDocument();
    });
  });

  describe("controlled mode", () => {
    it("supports controlled value", async () => {
      const user = userEvent.setup();
      const TestComponent = () => {
        const [value, setValue] = "tab1";
        return (
          <Tabs value={value} onValueChange={setValue}>
            <TabsList>
              <TabsTrigger value="tab1">Tab 1</TabsTrigger>
              <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1">Content 1</TabsContent>
            <TabsContent value="tab2">Content 2</TabsContent>
          </Tabs>
        );
      };

      render(<TestComponent />);

      await user.click(screen.getByRole("tab", { name: "Tab 2" }));
      // In controlled mode, the parent controls state
      expect(screen.getByRole("tab", { name: "Tab 1" })).toHaveAttribute(
        "data-state",
        "active",
      );
    });
  });
});
