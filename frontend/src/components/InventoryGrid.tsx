"use client";

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
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { Available } from "@/lib/api";

interface InventoryGridProps {
  items: Available[];
  isLoading: boolean;
  error: boolean;
  emptyMessage: string;
  onDelete?: (id: number, cardName: string) => void;
}

export default function InventoryGrid({
  items,
  isLoading,
  error,
  emptyMessage,
  onDelete,
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
      cols={{ base: 2, xs: 3, sm: 4, md: 5 }}
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
            <Image
              src={item.image}
              alt={item.card_name}
              radius="md"
              style={{
                border: "2px solid #fff",
              }}
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
              <Badge size="xs" color={item.finish === "foil" ? "yellow" : "gray"}>
                {item.finish}
              </Badge>
              <Badge size="xs" color="blue">
                {item.condition}
              </Badge>
              <Badge size="xs" color="grape">
                {item.language}
              </Badge>
            </Group>
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  );
}
