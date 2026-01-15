export function getRepoSlug(repoUrl: string): string | null {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/i);
  if (!match) return null;
  return `${match[1]}/${match[2]}`;
}

export async function fetchRepoStars(repoUrl: string): Promise<number | null> {
  const slug = getRepoSlug(repoUrl);
  if (!slug) return null;

  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "CLIProxies-Hub",
  };

  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`https://api.github.com/repos/${slug}`, {
    headers,
    next: { revalidate: 300, tags: [`github-stars-${slug}`] },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { stargazers_count?: number };
  return typeof data.stargazers_count === "number"
    ? data.stargazers_count
    : null;
}
