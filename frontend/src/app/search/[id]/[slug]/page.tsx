import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { fetchCardServer, fetchCardVariantsServer } from "@/lib/serverApi";
import { slugify } from "@/lib/slug";
import { searchRoutes } from "@/lib/routes";
import SearchDetailClient from "./SearchDetailClient";

interface PageParams {
  id: string;
  slug: string;
}

async function loadCard(params: Promise<PageParams>) {
  const { id, slug } = await params;
  const cardId = parseInt(id, 10);
  const card = Number.isNaN(cardId) ? null : await fetchCardServer(cardId);

  if (!card) notFound();

  const canonicalSlug = slugify(card.name);
  if (slug !== canonicalSlug) {
    permanentRedirect(searchRoutes.detail(card.id, card.name));
  }

  return card;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const card = await loadCard(params);
  const variants = await fetchCardVariantsServer(card.id);
  const image = variants[0]?.image;
  const title = `${card.name} — Cardtones`;
  const description = `Cartas de ${card.name} disponibles para intercambiar en Cardtones.`;
  const canonical = searchRoutes.detail(card.id, card.name);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: image ? [{ url: image, alt: card.name }] : undefined,
    },
    twitter: {
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function CardSearchDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const card = await loadCard(params);
  const variants = await fetchCardVariantsServer(card.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: card.name,
    image: variants[0]?.image,
    description: `Cartas de ${card.name} disponibles para intercambiar en Cardtones.`,
    url: `https://cardtones.com${searchRoutes.detail(card.id, card.name)}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SearchDetailClient
        cardId={card.id}
        cardName={card.name}
        initialVariants={variants}
      />
    </>
  );
}
