"use client";

import { use, useState } from "react";
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
  Select,
  Grid,
  Avatar,
} from "@mantine/core";
import { IconUser } from "@tabler/icons-react";
import {
  useGetCardQuery,
  useGetAvailableQuery,
  useGetVariantsQuery,
} from "@/lib/api";
import CardSearch from "@/components/CardSearch";

export default function CardAvailablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const cardId = parseInt(id, 10);

  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedFinish, setSelectedFinish] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);

  const { data: card } = useGetCardQuery(cardId);
  const { data: variants } = useGetVariantsQuery(cardId);

  const {
    data: available,
    isLoading,
    error,
  } = useGetAvailableQuery({
    cardId,
    variant: selectedVariant ? parseInt(selectedVariant, 10) : undefined,
    finish: selectedFinish ?? undefined,
    condition: selectedCondition ?? undefined,
  });

  const cardName = card?.name ?? "";

  const variantOptions =
    variants?.map((v) => ({
      value: v.id.toString(),
      label: `${v.set_name} (#${v.collector_number})`,
    })) ?? [];

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Title order={1} ta="center">
          Disponibles
        </Title>

        <Stack gap="md">
          <CardSearch initialValue={cardName} size="md" />

          <Grid>
            <Grid.Col span={4}>
              <Select
                placeholder="Variante"
                data={variantOptions}
                value={selectedVariant}
                onChange={setSelectedVariant}
                clearable
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <Select
                placeholder="Finish"
                data={[
                  { value: "foil", label: "Foil" },
                  { value: "nonfoil", label: "Non-Foil" },
                ]}
                value={selectedFinish}
                onChange={setSelectedFinish}
                clearable
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <Select
                placeholder="Condition"
                data={[
                  { value: "M", label: "Mint" },
                  { value: "NM", label: "Near Mint" },
                ]}
                value={selectedCondition}
                onChange={setSelectedCondition}
                clearable
              />
            </Grid.Col>
          </Grid>
        </Stack>

        {isLoading && (
          <Center>
            <Loader size="lg" />
          </Center>
        )}

        {error && (
          <Text c="red" ta="center">
            Error al cargar disponibles
          </Text>
        )}

        {!isLoading && !error && available && available.length > 0 && (
          <Stack gap="md">
            {available.map((item) => (
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
                    <Group gap="xs">
                      <Avatar size="sm" radius="xl">
                        <IconUser size={16} />
                      </Avatar>
                      <Text size="sm">kziete</Text>
                    </Group>
                  </Stack>
                </Group>
              </Card>
            ))}
          </Stack>
        )}

        {!isLoading && !error && available && available.length === 0 && (
          <Text ta="center" c="dimmed">
            No hay disponibles para esta carta
          </Text>
        )}
      </Stack>
    </Container>
  );
}
