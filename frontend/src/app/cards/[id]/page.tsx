"use client";

import { use } from "react";
import {
  Container,
  Title,
  Stack,
  Card,
  Group,
  Text,
  Image,
  Badge,
  Loader,
  Center,
} from "@mantine/core";
import { useGetAvailableQuery } from "@/lib/api";

export default function CardAvailablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const cardId = parseInt(id, 10);

  const { data: available, isLoading, error } = useGetAvailableQuery(cardId);

  if (isLoading) {
    return (
      <Container size="sm" py="xl">
        <Center>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="sm" py="xl">
        <Text c="red" ta="center">
          Error al cargar disponibles
        </Text>
      </Container>
    );
  }

  const cardName = available?.[0]?.card_name ?? "Carta";

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Title order={1} ta="center">
          {cardName}
        </Title>

        {available && available.length > 0 ? (
          <Stack gap="md">
            {available.map((item) => (
              <Card key={item.id} shadow="sm" padding="md" radius="md" withBorder>
                <Group wrap="nowrap" align="flex-start">
                  <Image
                    src={item.image}
                    alt={item.card_name}
                    w={100}
                    radius="sm"
                  />
                  <Stack gap="xs" style={{ flex: 1 }}>
                    <Text fw={500}>{item.set_name}</Text>
                    <Group gap="xs">
                      <Badge color={item.finish === "foil" ? "yellow" : "gray"}>
                        {item.finish}
                      </Badge>
                      <Badge color="blue">{item.condition}</Badge>
                    </Group>
                  </Stack>
                </Group>
              </Card>
            ))}
          </Stack>
        ) : (
          <Text ta="center" c="dimmed">
            No hay disponibles para esta carta
          </Text>
        )}
      </Stack>
    </Container>
  );
}
