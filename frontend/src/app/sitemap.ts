import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://cardtones.com", changeFrequency: "daily", priority: 1 },
    { url: "https://cardtones.com/login", changeFrequency: "yearly", priority: 0.3 },
    { url: "https://cardtones.com/register", changeFrequency: "yearly", priority: 0.3 },
  ];
}
