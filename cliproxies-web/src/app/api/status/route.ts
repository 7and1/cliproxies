export const revalidate = 300;

export async function GET() {
  const { PROVIDERS, fetchProviderStatus } = await import("@/lib/status");

  const results = await Promise.allSettled(
    PROVIDERS.map((provider) => fetchProviderStatus(provider)),
  );

  const statuses = results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }

    const provider = PROVIDERS[index];
    return {
      id: provider.id,
      name: provider.name,
      indicator: "unknown",
      description: "Status page unavailable",
      statusPage: provider.statusPage,
      checkedAt: new Date(),
    };
  });

  return Response.json(statuses);
}
