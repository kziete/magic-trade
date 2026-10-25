"use client";

import { useState } from "react";
import {
  Container,
  Title,
  Text,
  Stack,
  Select,
  Grid,
  Paper,
  Group,
  Badge,
  Tooltip,
} from "@mantine/core";
import { useGetAvailableQuery, useGetVariantsQuery, useGetVariantDetailQuery, Variant } from "@/lib/api";
import CardSearch from "@/components/CardSearch";
import AvailableList from "@/components/AvailableList";
import CardImagePreview from "@/components/CardImagePreview";
import { priceForFinish } from "@/lib/cardPrice";

export default function SearchDetailClient({
  cardId,
  cardName,
  initialVariants,
}: {
  cardId: number;
  cardName: string;
  initialVariants?: Variant[];
}) {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedFinish, setSelectedFinish] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);

  const { data: variants = initialVariants } = useGetVariantsQuery(cardId);

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

  const variantOptions =
    variants?.map((v) => ({
      value: v.id.toString(),
      label: `${v.set_name} (#${v.collector_number})`,
    })) ?? [];

  // Sin variante elegida en el filtro, la imagen de la izquierda cae a la
  // primera edición conocida en vez de quedar vacía.
  const displayedVariant = selectedVariant
    ? variants?.find((v) => v.id.toString() === selectedVariant)
    : variants?.[0];

  const { data: variantDetail } = useGetVariantDetailQuery(
    displayedVariant?.id ?? 0,
    { skip: !displayedVariant }
  );

  return (
    <Container size="lg" py="xl">
      <Grid gutter="xl">
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Paper withBorder p="md" radius="md" style={{ position: "sticky", top: 16 }}>
            <Stack gap="sm" align="center">
              <Title order={1} ta="center" fz="h2">
                {cardName}
              </Title>

              {displayedVariant ? (
                <>
                  <CardImagePreview
                    src={displayedVariant.image}
                    alt={`${cardName} — ${displayedVariant.set_name}`}
                    radius="md"
                    w="100%"
                  />
                  <Text size="sm" c="dimmed" ta="center">
                    {displayedVariant.set_name} (#{displayedVariant.collector_number})
                  </Text>
                  {displayedVariant.finishes.length > 0 && (
                    <Group gap="xs" justify="center" wrap="nowrap">
                      {displayedVariant.finishes
                        .map((finish) => ({ finish, price: priceForFinish(variantDetail?.price, finish) }))
                        .filter((entry) => entry.price)
                        .map((entry, index) => (
                          <Group key={entry.finish} gap="xs" wrap="nowrap">
                            {index > 0 && (
                              <Text size="sm" fw={700} c="dimmed">
                                /
                              </Text>
                            )}
                            <Text size="sm" fw={selectedFinish === entry.finish ? 700 : 500}>
                              {entry.price}
                            </Text>
                            {entry.finish === "foil" && (
                              <Tooltip label="Foil">
                                <Badge variant="outline" color="yellow" size="xs">
                                  F
                                </Badge>
                              </Tooltip>
                            )}
                          </Group>
                        ))}
                    </Group>
                  )}
                </>
              ) : (
                <Text c="dimmed" size="sm">
                  Sin imagen disponible
                </Text>
              )}
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 8 }}>
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

            <Title order={2} fz="h4">
              Disponibles
            </Title>

            <AvailableList
              items={available}
              isLoading={isLoading}
              error={error}
              emptyMessage="No hay disponibles para esta carta"
            />
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
