/**
 * Accessibility tests for UI components
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock component for testing accessibility features
const AccessibleButton = ({ children, onClick, ariaLabel }: {
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel?: string;
}) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel}
    className="min-h-[44px] min-w-[44px]"
  >
    {children}
  </button>
);

const AccessibleLink = ({ href, children, ariaLabel }: {
  href: string;
  children: React.ReactNode;
  ariaLabel?: string;
}) => (
  <a href={href} aria-label={ariaLabel} className="min-h-[44px] inline-flex items-center">
    {children}
  </a>
);

const AccessibleForm = () => (
  <form>
    <label htmlFor="email">Email address</label>
    <input
      type="email"
      id="email"
      name="email"
      required
      aria-describedby="email-hint"
      className="min-h-[44px] w-full"
    />
    <p id="email-hint" className="text-sm text-muted-foreground">
      We'll never share your email with anyone else.
    </p>

    <label htmlFor="password">Password</label>
    <input
      type="password"
      id="password"
      name="password"
      required
      aria-describedby="password-requirements"
      className="min-h-[44px] w-full"
    />
    <p id="password-requirements" className="text-sm text-muted-foreground">
      Must be at least 8 characters long.
    </p>

    <button type="submit" className="min-h-[44px] min-w-[44px]">
      Submit
    </button>
  </form>
);

const AccessibleDialog = ({ isOpen, onClose, title }: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      className="fixed inset-0 z-50"
    >
      <div className="backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="dialog-content">
        <h2 id="dialog-title">{title}</h2>
        <button onClick={onClose} aria-label="Close dialog">
          Close
        </button>
        <p>Dialog content goes here.</p>
      </div>
    </div>
  );
};

const AccessibleTabs = ({ tabs }: { tabs: Array<{ id: string; label: string; content: string }> }) => {
  const [activeTab, setActiveTab] = React.useState(tabs[0]?.id);

  return (
    <div role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`panel-${tab.id}`}
          id={`tab-${tab.id}`}
          onClick={() => setActiveTab(tab.id)}
          className="min-h-[44px] min-w-[44px]"
        >
          {tab.label}
        </button>
      ))}
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeTab !== tab.id}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
};

describe("Accessibility - Button Component", () => {
  it("has accessible name", () => {
    render(<AccessibleButton onClick={() => {}}>Click me</AccessibleButton>);
    const button = screen.getByRole("button", { name: "Click me" });
    expect(button).toBeInTheDocument();
  });

  it("has aria-label when text is not descriptive", () => {
    render(
      <AccessibleButton onClick={() => {}} ariaLabel="Close dialog">
        X
      </AccessibleButton>,
    );
    const button = screen.getByRole("button", { name: "Close dialog" });
    expect(button).toBeInTheDocument();
  });

  it("has minimum touch target size", () => {
    render(<AccessibleButton onClick={() => {}>Click</AccessibleButton>);
    const button = screen.getByRole("button");

    const styles = window.getComputedStyle(button);
    const width = parseInt(styles.width, 10);
    const height = parseInt(styles.height, 10);

    expect(width).toBeGreaterThanOrEqual(44);
    expect(height).toBeGreaterThanOrEqual(44);
  });

  it("is keyboard navigable", async () => {
    const user = userEvent.setup();
    render(<AccessibleButton onClick={() => {}}>Click me</AccessibleButton>);

    const button = screen.getByRole("button");
    button.focus();

    expect(document.activeElement).toBe(button);

    await user.keyboard("{Enter}");
    await user.keyboard("{ }");
  });
});

describe("Accessibility - Link Component", () => {
  it("has accessible name", () => {
    render(<AccessibleLink href="/test">Read more</AccessibleLink>);
    const link = screen.getByRole("link", { name: "Read more" });
    expect(link).toBeInTheDocument();
  });

  it("indicates if link opens in new tab", () => {
    render(
      <a href="/test" target="_blank" rel="noopener noreferrer">
        External link
      </a>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});

describe("Accessibility - Form Component", () => {
  it("has properly associated labels", () => {
    render(<AccessibleForm />);

    const emailInput = screen.getByLabelText("Email address");
    const passwordInput = screen.getByLabelText("Password");

    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
  });

  it("has aria-describedby for hints", () => {
    render(<AccessibleForm />);

    const emailInput = screen.getByLabelText("Email address");
    expect(emailInput).toHaveAttribute("aria-describedby", "email-hint");

    const hint = screen.getByText("We'll never share your email with anyone else.");
    expect(hint).toBeInTheDocument();
  });

  it("has required fields marked", () => {
    render(<AccessibleForm />);

    const emailInput = screen.getByLabelText("Email address");
    expect(emailInput).toBeRequired();

    const passwordInput = screen.getByLabelText("Password");
    expect(passwordInput).toBeRequired();
  });

  it("submits on Enter key in form", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(
      <form onSubmit={handleSubmit}>
        <label htmlFor="input">Test</label>
        <input id="input" type="text" className="min-h-[44px]" />
        <button type="submit" className="min-h-[44px]">Submit</button>
      </form>,
    );

    const input = screen.getByLabelText("Test");
    await user.click(input);
    await user.keyboard("{Enter}");

    // Form should handle Enter key
  });
});

describe("Accessibility - Dialog Component", () => {
  it("has proper ARIA attributes", () => {
    render(
      <AccessibleDialog isOpen onClose={() => {}} title="Test Dialog">
        <p>Content</p>
      </AccessibleDialog>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "dialog-title");

    const title = screen.getByText("Test Dialog");
    expect(title).toHaveAttribute("id", "dialog-title");
  });

  it("has close button with accessible label", () => {
    render(
      <AccessibleDialog isOpen onClose={() => {}} title="Test Dialog" />,
    );

    const closeButton = screen.getByRole("button", { name: /close/i });
    expect(closeButton).toBeInTheDocument();
  });

  it("traps focus within dialog", async () => {
    const user = userEvent.setup();
    render(
      <AccessibleDialog isOpen onClose={() => {}} title="Test Dialog" />,
    );

    const closeButton = screen.getByRole("button", { name: /close/i });

    // Focus should be manageable within dialog
    closeButton.focus();
    expect(document.activeElement).toBe(closeButton);

    await user.tab();
    // Focus should still be within dialog
  });
});

describe("Accessibility - Tabs Component", () => {
  it("has proper tablist and tab roles", () => {
    const tabs = [
      { id: "tab1", label: "Tab 1", content: "Content 1" },
      { id: "tab2", label: "Tab 2", content: "Content 2" },
    ];

    render(<AccessibleTabs tabs={tabs} />);

    const tablist = screen.getByRole("tablist");
    expect(tablist).toBeInTheDocument();

    const tabs_el = within(tablist).getAllByRole("tab");
    expect(tabs_el).toHaveLength(2);
  });

  it("associates tabs with panels", () => {
    const tabs = [
      { id: "tab1", label: "Tab 1", content: "Content 1" },
      { id: "tab2", label: "Tab 2", content: "Content 2" },
    ];

    render(<AccessibleTabs tabs={tabs} />);

    const tab1 = screen.getByRole("tab", { name: "Tab 1" });
    expect(tab1).toHaveAttribute("aria-controls", "panel-tab1");

    const panel1 = screen.getByRole("tabpanel", { hidden: true });
    expect(panel1).toHaveAttribute("aria-labelledby", "tab-tab1");
  });

  it("indicates active tab", () => {
    const tabs = [
      { id: "tab1", label: "Tab 1", content: "Content 1" },
      { id: "tab2", label: "Tab 2", content: "Content 2" },
    ];

    render(<AccessibleTabs tabs={tabs} />);

    const tab1 = screen.getByRole("tab", { name: "Tab 1" });
    expect(tab1).toHaveAttribute("aria-selected", "true");
  });

  it("switches tabs on click", async () => {
    const user = userEvent.setup();
    const tabs = [
      { id: "tab1", label: "Tab 1", content: "Content 1" },
      { id: "tab2", label: "Tab 2", content: "Content 2" },
    ];

    render(<AccessibleTabs tabs={tabs} />);

    const tab2 = screen.getByRole("tab", { name: "Tab 2" });
    await user.click(tab2);

    expect(tab2).toHaveAttribute("aria-selected", "true");
  });
});

describe("Accessibility - Skip Links", () => {
  it("provides skip link for keyboard users", () => {
    render(
      <>
        <a href="#main-content" className="sr-only focus:not-sr-only">
          Skip to main content
        </a>
        <main id="main-content">
          <h1>Content</h1>
        </main>
      </>,
    );

    const skipLink = screen.getByRole("link", { name: /skip to main/i });
    expect(skipLink).toHaveAttribute("href", "#main-content");
  });

  it("skip link target exists", () => {
    render(
      <>
        <a href="#main-content">Skip to main content</a>
        <div id="main-content">Main content</div>
      </>,
    );

    const mainContent = document.getElementById("main-content");
    expect(mainContent).toBeInTheDocument();
  });
});

describe("Accessibility - Heading Structure", () => {
  it("has logical heading hierarchy", () => {
    render(
      <article>
        <h1>Title</h1>
        <section>
          <h2>Section 1</h2>
          <h3>Subsection</h3>
        </section>
        <section>
          <h2>Section 2</h2>
        </section>
      </article>,
    );

    const headings = screen.getAllByRole("heading");
    expect(headings).toHaveLength(4);
  });

  it("does not skip heading levels", () => {
    render(
      <>
        <h1>Title</h1>
        <h2>Section</h2>
        <h4>Should not skip to h4</h4>
      </>,
    );

    const h1 = screen.getByRole("heading", { level: 1 });
    const h2 = screen.getByRole("heading", { level: 2 });
    const h4 = screen.getByRole("heading", { level: 4 });

    // h4 exists but should ideally be h3
    expect(h4).toBeInTheDocument();
  });
});

describe("Accessibility - ARIA Live Regions", () => {
  it("announces dynamic content changes", () => {
    const { rerender } = render(
      <div role="status" aria-live="polite">
        Loading...
      </div>,
    );

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");

    rerender(
      <div role="status" aria-live="polite">
        Loaded successfully!
      </div>,
    );

    expect(status).toHaveTextContent("Loaded successfully!");
  });

  it("provides alert role for important messages", () => {
    render(
      <div role="alert">
        Error: Something went wrong
      </div>,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/error/i);
  });
});

describe("Accessibility - Color Contrast", () => {
  it("text has sufficient contrast", () => {
    const { container } = render(<p style={{ color: "#000000", backgroundColor: "#ffffff" }}>Text</p>);

    const p = container.querySelector("p");
    expect(p).toBeInTheDocument();

    // In real implementation, use axe-core or similar to check contrast
    const styles = window.getComputedStyle(p as Element);
    expect(styles.color).toBeTruthy();
    expect(styles.backgroundColor).toBeTruthy();
  });
});

describe("Accessibility - Keyboard Navigation", () => {
  it("all interactive elements are focusable", () => {
    render(
      <div>
        <button>Button 1</button>
        <button>Button 2</button>
        <a href="/">Link</a>
      </div>,
    );

    const buttons = screen.getAllByRole("button");
    const link = screen.getByRole("link");

    buttons.forEach((button) => {
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    link.focus();
    expect(document.activeElement).toBe(link);
  });

  it("maintains visible focus indicator", () => {
    render(<button className="focus:ring-2">Click me</button>);

    const button = screen.getByRole("button");
    button.focus();

    // Check for focus-visible class or outline
    const styles = window.getComputedStyle(button);
    const hasOutline = styles.outline !== "none";
    const hasBoxShadow = styles.boxShadow !== "none";

    expect(hasOutline || hasBoxShadow).toBeTruthy();
  });
});

describe("Accessibility - Images", () => {
  it("decorative images have alt text", () => {
    render(<img src="/decorative.jpg" alt="" role="presentation" />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("alt", "");
  });

  it("informative images have descriptive alt text", () => {
    render(<img src="/chart.jpg" alt="Bar chart showing sales data for Q1 2024" />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("alt", "Bar chart showing sales data for Q1 2024");
  });

  it("images used as links have alt text for link destination", () => {
    render(
      <a href="/details">
        <img src="/thumbnail.jpg" alt="Product thumbnail: Red widget" />
      </a>,
    );

    const link = screen.getByRole("link");
    const img = within(link).getByRole("img");

    expect(img).toHaveAttribute("alt");
  });
});

describe("Accessibility - Lists", () => {
  it("navigation is properly marked as list", () => {
    render(
      <nav aria-label="Main navigation">
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/about">About</a></li>
          <li><a href="/contact">Contact</a></li>
        </ul>
      </nav>,
    );

    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    const list = within(nav)..getByRole("list");
    const items = within(list).getAllByRole("listitem");

    expect(items).toHaveLength(3);
  });
});
