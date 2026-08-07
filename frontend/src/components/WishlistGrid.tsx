"use client";

import type { ComponentProps } from "react";
import {
  SimpleGrid,
  Card,
  Image,
  Text,
  Badge,
  Group,
  ActionIcon,
  Stack,
  Loader,
  Center,
  Box,
  Anchor,
} from "@mantine/core";
import { IconTrash, IconCards } from "@tabler/icons-react";
import Link from "next/link";
import { Wanted } from "@/lib/api";

interface WishlistGridProps {
  items: Wanted[];
  isLoading: boolean;
  error: boolean;
  emptyMessage: string;
  onDelete?: (id: number, cardName: string) => void;
  cols?: ComponentProps<typeof SimpleGrid>["cols"];
  showMatchCount?: boolean;
}

export default function WishlistGrid({
  items,
  isLoading,
  error,
  emptyMessage,
  onDelete,
  cols,
  showMatchCount = false,
}: WishlistGridProps) {
  if (isLoading) {
    return (
      <Center py="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  if (error) {
    return (
      <Text c="red" ta="center">
        Error al cargar wishlist
      </Text>
    );
  }

  if (items.length === 0) {
    return (
      <Text ta="center" c="dimmed">
        {emptyMessage}
      </Text>
    );
  }

  return (
    <SimpleGrid
      cols={cols ?? { base: 2, xs: 3, sm: 4, md: 5 }}
      spacing="md"
    >
      {items.map((item) => (
        <Card
          key={item.id}
          shadow="sm"
          padding="xs"
          radius="md"
          withBorder
          style={{ position: "relative" }}
        >
          {onDelete && (
            <ActionIcon
              variant="filled"
              color="red"
              size="sm"
              radius="xl"
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                zIndex: 10,
              }}
              onClick={() => onDelete(item.id, item.card_name)}
            >
              <IconTrash size={14} />
            </ActionIcon>
          )}

          <Card.Section pt="md" px="xs">
            {item.image ? (
              <Image
                src={item.image}
                alt={item.card_name}
                radius="lg"
              />
            ) : (
              <Box
                style={{
                  aspectRatio: "5 / 7",
                  border: "1px dashed var(--mantine-color-dark-4)",
                  borderRadius: "var(--mantine-radius-lg)",
                }}
              >
                <Center h="100%">
                  <IconCards size={48} color="var(--mantine-color-dimmed)" />
                </Center>
              </Box>
            )}
          </Card.Section>

          <Stack gap={4} mt="xs">
            <Text size="xs" fw={600} lineClamp={1}>
              {item.card_name}
            </Text>
            {item.set_name ? (
              <Text size="xs" c="dimmed" lineClamp={1}>
                {item.set_name}
              </Text>
            ) : (
              <Text size="xs" c="dimmed" fs="italic" lineClamp={1}>
                Cualquier edición
              </Text>
            )}
            <Group gap={4} wrap="wrap">
              {item.finish ? (
                <Badge size="xs" color={item.finish === "foil" ? "yellow" : "gray"}>
                  {item.finish}
                </Badge>
              ) : (
                <Badge size="xs" variant="outline" color="gray">
                  Sin preferencia
                </Badge>
              )}
              {showMatchCount && (
                item.matches_count > 0 ? (
                  <Anchor
                    component={Link}
                    href={`/cards/${item.card_id}?wanted=${item.id}`}
                    underline="never"
                  >
                    <Badge size="xs" variant="filled" color="teal" style={{ cursor: "pointer" }}>
                      {item.matches_count} coincidencia{item.matches_count === 1 ? "" : "s"}
                    </Badge>
                  </Anchor>
                ) : (
                  <Badge size="xs" variant="outline" color="gray">
                    {item.matches_count} coincidencia{item.matches_count === 1 ? "" : "s"}
                  </Badge>
                )
              )}
            </Group>
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  );
}
