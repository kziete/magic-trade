"use client";

import Link from "next/link";
import {
  Stack,
  Card,
  Group,
  Text,
  Image,
  Badge,
  Loader,
  Center,
  Avatar,
  Anchor,
} from "@mantine/core";
import { IconUser } from "@tabler/icons-react";
import { Available } from "@/lib/api";

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
        <Card key={item.id} shadow="sm" padding="md" radius="md" withBorder>
          <Group wrap="nowrap" align="flex-start">
            <Image src={item.image} alt={item.card_name} w={100} radius="sm" />
            <Stack gap="xs" style={{ flex: 1 }}>
              <Text fw={500}>{item.card_name}</Text>
              <Text size="sm" c="dimmed">
                {item.set_name}
              </Text>
              <Group gap="xs">
                <Badge color={item.finish === "foil" ? "yellow" : "gray"}>
                  {item.finish}
                </Badge>
                <Badge color="blue">{item.condition}</Badge>
                <Badge color="grape">{item.language}</Badge>
              </Group>
              <Group gap="xs">
                <Avatar size="sm" radius="xl">
                  <IconUser size={16} />
                </Avatar>
                <Anchor component={Link} href={`/inventory/${item.username}`} size="sm">
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
