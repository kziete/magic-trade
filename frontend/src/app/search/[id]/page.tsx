"use client";

import { use, useState } from "react";
import {
  Container,
  Title,
  Stack,
  Select,
  Grid,
} from "@mantine/core";
import { useGetCardQuery, useGetAvailableQuery, useGetVariantsQuery } from "@/lib/api";
import CardSearch from "@/components/CardSearch";
import AvailableList from "@/components/AvailableList";

export default function CardSearchDetailPage({
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

        <AvailableList
          items={available}
          isLoading={isLoading}
          error={error}
          emptyMessage="No hay disponibles para esta carta"
        />
      </Stack>
    </Container>
  );
}
