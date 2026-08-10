"use client";

import type { ComponentProps } from "react";
import {
  SimpleGrid,
  Card,
  Text,
  Badge,
  Group,
  ActionIcon,
  Stack,
  Loader,
  Center,
  Box,
  Tooltip,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import Link from "next/link";
import { Available } from "@/lib/api";
import { DEFAULT_FINISH, DEFAULT_CONDITION, DEFAULT_LANGUAGE, DEFAULT_QUANTITY } from "@/lib/cardDefaults";
import CardImagePreview from "@/components/CardImagePreview";
import { cardRoutes } from "@/lib/routes";

interface InventoryGridProps {
  items: Available[];
  isLoading: boolean;
  error: boolean;
  emptyMessage: string;
  onDelete?: (id: number, cardName: string) => void;
  cols?: ComponentProps<typeof SimpleGrid>["cols"];
  showMatchCount?: boolean;
}

export default function InventoryGrid({
  items,
  isLoading,
  error,
  emptyMessage,
  onDelete,
  cols,
  showMatchCount = false,
}: InventoryGridProps) {
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
        Error al cargar inventario
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
          padding="xs"
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
            <CardImagePreview
              src={item.image}
              alt={item.card_name}
              radius="lg"
            />
          </Card.Section>

          <Stack gap={4} mt="xs">
            <Text size="xs" fw={600} lineClamp={1}>
              {item.card_name}
            </Text>
            <Text size="xs" c="dimmed" lineClamp={1}>
              {item.set_name}
            </Text>
            <Group gap={4} wrap="wrap">
              {item.finish !== DEFAULT_FINISH && (
                <Tooltip label="Foil">
                  <Badge size="xs" variant="outline" color="yellow">F</Badge>
                </Tooltip>
              )}
              {item.condition !== DEFAULT_CONDITION && (
                <Badge size="xs" variant="outline" color="gray">
                  {item.condition}
                </Badge>
              )}
              {item.language !== DEFAULT_LANGUAGE && (
                <Badge size="xs" variant="outline" color="gray">
                  {item.language}
                </Badge>
              )}
              {item.quantity > DEFAULT_QUANTITY && (
                <Badge size="xs" variant="outline" color="gray">
                  ×{item.quantity}
                </Badge>
              )}
              {showMatchCount && item.wanted_count > 0 && (
                <Badge
                  component={Link}
                  href={cardRoutes.matches(item.card_id)}
                  size="xs"
                  variant="filled"
                  color="teal"
                  style={{ cursor: "pointer", textDecoration: "none" }}
                >
                  {item.wanted_count} busca{item.wanted_count === 1 ? "" : "n"}
                </Badge>
              )}
            </Group>
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  );
}
