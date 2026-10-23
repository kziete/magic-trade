const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL || "http://localhost:9000";

export interface ServerCard {
  id: number;
  name: string;
}

export async function fetchCardServer(id: number): Promise<ServerCard | null> {
  const res = await fetch(`${BACKEND_INTERNAL_URL}/api/cards/${id}/`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`cards/${id} fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchSitemapCardsServer(): Promise<ServerCard[]> {
  const res = await fetch(`${BACKEND_INTERNAL_URL}/api/cards/sitemap/`, { cache: "no-store" });
  if (!res.ok) throw new Error(`cards/sitemap fetch failed: ${res.status}`);
  return res.json();
}
