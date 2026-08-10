"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Container, Title, Stack, Center, Loader, Text } from "@mantine/core";
import {
  useGetCardDetailQuery,
  useGetCardWantedByQuery,
  useGetAvailableQuery,
} from "@/lib/api";
import { useAuth } from "@/lib/AuthProvider";
import { cardRoutes } from "@/lib/routes";
import AvailableList from "@/components/AvailableList";
import WantedByList from "@/components/WantedByList";

export default function CardMatchesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const cardId = parseInt(id, 10);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const { data: cardDetail, isLoading: cardLoading, error: cardError } = useGetCardDetailQuery(
    cardId,
    { skip: !user }
  );

  const viewerHasIt = cardDetail?.viewer_has_it ?? false;
  const viewerWantsIt = cardDetail?.viewer_wants_it ?? false;
  const hasRelationship = viewerHasIt || viewerWantsIt;

  const wantedByResult = useGetCardWantedByQuery(cardId, { skip: !viewerHasIt });
  const availableResult = useGetAvailableQuery({ cardId }, { skip: !viewerWantsIt });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(cardRoutes.detail(cardId));
      return;
    }
    if (!cardLoading && cardDetail && !hasRelationship) {
      router.replace(cardRoutes.detail(cardId));
    }
  }, [authLoading, user, cardLoading, cardDetail, hasRelationship, cardId, router]);

  if (authLoading || !user || cardLoading || (cardDetail && !hasRelationship)) {
    return (
      <Container size="sm" py="xl">
        <Center>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (cardError) {
    return (
      <Container size="sm" py="xl">
        <Text c="red" ta="center">
          Error al cargar la carta
        </Text>
      </Container>
    );
  }

  return (
    <Container size="sm" py="xl">
      <Stack gap="xl">
        {viewerHasIt && (
          <Stack gap="lg">
            <Title order={2} ta="center">
              Personas que buscan esta carta
            </Title>
            <WantedByList
              items={wantedByResult.data}
              isLoading={wantedByResult.isLoading}
              error={wantedByResult.error}
              emptyMessage="Nadie más está buscando esta carta todavía"
            />
          </Stack>
        )}

        {viewerWantsIt && (
          <Stack gap="lg">
            <Title order={2} ta="center">
              Quiénes la tienen disponible
            </Title>
            <AvailableList
              items={availableResult.data}
              isLoading={availableResult.isLoading}
              error={availableResult.error}
              emptyMessage="Nadie tiene esta carta disponible todavía"
            />
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
