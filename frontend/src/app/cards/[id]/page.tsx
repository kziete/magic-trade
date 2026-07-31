"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { Container, Title, Stack } from "@mantine/core";
import { useGetAvailableQuery, useGetWishlistMatchesQuery } from "@/lib/api";
import AvailableList from "@/components/AvailableList";

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

  const availableResult = useGetAvailableQuery({ cardId }, { skip: matchesMode });
  const matchesResult = useGetWishlistMatchesQuery(wantedId ?? 0, {
    skip: !matchesMode,
  });

  const { data: available, isLoading, error } = matchesMode ? matchesResult : availableResult;

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Title order={1} ta="center">
          {matchesMode ? "Coincidencias con tu wishlist" : "Disponibles"}
        </Title>

        <AvailableList
          items={available}
          isLoading={isLoading}
          error={error}
          emptyMessage={
            matchesMode
              ? "Nadie tiene disponible la carta que buscas todavía"
              : "No hay disponibles para esta carta"
          }
        />
      </Stack>
    </Container>
  );
}
