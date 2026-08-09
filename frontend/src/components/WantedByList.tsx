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
import { Wanted } from "@/lib/api";
import { userProfileRoutes } from "@/lib/routes";

interface WantedByListProps {
  items?: Wanted[];
  isLoading: boolean;
  error: unknown;
  emptyMessage: string;
}

export default function WantedByList({
  items,
  isLoading,
  error,
  emptyMessage,
}: WantedByListProps) {
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
        Error al cargar la wishlist
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
            {item.image && <Image src={item.image} alt={item.card_name} w={100} radius="sm" />}
            <Stack gap="xs" style={{ flex: 1 }}>
              <Text fw={500}>{item.card_name}</Text>
              {item.set_name ? (
                <Text size="sm" c="dimmed">
                  {item.set_name}
                </Text>
              ) : (
                <Text size="sm" c="dimmed" fs="italic">
                  Cualquier edición
                </Text>
              )}
              {item.finish ? (
                <Badge color={item.finish === "foil" ? "yellow" : "gray"}>
                  {item.finish}
                </Badge>
              ) : (
                <Badge variant="outline" color="gray">
                  Sin preferencia
                </Badge>
              )}
              <Group gap="xs">
                <Avatar size="sm" radius="xl">
                  <IconUser size={16} />
                </Avatar>
                <Anchor component={Link} href={userProfileRoutes.wishlist(item.username)} size="sm">
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
