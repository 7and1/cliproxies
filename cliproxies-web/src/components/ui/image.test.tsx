import { render, screen } from "@testing-library/react";
import { OptimizedImage, Avatar } from "./image";

describe("OptimizedImage", () => {
  it("should render image with correct props", () => {
    render(
      <OptimizedImage
        src="/test.jpg"
        alt="Test image"
        width={200}
        height={200}
      />,
    );

    const img = screen.getByRole("img", { name: "Test image" });
    expect(img).toBeInTheDocument();
  });

  it("should show loading state while image loads", () => {
    const { container } = render(
      <OptimizedImage
        src="/test.jpg"
        alt="Test image"
        width={200}
        height={200}
      />,
    );

    // Check for loading pulse animation
    const pulse = container.querySelector(".animate-pulse");
    expect(pulse).toBeInTheDocument();
  });

  it("should show fallback on error", () => {
    // Mock Image.prototype.onError to simulate error
    const originalImage = global.Image;
    global.Image = class MockImage {
      onload = () => {};
      onerror = () => {};
      src = "";
      constructor() {
        setTimeout(() => this.onerror(), 0);
      }
    } as any;

    render(
      <OptimizedImage
        src="/invalid.jpg"
        alt="Invalid image"
        width={200}
        height={200}
      />,
    );

    // After error state is set
    expect(screen.getByText("Image not available")).toBeInTheDocument();

    global.Image = originalImage;
  });

  it("should apply custom className", () => {
    const { container } = render(
      <OptimizedImage
        src="/test.jpg"
        alt="Test image"
        width={200}
        height={200}
        className="custom-class"
      />,
    );

    const wrapper = container.querySelector(".custom-class");
    expect(wrapper).toBeInTheDocument();
  });
});

describe("Avatar", () => {
  it("should render image when src is provided", () => {
    render(<Avatar src="/avatar.jpg" alt="User avatar" />);

    const img = screen.getByRole("img", { name: "User avatar" });
    expect(img).toBeInTheDocument();
  });

  it("should render initials when no src provided", () => {
    render(<Avatar alt="John Doe" initials="JD" />);

    expect(screen.getByText("JD")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveTextContent("JD");
  });

  it("should generate initials from alt when not provided", () => {
    render(<Avatar alt="Jane Smith" />);

    expect(screen.getByText("JA")).toBeInTheDocument();
  });

  it("should render size variants correctly", () => {
    const { rerender } = render(<Avatar alt="Test" size="sm" />);
    expect(screen.getByRole("img")).toHaveClass("h-8", "w-8");

    rerender(<Avatar alt="Test" size="lg" />);
    expect(screen.getByRole("img")).toHaveClass("h-24", "w-24");
  });

  it("should fall back to initials on image error", () => {
    const originalImage = global.Image;
    global.Image = class MockImage {
      onload = () => {};
      onerror = () => {};
      src = "";
      constructor() {
        setTimeout(() => this.onerror(), 0);
      }
    } as any;

    render(<Avatar src="/invalid.jpg" alt="User" initials="US" />);

    // Should show initials after error
    expect(screen.getByText("US")).toBeInTheDocument();

    global.Image = originalImage;
  });
});
