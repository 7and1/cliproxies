import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "./card";

describe("Card components", () => {
  describe("Card", () => {
    it("renders children correctly", () => {
      render(
        <Card>
          <p>Card content</p>
        </Card>,
      );
      expect(screen.getByText("Card content")).toBeInTheDocument();
    });

    it("has data-slot attribute", () => {
      render(
        <Card>
          <p>Content</p>
        </Card>,
      );
      const card = screen.getByText("Content").closest("[data-slot='card']");
      expect(card).toBeInTheDocument();
    });

    it("applies custom className", () => {
      render(
        <Card className="custom-class">
          <p>Content</p>
        </Card>,
      );
      const card = screen.getByText("Content").parentElement;
      expect(card).toHaveClass("custom-class");
    });

    it("has base styling classes", () => {
      render(
        <Card>
          <p>Content</p>
        </Card>,
      );
      const card = screen.getByText("Content").parentElement;
      expect(card).toHaveClass("bg-card");
      expect(card).toHaveClass("rounded-xl");
      expect(card).toHaveClass("border");
      expect(card).toHaveClass("shadow-sm");
    });
  });

  describe("CardHeader", () => {
    it("renders children correctly", () => {
      render(
        <Card>
          <CardHeader>
            <p>Header content</p>
          </CardHeader>
        </Card>,
      );
      expect(screen.getByText("Header content")).toBeInTheDocument();
    });

    it("has data-slot attribute", () => {
      render(
        <Card>
          <CardHeader>Header</CardHeader>
        </Card>,
      );
      const header = screen
        .getByText("Header")
        .closest("[data-slot='card-header']");
      expect(header).toBeInTheDocument();
    });

    it("has correct grid classes for layout", () => {
      render(
        <Card>
          <CardHeader>Header</CardHeader>
        </Card>,
      );
      const header = screen.getByText("Header").parentElement;
      expect(header).toHaveClass("grid");
      expect(header).toHaveClass("auto-rows-min");
    });

    it("handles CardAction in header", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardAction>Action</CardAction>
          </CardHeader>
        </Card>,
      );
      const action = screen.getByText("Action");
      expect(action).toBeInTheDocument();
    });
  });

  describe("CardTitle", () => {
    it("renders title text", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
        </Card>,
      );
      expect(screen.getByText("Card Title")).toBeInTheDocument();
    });

    it("has data-slot attribute", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
        </Card>,
      );
      const title = screen
        .getByText("Title")
        .closest("[data-slot='card-title']");
      expect(title).toBeInTheDocument();
    });

    it("has font-semibold styling", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
        </Card>,
      );
      const title = screen.getByText("Title");
      expect(title).toHaveClass("font-semibold");
    });
  });

  describe("CardDescription", () => {
    it("renders description text", () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>This is a description</CardDescription>
          </CardHeader>
        </Card>,
      );
      expect(screen.getByText("This is a description")).toBeInTheDocument();
    });

    it("has data-slot attribute", () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Description</CardDescription>
          </CardHeader>
        </Card>,
      );
      const description = screen
        .getByText("Description")
        .closest("[data-slot='card-description']");
      expect(description).toBeInTheDocument();
    });

    it("has muted text styling", () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Description</CardDescription>
          </CardHeader>
        </Card>,
      );
      const description = screen.getByText("Description");
      expect(description).toHaveClass("text-muted-foreground");
      expect(description).toHaveClass("text-sm");
    });
  });

  describe("CardAction", () => {
    it("renders action content", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardAction>
              <button>Action</button>
            </CardAction>
          </CardHeader>
        </Card>,
      );
      expect(
        screen.getByRole("button", { name: "Action" }),
      ).toBeInTheDocument();
    });

    it("has data-slot attribute", () => {
      render(
        <Card>
          <CardHeader>
            <CardAction>Action</CardAction>
          </CardHeader>
        </Card>,
      );
      const action = screen
        .getByText("Action")
        .closest("[data-slot='card-action']");
      expect(action).toBeInTheDocument();
    });

    it("is positioned correctly in grid", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardAction>Action</CardAction>
          </CardHeader>
        </Card>,
      );
      const action = screen.getByText("Action").parentElement;
      expect(action).toHaveClass("col-start-2");
      expect(action).toHaveClass("row-start-1");
    });
  });

  describe("CardContent", () => {
    it("renders content correctly", () => {
      render(
        <Card>
          <CardContent>Main content goes here</CardContent>
        </Card>,
      );
      expect(screen.getByText("Main content goes here")).toBeInTheDocument();
    });

    it("has data-slot attribute", () => {
      render(
        <Card>
          <CardContent>Content</CardContent>
        </Card>,
      );
      const content = screen
        .getByText("Content")
        .closest("[data-slot='card-content']");
      expect(content).toBeInTheDocument();
    });

    it("has proper padding", () => {
      render(
        <Card>
          <CardContent>Content</CardContent>
        </Card>,
      );
      const content = screen.getByText("Content").parentElement;
      expect(content).toHaveClass("px-6");
    });
  });

  describe("CardFooter", () => {
    it("renders footer content", () => {
      render(
        <Card>
          <CardFooter>Footer content</CardFooter>
        </Card>,
      );
      expect(screen.getByText("Footer content")).toBeInTheDocument();
    });

    it("has data-slot attribute", () => {
      render(
        <Card>
          <CardFooter>Footer</CardFooter>
        </Card>,
      );
      const footer = screen
        .getByText("Footer")
        .closest("[data-slot='card-footer']");
      expect(footer).toBeInTheDocument();
    });

    it("has proper padding and flex layout", () => {
      render(
        <Card>
          <CardFooter>Footer</CardFooter>
        </Card>,
      );
      const footer = screen.getByText("Footer").parentElement;
      expect(footer).toHaveClass("px-6");
      expect(footer).toHaveClass("flex");
      expect(footer).toHaveClass("items-center");
    });
  });

  describe("complete card structure", () => {
    it("renders full card with all components", () => {
      render(
        <Card className="test-card">
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
            <CardAction>
              <button>Action</button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p>Card content goes here.</p>
          </CardContent>
          <CardFooter>
            <button>Cancel</button>
            <button>Confirm</button>
          </CardFooter>
        </Card>,
      );

      expect(screen.getByText("Test Title")).toBeInTheDocument();
      expect(screen.getByText("Test Description")).toBeInTheDocument();
      expect(screen.getByText("Card content goes here.")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Action" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Cancel" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Confirm" }),
      ).toBeInTheDocument();
    });

    it("maintains proper nesting structure", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>,
      );

      const card = screen.getByText("Title").closest("[data-slot='card']");
      expect(card).toBeInTheDocument();

      const header = screen
        .getByText("Title")
        .closest("[data-slot='card-header']");
      expect(header).toBeInTheDocument();

      const content = screen
        .getByText("Content")
        .closest("[data-slot='card-content']");
      expect(content).toBeInTheDocument();
    });
  });

  describe("customization", () => {
    it("allows custom className on all components", () => {
      render(
        <Card className="custom-card">
          <CardHeader className="custom-header">
            <CardTitle className="custom-title">Title</CardTitle>
            <CardDescription className="custom-description">
              Description
            </CardDescription>
          </CardHeader>
          <CardContent className="custom-content">Content</CardContent>
          <CardFooter className="custom-footer">Footer</CardFooter>
        </Card>,
      );

      expect(
        screen.getByText("Title").closest(".custom-title"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Description").closest(".custom-description"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Content").closest(".custom-content"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Footer").closest(".custom-footer"),
      ).toBeInTheDocument();
    });

    it("passes through additional props", () => {
      render(
        <Card data-testid="test-card">
          <CardContent>Content</CardContent>
        </Card>,
      );
      expect(screen.getByTestId("test-card")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("supports ARIA attributes", () => {
      render(
        <Card role="article" aria-labelledby="card-title">
          <CardHeader>
            <CardTitle id="card-title">Accessible Title</CardTitle>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>,
      );

      const card = screen.getByRole("article");
      expect(card).toHaveAttribute("aria-labelledby", "card-title");
      expect(screen.getByText("Accessible Title")).toBeInTheDocument();
    });

    it("supports nested interactive elements", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card with links</CardTitle>
          </CardHeader>
          <CardContent>
            <a href="/more">Learn more</a>
          </CardContent>
        </Card>,
      );

      const link = screen.getByRole("link", { name: "Learn more" });
      expect(link).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("renders card with minimal content", () => {
      render(<Card></Card>);
      const card = document.querySelector("[data-slot='card']");
      expect(card).toBeInTheDocument();
    });

    it("renders header without title or description", () => {
      render(
        <Card>
          <CardHeader />
        </Card>,
      );
      const header = document.querySelector("[data-slot='card-header']");
      expect(header).toBeInTheDocument();
    });

    it("handles multiple cards", () => {
      render(
        <>
          <Card>
            <CardContent>Card 1</CardContent>
          </Card>
          <Card>
            <CardContent>Card 2</CardContent>
          </Card>
          <Card>
            <CardContent>Card 3</CardContent>
          </Card>
        </>,
      );

      expect(screen.getByText("Card 1")).toBeInTheDocument();
      expect(screen.getByText("Card 2")).toBeInTheDocument();
      expect(screen.getByText("Card 3")).toBeInTheDocument();
    });
  });
});
