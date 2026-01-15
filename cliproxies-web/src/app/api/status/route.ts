import { PROVIDERS, fetchProviderStatus } from "@/lib/status";

export const revalidate = 300;

export async function GET() {
  const results = await Promise.all(
    PROVIDERS.map((provider) => fetchProviderStatus(provider)),
  );

  return Response.json(results);
}
