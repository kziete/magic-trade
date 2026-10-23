import type { MetadataRoute } from "next";
import { fetchSitemapCardsServer } from "@/lib/serverApi";
import { searchRoutes } from "@/lib/routes";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cards = await fetchSitemapCardsServer();

  return [
    { url: "https://cardtones.com", changeFrequency: "daily", priority: 1 },
    { url: "https://cardtones.com/login", changeFrequency: "yearly", priority: 0.3 },
    { url: "https://cardtones.com/register", changeFrequency: "yearly", priority: 0.3 },
    ...cards.map((card) => ({
      url: `https://cardtones.com${searchRoutes.detail(card.id, card.name)}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
