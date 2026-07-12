"use client";

import { useState } from "react";
import {
  TextInput,
  Stack,
  Card,
  Text,
  Group,
  Loader,
  Center,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useSearchCardsQuery } from "@/lib/api";

export default function CardSearch() {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);

  const {
    data: cards,
    isLoading,
    isFetching,
  } = useSearchCardsQuery(debouncedSearch, {
    skip: debouncedSearch.length < 2,
  });

  return (
    <Stack gap="lg">
      <TextInput
        placeholder="Buscar cartas..."
        size="lg"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        rightSection={isFetching ? <Loader size="xs" /> : null}
      />

      {isLoading && debouncedSearch.length >= 2 && (
        <Center>
          <Loader />
        </Center>
      )}

      {cards && cards.length > 0 && (
        <Stack gap="xs">
          {cards.map((card) => (
            <Card key={card.id} shadow="sm" padding="md" radius="md" withBorder>
              <Group justify="space-between">
                <Text fw={500}>{card.name}</Text>
                <Text size="sm" c="dimmed">
                  #{card.id}
                </Text>
              </Group>
            </Card>
          ))}
        </Stack>
      )}

      {cards && cards.length === 0 && debouncedSearch.length >= 2 && (
        <Text ta="center" c="dimmed">
          No se encontraron cartas
        </Text>
      )}
    </Stack>
  );
}
