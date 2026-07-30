"use client";

import Link from "next/link";
import {
  Container,
  Title,
  Stack,
  SimpleGrid,
  Card,
  Image,
  Text,
  Badge,
  Group,
  Anchor,
  Loader,
  Center,
} from "@mantine/core";
import CardSearch from "@/components/CardSearch";
import { useGetLatestAvailableQuery } from "@/lib/api";

export default function Home() {
  const { data: latest, isLoading, error } = useGetLatestAvailableQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Title order={1} ta="center">
          Magic Trade
        </Title>
        <Container size="sm" w="100%" p={0}>
          <CardSearch />
        </Container>

        {isLoading && (
          <Center py="xl">
            <Loader size="lg" />
          </Center>
        )}

        {error && (
          <Text c="red" ta="center">
            Error al cargar las últimas cartas disponibles
          </Text>
        )}

        {!isLoading && !error && latest && latest.length > 0 && (
          <Stack gap="md">
            <Title order={2}>Últimas cartas disponibles</Title>
            <SimpleGrid cols={{ base: 2, xs: 3, sm: 4, md: 6 }} spacing="md">
              {latest.map((item) => (
                <Card
                  key={item.id}
                  component={Link}
                  href={`/inventory/${item.username}`}
                  shadow="sm"
                  padding="xs"
                  radius="md"
                  withBorder
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
              ))}
            </SimpleGrid>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
