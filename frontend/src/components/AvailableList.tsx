"use client";

import Link from "next/link";
import {
  Stack,
  Card,
  Group,
  Text,
  Badge,
  Loader,
  Center,
  Avatar,
  Anchor,
  Tooltip,
} from "@mantine/core";
import { IconUser } from "@tabler/icons-react";
import { Available } from "@/lib/api";
import { userProfileRoutes } from "@/lib/routes";
import { DEFAULT_FINISH, DEFAULT_CONDITION, DEFAULT_LANGUAGE, DEFAULT_QUANTITY } from "@/lib/cardDefaults";
import CardImagePreview from "@/components/CardImagePreview";

interface AvailableListProps {
  items?: Available[];
  isLoading: boolean;
  error: unknown;
  emptyMessage: string;
}

export default function AvailableList({
  items,
  isLoading,
  error,
  emptyMessage,
}: AvailableListProps) {
  if (isLoading) {
    return (
      <Center>
        <Loader size="lg" />
      </Center>
    );
  }

  if (error) {
    return (
      <Text c="red" ta="center">
        Error al cargar disponibles
      </Text>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Text ta="center" c="dimmed">
        {emptyMessage}
      </Text>
    );
  }

  return (
    <Stack gap="md">
      {items.map((item) => (
        <Card key={item.id} padding="md" withBorder>
          <Group wrap="nowrap" align="flex-start">
            <CardImagePreview src={item.image} alt={item.card_name} w={100} radius="sm" />
            <Stack gap="xs" style={{ flex: 1 }}>
              <Text fw={500}>{item.card_name}</Text>
              <Text size="sm" c="dimmed">
                {item.set_name}
              </Text>
              <Group gap="xs">
                {item.finish !== DEFAULT_FINISH && (
                  <Tooltip label="Foil">
                    <Badge variant="outline" color="yellow">F</Badge>
                  </Tooltip>
                )}
                {item.condition !== DEFAULT_CONDITION && (
                  <Badge variant="outline" color="gray">{item.condition}</Badge>
                )}
                {item.language !== DEFAULT_LANGUAGE && (
                  <Badge variant="outline" color="gray">{item.language}</Badge>
                )}
                {item.quantity > DEFAULT_QUANTITY && (
                  <Badge variant="outline" color="gray">×{item.quantity}</Badge>
                )}
              </Group>
              <Group gap="xs">
                <Avatar size="sm" radius="xl">
                  <IconUser size={16} />
                </Avatar>
                <Anchor component={Link} href={userProfileRoutes.inventory(item.username)} size="sm">
                  {item.username}
                </Anchor>
              </Group>
            </Stack>
          </Group>
        </Card>
      ))}
    </Stack>
  );
}
