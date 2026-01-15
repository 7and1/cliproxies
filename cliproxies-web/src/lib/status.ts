export const PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI",
    url: "https://status.openai.com/api/v2/status.json",
    statusPage: "https://status.openai.com",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    url: "https://status.anthropic.com/api/v2/status.json",
    statusPage: "https://status.anthropic.com",
  },
  {
    id: "google",
    name: "Google AI",
    url: "https://status.cloud.google.com/api/v2/status.json",
    statusPage: "https://status.cloud.google.com",
  },
] as const;

export type ProviderStatus = {
  id: string;
  name: string;
  indicator: string;
  description: string;
  statusPage?: string;
  checkedAt: Date;
};

export type Incident = {
  id: string;
  providerId: string;
  providerName: string;
  title: string;
  status: "monitoring" | "investigating" | "resolved" | "scheduled";
  createdAt: Date;
  updatedAt: Date;
};

const getIndicatorStyles = (indicator: string) => {
  const styles: Record<string, string> = {
    none: "bg-emerald-500/20 text-emerald-200 border-emerald-500/30 shadow-[0_0_12px_hsl(142_76%_36%/_0.3)]",
    minor:
      "bg-amber-500/20 text-amber-200 border-amber-500/30 shadow-[0_0_12px_hsl(38_92%_50%/_0.3)]",
    major:
      "bg-orange-500/20 text-orange-200 border-orange-500/30 shadow-[0_0_12px_hsl(25_95%_53%/_0.3)]",
    critical:
      "bg-red-500/20 text-red-200 border-red-500/30 shadow-[0_0_12px_hsl(0_84%_60%/_0.3)]",
    unknown: "bg-slate-500/20 text-slate-200 border-slate-500/30",
  };
  return styles[indicator] || styles.unknown;
};

export { getIndicatorStyles };

export async function fetchProviderStatus(provider: {
  id: string;
  name: string;
  url: string;
  statusPage?: string;
}): Promise<ProviderStatus> {
  try {
    const response = await fetch(provider.url, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return {
        id: provider.id,
        name: provider.name,
        indicator: "unknown",
        description: "Status page unavailable",
        statusPage: provider.statusPage,
        checkedAt: new Date(),
      };
    }

    const data = (await response.json()) as {
      status?: { indicator?: string; description?: string };
    };

    return {
      id: provider.id,
      name: provider.name,
      indicator: data.status?.indicator ?? "unknown",
      description: data.status?.description ?? "Unknown",
      statusPage: provider.statusPage,
      checkedAt: new Date(),
    };
  } catch {
    return {
      id: provider.id,
      name: provider.name,
      indicator: "unknown",
      description: "Status page unavailable",
      statusPage: provider.statusPage,
      checkedAt: new Date(),
    };
  }
}

export function getOverallStatus(statuses: ProviderStatus[]): {
  indicator: string;
  description: string;
} {
  if (statuses.some((s) => s.indicator === "critical")) {
    return { indicator: "critical", description: "System outage detected" };
  }
  if (statuses.some((s) => s.indicator === "major")) {
    return { indicator: "major", description: "Major service issues" };
  }
  if (statuses.some((s) => s.indicator === "minor")) {
    return { indicator: "minor", description: "Some service issues" };
  }
  if (statuses.some((s) => s.indicator === "unknown")) {
    return { indicator: "unknown", description: "Unable to verify status" };
  }
  return { indicator: "none", description: "All systems operational" };
}

export const mockIncidents: Incident[] = [
  {
    id: "1",
    providerId: "openai",
    providerName: "OpenAI",
    title: "Elevated error rates for GPT-4 requests",
    status: "resolved",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
  },
  {
    id: "2",
    providerId: "anthropic",
    providerName: "Anthropic",
    title: "Scheduled maintenance for Claude API",
    status: "resolved",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
  },
];
