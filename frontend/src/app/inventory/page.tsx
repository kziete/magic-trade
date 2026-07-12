"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { useAuth } from "@/lib/AuthProvider";
import { useGetInventoryQuery } from "@/lib/api";

export default function InventoryPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const {
    data: inventory,
    isLoading,
    error,
  } = useGetInventoryQuery(undefined, {
    skip: !user,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <Container size="sm" py="xl">
        <Center>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Title order={1} ta="center">
          Mi Inventario
        </Title>

        {isLoading && (
          <Center>
            <Loader size="lg" />
          </Center>
        )}

        {error && (
          <Text c="red" ta="center">
            Error al cargar inventario
          </Text>
        )}

        {!isLoading && !error && inventory && inventory.length > 0 && (
          <Stack gap="md">
            {inventory.map((item) => (
              <Card
                key={item.id}
                shadow="sm"
                padding="md"
                radius="md"
                withBorder
              >
                <Group wrap="nowrap" align="flex-start">
                  <Image
                    src={item.image}
                    alt={item.card_name}
                    w={100}
                    radius="sm"
                  />
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
                    </Group>
                  </Stack>
                </Group>
              </Card>
            ))}
          </Stack>
        )}

        {!isLoading && !error && inventory && inventory.length === 0 && (
          <Text ta="center" c="dimmed">
            No tienes cartas en tu inventario
          </Text>
        )}
      </Stack>
    </Container>
  );
}
