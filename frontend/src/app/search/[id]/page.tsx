import { notFound, permanentRedirect } from "next/navigation";
import { fetchCardServer } from "@/lib/serverApi";
import { searchRoutes } from "@/lib/routes";

export default async function CardSearchRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cardId = parseInt(id, 10);
  const card = Number.isNaN(cardId) ? null : await fetchCardServer(cardId);

  if (!card) notFound();

  permanentRedirect(searchRoutes.detail(card.id, card.name));
}
