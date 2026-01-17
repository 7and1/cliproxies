/**
 * Web Vitals monitoring for Core Web Vitals
 * Measures LCP, FID, CLS, and other performance metrics
 */

export interface Metric {
  id: string;
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  entries: PerformanceEntry[];
}

export interface VitalsReport {
  lcp?: Metric;
  fid?: Metric;
  cls?: Metric;
  fcp?: Metric;
  ttfb?: Metric;
  url: string;
  timestamp: number;
}

const thresholds = {
  lcp: { good: 2500, poor: 4000 }, // ms
  fid: { good: 100, poor: 300 }, // ms
  cls: { good: 0.1, poor: 0.25 },
  fcp: { good: 1800, poor: 3000 }, // ms
  ttfb: { good: 800, poor: 1800 }, // ms
};

function getRating(
  name: keyof typeof thresholds,
  value: number,
): Metric["rating"] {
  const threshold = thresholds[name];
  if (!threshold) return "good";
  if (value <= threshold.good) return "good";
  if (value <= threshold.poor) return "needs-improvement";
  return "poor";
}

function reportMetric(metric: Metric) {
  // Only report in production
  if (process.env.NODE_ENV !== "production") {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    });
    return;
  }

  // Send to analytics endpoint
  if (typeof window !== "undefined" && "fetch" in window) {
    fetch("/api/analytics/vitals", {
      method: "POST",
      body: JSON.stringify({
        ...metric,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      // Don't block the page
      keepalive: true,
    }).catch(() => {
      // Silently fail to not affect user experience
    });
  }
}

/**
 * Observes Largest Contentful Paint (LCP)
 */
function observeLCP(callback: (metric: Metric) => void): () => void {
  if (!("PerformanceObserver" in window)) return () => {};

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
      id?: string;
      startTime?: number;
    };

    if (lastEntry && lastEntry.startTime) {
      callback({
        id: lastEntry.id || "lcp",
        name: "LCP",
        value: lastEntry.startTime,
        rating: getRating("lcp", lastEntry.startTime),
        delta: 0,
        entries: [lastEntry],
      });
    }
  });

  try {
    observer.observe({ type: "largest-contentful-paint", buffered: true });
  } catch {
    // Ignore if not supported
  }

  return () => observer.disconnect();
}

/**
 * Observes First Input Delay (FID)
 */
function observeFID(callback: (metric: Metric) => void): () => void {
  if (!("PerformanceObserver" in window)) return () => {};

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    for (const entry of entries) {
      const fidEntry = entry as PerformanceEntry & {
        id?: string;
        processingStart?: number;
        startTime?: number;
      };
      if (fidEntry.processingStart && fidEntry.startTime) {
        const value = fidEntry.processingStart - fidEntry.startTime;
        callback({
          id: fidEntry.id || "fid",
          name: "FID",
          value,
          rating: getRating("fid", value),
          delta: 0,
          entries: [fidEntry],
        });
      }
    }
  });

  try {
    observer.observe({ type: "first-input", buffered: true });
  } catch {
    // Ignore if not supported
  }

  return () => observer.disconnect();
}

/**
 * Observes Cumulative Layout Shift (CLS)
 */
function observeCLS(callback: (metric: Metric) => void): () => void {
  if (!("PerformanceObserver" in window)) return () => {};

  let clsValue = 0;
  let sessionValue = 0;
  let sessionEntries: PerformanceEntry[] = [];

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const layoutEntry = entry as PerformanceEntry & {
        hadRecentInput?: boolean;
        value?: number;
      };
      if (!layoutEntry.hadRecentInput && layoutEntry.value) {
        sessionValue += layoutEntry.value;
        sessionEntries.push(entry);
      } else {
        sessionValue = 0;
        sessionEntries = [];
      }

      if (sessionValue > clsValue) {
        clsValue = sessionValue;
        callback({
          id: "cls",
          name: "CLS",
          value: clsValue,
          rating: getRating("cls", clsValue),
          delta: sessionValue - clsValue,
          entries: sessionEntries,
        });
      }
    }
  });

  try {
    observer.observe({ type: "layout-shift", buffered: true });
  } catch {
    // Ignore if not supported
  }

  return () => observer.disconnect();
}

/**
 * Observes First Contentful Paint (FCP)
 */
function observeFCP(callback: (metric: Metric) => void): () => void {
  if (!("PerformanceObserver" in window)) return () => {};

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const fcpEntry = entries[0] as PerformanceEntry & {
      startTime?: number;
    };

    if (fcpEntry && fcpEntry.startTime) {
      callback({
        id: "fcp",
        name: "FCP",
        value: fcpEntry.startTime,
        rating: getRating("fcp", fcpEntry.startTime),
        delta: 0,
        entries: [fcpEntry],
      });
    }
  });

  try {
    observer.observe({ type: "paint", buffered: true });
  } catch {
    // Ignore if not supported
  }

  return () => observer.disconnect();
}

/**
 * Observes Time to First Byte (TTFB)
 */
function observeTTFB(callback: (metric: Metric) => void): () => void {
  if (
    typeof window === "undefined" ||
    typeof performance === "undefined" ||
    typeof performance.getEntriesByType !== "function"
  ) {
    return () => {};
  }

  const navigation = performance.getEntriesByType(
    "navigation",
  )[0] as PerformanceNavigationTiming;

  if (navigation) {
    const ttfb = navigation.responseStart - navigation.requestStart;
    callback({
      id: "ttfb",
      name: "TTFB",
      value: ttfb,
      rating: getRating("ttfb", ttfb),
      delta: 0,
      entries: [navigation],
    });
  }

  return () => {};
}

/**
 * Initialize all Web Vitals observers
 */
export function initWebVitals() {
  if (typeof window === "undefined") return;

  const disconnectLCP = observeLCP(reportMetric);
  const disconnectFID = observeFID(reportMetric);
  const disconnectCLS = observeCLS(reportMetric);
  const disconnectFCP = observeFCP(reportMetric);
  const disconnectTTFB = observeTTFB(reportMetric);

  // Return cleanup function
  return () => {
    disconnectLCP?.();
    disconnectFID?.();
    disconnectCLS?.();
    disconnectFCP?.();
    disconnectTTFB?.();
  };
}

/**
 * Get current page navigation timing
 */
export function getNavigationTiming() {
  if (
    typeof window === "undefined" ||
    typeof performance === "undefined" ||
    typeof performance.getEntriesByType !== "function"
  ) {
    return null;
  }

  const navigation = performance.getEntriesByType(
    "navigation",
  )[0] as PerformanceNavigationTiming;

  if (!navigation) return null;

  return {
    // Network timings
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcp: navigation.connectEnd - navigation.connectStart,
    tls:
      navigation.secureConnectionStart > 0
        ? navigation.connectEnd - navigation.secureConnectionStart
        : 0,
    ttfb: navigation.responseStart - navigation.requestStart,
    // Download timings
    download: navigation.responseEnd - navigation.responseStart,
    // Render timings
    fcp: navigation.responseStart,
    lcp: 0, // Will be filled by observer
    domContentLoaded:
      navigation.domContentLoadedEventEnd - navigation.startTime,
    loadComplete: navigation.loadEventEnd - navigation.startTime,
  };
}

/**
 * Get resource timing stats
 */
export function getResourceTimingStats() {
  if (
    typeof window === "undefined" ||
    typeof performance === "undefined" ||
    typeof performance.getEntriesByType !== "function"
  ) {
    return null;
  }

  const resources = performance.getEntriesByType(
    "resource",
  ) as PerformanceResourceTiming[];

  const byType = resources.reduce(
    (acc, resource) => {
      const type = resource.initiatorType;
      if (!acc[type]) acc[type] = { count: 0, totalDuration: 0 };
      acc[type].count++;
      acc[type].totalDuration +=
        resource.duration - (resource.redirectStart || 0);
      return acc;
    },
    {} as Record<string, { count: number; totalDuration: number }>,
  );

  return byType;
}
