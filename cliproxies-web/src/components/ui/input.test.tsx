import { describe, it, expect } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./input";

describe("Input component", () => {
  describe("rendering", () => {
    it("renders as input element", () => {
      render(<Input />);
      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
      expect(input.tagName).toBe("INPUT");
    });

    it("has default type of text", () => {
      render(<Input />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("type", "text");
    });

    it("can have different types", () => {
      render(<Input type="number" />);
      const input = screen.getByRole("spinbutton");
      expect(input).toHaveAttribute("type", "number");
    });

    it("renders with placeholder", () => {
      render(<Input placeholder="Enter text..." />);
      const input = screen.getByPlaceholderText("Enter text...");
      expect(input).toBeInTheDocument();
    });

    it("renders with default value", () => {
      render(<Input defaultValue="Hello" />);
      const input = screen.getByDisplayValue("Hello");
      expect(input).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("has base input classes", () => {
      render(<Input />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("h-9");
      expect(input).toHaveClass("w-full");
      expect(input).toHaveClass("rounded-md");
      expect(input).toHaveClass("border");
    });

    it("has focus styles", () => {
      render(<Input />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("focus-visible:ring-[3px]");
    });

    it("has invalid state styles", () => {
      render(<Input aria-invalid="true" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("aria-invalid:ring-destructive/20");
      expect(input).toHaveClass("aria-invalid:border-destructive");
    });

    it("merges custom className", () => {
      render(<Input className="custom-input-class" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("custom-input-class");
    });
  });

  describe("user interactions", () => {
    it("allows typing text", async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole("textbox");

      await user.type(input, "Hello, world!");
      expect(input).toHaveValue("Hello, world!");
    });

    it("allows clearing text", async () => {
      const user = userEvent.setup();
      render(<Input defaultValue="Initial text" />);
      const input = screen.getByRole("textbox");

      await user.clear(input);
      expect(input).toHaveValue("");
    });

    it("calls onChange handler", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole("textbox");

      await user.type(input, "test");
      expect(handleChange).toHaveBeenCalled();
    });

    it("can be focused", async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole("textbox");

      await user.click(input);
      expect(input).toHaveFocus();
    });
  });

  describe("props", () => {
    it("passes through standard input props", () => {
      render(
        <Input
          name="username"
          id="username-input"
          autoComplete="username"
          maxLength={20}
        />,
      );
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("name", "username");
      expect(input).toHaveAttribute("id", "username-input");
      expect(input).toHaveAttribute("autocomplete", "username");
      expect(input).toHaveAttribute("maxlength", "20");
    });

    it("supports disabled state", () => {
      render(<Input disabled />);
      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
    });

    it("supports readonly state", () => {
      render(<Input readOnly value="readonly" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("readonly");
    });

    it("supports required attribute", () => {
      render(<Input required />);
      const input = screen.getByRole("textbox");
      expect(input).toBeRequired();
    });

    it("supports min and max for number inputs", () => {
      render(<Input type="number" min={0} max={100} />);
      const input = screen.getByRole("spinbutton");
      expect(input).toHaveAttribute("min", "0");
      expect(input).toHaveAttribute("max", "100");
    });
  });

  describe("accessibility", () => {
    it("has accessible name via label", () => {
      render(
        <label htmlFor="test-input">
          Username
          <Input id="test-input" />
        </label>,
      );
      const input = screen.getByRole("textbox", { name: "Username" });
      expect(input).toBeInTheDocument();
    });

    it("supports aria-label", () => {
      render(<Input aria-label="Search query" />);
      const input = screen.getByRole("textbox", { name: "Search query" });
      expect(input).toBeInTheDocument();
    });

    it("supports aria-describedby", () => {
      render(
        <>
          <Input aria-describedby="helper-text" />
          <span id="helper-text">Enter your username</span>
        </>,
      );
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-describedby", "helper-text");
    });

    it("supports aria-invalid for error states", () => {
      render(<Input aria-invalid="true" aria-errormessage="error-msg" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAttribute("aria-errormessage", "error-msg");
    });

    it("shows visible focus indicator", () => {
      render(<Input />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("focus-visible:ring-ring/50");
      expect(input).toHaveClass("focus-visible:border-ring");
    });
  });

  describe("data attributes", () => {
    it("includes data-slot attribute", () => {
      render(<Input />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("data-slot", "input");
    });
  });

  describe("controlled input", () => {
    it("works as controlled component", async () => {
      const user = userEvent.setup();
      const TestComponent = () => {
        const [value, setValue] = useState("");
        return (
          <Input value={value} onChange={(e) => setValue(e.target.value)} />
        );
      };
      render(<TestComponent />);
      const input = screen.getByRole("textbox");

      await user.type(input, "test");
      // In controlled mode, typing should work if onChange updates state
      expect(input).toHaveValue("test");
    });
  });

  describe("edge cases", () => {
    it("handles empty string value", () => {
      render(<Input value="" readOnly />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("");
    });

    it("handles special characters", async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole("textbox");

      await user.type(input, "!@#$%^&*()");
      expect(input).toHaveValue("!@#$%^&*()");
    });

    it("handles very long text", async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole("textbox");

      const longText = "a".repeat(1000);
      await user.type(input, longText);
      expect(input).toHaveValue(longText);
    });

    it("handles numbers in text input", async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole("textbox");

      await user.type(input, "12345");
      expect(input).toHaveValue("12345");
    });
  });

  describe("different input types", () => {
    it("renders password input", () => {
      render(<Input type="password" />);
      // Password inputs don't have a specific role
      const passwordInput = document.querySelector("input[type='password']");
      expect(passwordInput).toBeInTheDocument();
    });

    it("renders email input", () => {
      render(<Input type="email" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("type", "email");
    });

    it("renders url input", () => {
      render(<Input type="url" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("type", "url");
    });

    it("renders tel input", () => {
      render(<Input type="tel" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("type", "tel");
    });

    it("renders search input", () => {
      render(<Input type="search" />);
      const input = screen.getByRole("searchbox");
      expect(input).toHaveAttribute("type", "search");
    });
  });

  describe("disabled state styling", () => {
    it("applies disabled styles", () => {
      render(<Input disabled />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("disabled:opacity-50");
      expect(input).toHaveClass("disabled:cursor-not-allowed");
    });

    it("prevents user interaction when disabled", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Input disabled onChange={handleChange} />);
      const input = screen.getByRole("textbox");

      await user.click(input);
      expect(handleChange).not.toHaveBeenCalled();
    });
  });
});
