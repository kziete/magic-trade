"use client";

import { CSSProperties } from "react";
import Link from "next/link";
import {
  Box,
  Title,
  Text,
  Card,
  Image,
  Stack,
  Badge,
  Group,
  Anchor,
  Loader,
  Center,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useGetLatestAvailableQuery, Available } from "@/lib/api";

const MIN_ITEMS_FOR_SMOOTH_LOOP = 6;

function MarqueeCard({ item }: { item: Available }) {
  return (
    <Card
      component={Link}
      href={`/inventory/${item.username}`}
      padding="xs"
      withBorder
      w={160}
      style={{ flex: "0 0 160px" }}
    >
      <Card.Section pt="md" px="xs">
        <Image src={item.image} alt={item.card_name} radius="lg" />
      </Card.Section>
      <Stack gap={4} mt="xs">
        <Text size="xs" fw={600} lineClamp={1}>
          {item.card_name}
        </Text>
        <Text size="xs" c="dimmed" lineClamp={1}>
          {item.set_name}
        </Text>
        <Group gap={4} wrap="wrap">
          <Badge size="xs" color={item.finish === "foil" ? "yellow" : "gray"}>
            {item.finish}
          </Badge>
          <Badge size="xs" color="blue">
            {item.condition}
          </Badge>
        </Group>
        <Anchor component="span" size="xs" c="dimmed" lineClamp={1}>
          {item.username}
        </Anchor>
      </Stack>
    </Card>
  );
}

export default function LatestCardsMarquee() {
  const { data: latest, isLoading, error } = useGetLatestAvailableQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const repeatCount = latest && latest.length < MIN_ITEMS_FOR_SMOOTH_LOOP ? 4 : 2;
  const trackItems =
    !latest || latest.length === 0
      ? []
      : prefersReducedMotion
      ? latest
      : Array.from({ length: repeatCount }, () => latest).flat();

  return (
    <Box pt="xl" style={{ borderTop: "1px solid var(--mantine-color-dark-5)" }}>
      <Title order={2} mb="md">
        Últimas cartas disponibles
      </Title>

      {isLoading && (
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      )}

      {!isLoading && error && (
        <Text c="red" ta="center">
          Error al cargar las últimas cartas disponibles
        </Text>
      )}

      {!isLoading && !error && latest && latest.length === 0 && (
        <Text ta="center" c="dimmed">
          No hay cartas disponibles todavía
        </Text>
      )}

      {!isLoading && !error && latest && latest.length > 0 && (
        <Box className="marquee-viewport">
          <Box
            className="marquee-track"
            style={{ "--marquee-end": `-${100 / repeatCount}%` } as CSSProperties}
          >
            {trackItems.map((item, i) => (
              <MarqueeCard key={`${item.id}-${i}`} item={item} />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
