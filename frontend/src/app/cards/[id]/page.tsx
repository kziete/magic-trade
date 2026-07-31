"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { Container, Title, Stack } from "@mantine/core";
import {
  useGetAvailableQuery,
  useGetWishlistMatchesQuery,
  useGetInventoryWantedByQuery,
} from "@/lib/api";
import AvailableList from "@/components/AvailableList";
import WantedByList from "@/components/WantedByList";

export default function CardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const cardId = parseInt(id, 10);

  const searchParams = useSearchParams();
  const wantedParam = searchParams.get("wanted");
  const wantedId = wantedParam ? parseInt(wantedParam, 10) : null;
  const matchesMode = wantedId !== null;

  const availableParam = searchParams.get("available");
  const availableId = availableParam ? parseInt(availableParam, 10) : null;
  const wantedByMode = !matchesMode && availableId !== null;

  const availableResult = useGetAvailableQuery(
    { cardId },
    { skip: matchesMode || wantedByMode }
  );
  const matchesResult = useGetWishlistMatchesQuery(wantedId ?? 0, {
    skip: !matchesMode,
  });
  const wantedByResult = useGetInventoryWantedByQuery(availableId ?? 0, {
    skip: !wantedByMode,
  });

  const { isLoading, error } = matchesMode
    ? matchesResult
    : wantedByMode
      ? wantedByResult
      : availableResult;

  const title = matchesMode
    ? "Coincidencias con tu wishlist"
    : wantedByMode
      ? "Personas que buscan esta carta"
      : "Disponibles";

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Title order={1} ta="center">
          {title}
        </Title>

        {wantedByMode ? (
          <WantedByList
            items={wantedByResult.data}
            isLoading={isLoading}
            error={error}
            emptyMessage="Nadie está buscando esta carta todavía"
          />
        ) : (
          <AvailableList
            items={matchesMode ? matchesResult.data : availableResult.data}
            isLoading={isLoading}
            error={error}
            emptyMessage={
              matchesMode
                ? "Nadie tiene disponible la carta que buscas todavía"
                : "No hay disponibles para esta carta"
            }
          />
        )}
      </Stack>
    </Container>
  );
}
