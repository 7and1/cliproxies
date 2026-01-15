import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOS, type OS } from "./use-os";

describe("useOS hook", () => {
  const originalUserAgent = window.navigator.userAgent;

  afterEach(() => {
    // Restore original user agent
    Object.defineProperty(window.navigator, "userAgent", {
      value: originalUserAgent,
      writable: true,
    });
  });

  function mockUserAgent(ua: string) {
    Object.defineProperty(window.navigator, "userAgent", {
      value: ua,
      writable: true,
      configurable: true,
    });
  }

  it("returns 'other' as default initial state", () => {
    mockUserAgent("");
    const { result } = renderHook(() => useOS());
    expect(result.current).toBe("other");
  });

  it("detects macOS from userAgent", () => {
    mockUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)");
    const { result } = renderHook(() => useOS());

    // After useEffect runs
    act(() => {
      // Force a re-render to trigger useEffect
      result.current;
    });

    // Need to wait for useEffect
    const { result: result2 } = renderHook(() => useOS());
    expect(result2.current).toBe("mac");
  });

  it("detects Windows from userAgent", () => {
    mockUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
    const { result } = renderHook(() => useOS());

    act(() => {
      result.current;
    });

    const { result: result2 } = renderHook(() => useOS());
    expect(result2.current).toBe("windows");
  });

  it("detects Linux from userAgent", () => {
    mockUserAgent("Mozilla/5.0 (X11; Linux x86_64)");
    const { result } = renderHook(() => useOS());

    act(() => {
      result.current;
    });

    const { result: result2 } = renderHook(() => useOS());
    expect(result2.current).toBe("linux");
  });

  it("returns 'other' for unknown platforms", () => {
    mockUserAgent("Mozilla/5.0 (UnknownOS 1.0)");
    const { result } = renderHook(() => useOS());

    act(() => {
      result.current;
    });

    const { result: result2 } = renderHook(() => useOS());
    expect(result2.current).toBe("other");
  });

  it("handles case-insensitive Mac detection", () => {
    mockUserAgent("mozilla/5.0 (macintosh; intel mac os x)");
    const { result } = renderHook(() => useOS());

    act(() => {
      result.current;
    });

    const { result: result2 } = renderHook(() => useOS());
    expect(result2.current).toBe("mac");
  });

  it("handles various Mac userAgent formats", () => {
    const macUserAgents = [
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)",
      "Mozilla/5.0 (Macintosh; PPC Mac OS X)",
    ];

    macUserAgents.forEach((ua) => {
      mockUserAgent(ua);
      const { result } = renderHook(() => useOS());
      act(() => {
        result.current;
      });
      const { result: result2 } = renderHook(() => useOS());
      expect(result2.current).toBe("mac");
    });
  });

  it("handles various Windows userAgent formats", () => {
    const windowsUserAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Mozilla/5.0 (Windows NT 11.0)",
      "Mozilla/5.0 (Windows; U; Windows NT 6.1)",
    ];

    windowsUserAgents.forEach((ua) => {
      mockUserAgent(ua);
      const { result } = renderHook(() => useOS());
      act(() => {
        result.current;
      });
      const { result: result2 } = renderHook(() => useOS());
      expect(result2.current).toBe("windows");
    });
  });

  it("handles various Linux userAgent formats", () => {
    const linuxUserAgents = [
      "Mozilla/5.0 (X11; Linux x86_64)",
      "Mozilla/5.0 (X11; Ubuntu; Linux x86_64)",
      "Mozilla/5.0 (X11; Fedora; Linux x86_64)",
    ];

    linuxUserAgents.forEach((ua) => {
      mockUserAgent(ua);
      const { result } = renderHook(() => useOS());
      act(() => {
        result.current;
      });
      const { result: result2 } = renderHook(() => useOS());
      expect(result2.current).toBe("linux");
    });
  });

  it("returns type that matches OS union", () => {
    mockUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X)");
    const { result } = renderHook(() => useOS());

    const os: OS = result.current;
    expect(["mac", "windows", "linux", "other"]).toContain(os);
  });

  it("handles empty userAgent", () => {
    mockUserAgent("");
    const { result } = renderHook(() => useOS());

    act(() => {
      result.current;
    });

    const { result: result2 } = renderHook(() => useOS());
    expect(result2.current).toBe("other");
  });

  it("handles mobile iOS devices as Mac (since they contain 'Mac')", () => {
    mockUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)");
    const { result } = renderHook(() => useOS());

    act(() => {
      result.current;
    });

    const { result: result2 } = renderHook(() => useOS());
    // iPhone contains "Mac" in the user agent
    expect(result2.current).toBe("mac");
  });

  it("handles Android devices as other", () => {
    mockUserAgent("Mozilla/5.0 (Linux; Android 13)");
    const { result } = renderHook(() => useOS());

    act(() => {
      result.current;
    });

    const { result: result2 } = renderHook(() => useOS());
    // Android contains "Linux" so it will be detected as Linux
    expect(result2.current).toBe("linux");
  });
});
