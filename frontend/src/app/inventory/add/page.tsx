"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Title,
  Stack,
  Select,
  Button,
  Alert,
  Card,
  Text,
  Autocomplete,
  Loader,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useAuth } from "@/lib/AuthProvider";
import {
  useSearchCardsQuery,
  useGetVariantsQuery,
  useAddToInventoryMutation,
} from "@/lib/api";

export default function AddInventoryPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedFinish, setSelectedFinish] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { data: cards, isFetching: searchFetching } = useSearchCardsQuery(
    debouncedSearch,
    { skip: debouncedSearch.length < 2 }
  );

  const { data: variants } = useGetVariantsQuery(selectedCardId!, {
    skip: !selectedCardId,
  });

  const [addToInventory, { isLoading: isAdding }] = useAddToInventoryMutation();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const cardOptions =
    cards?.map((card) => ({
      value: card.id.toString(),
      label: card.name,
    })) ?? [];

  const variantOptions =
    variants?.map((v) => ({
      value: v.id.toString(),
      label: `${v.set_name} (#${v.collector_number})`,
    })) ?? [];

  // Get available finishes from selected variant
  const selectedVariantData = variants?.find(
    (v) => v.id.toString() === selectedVariant
  );
  const finishOptions =
    selectedVariantData?.finishes.map((f) => ({
      value: f,
      label: f === "foil" ? "Foil" : "Non-Foil",
    })) ?? [];

  const handleCardSelect = (value: string) => {
    const card = cards?.find((c) => c.id.toString() === value);
    if (card) {
      setSelectedCardId(card.id);
      setSearch(card.name);
      setSelectedVariant(null);
      setSelectedFinish(null);
    }
  };

  const handleVariantChange = (value: string | null) => {
    setSelectedVariant(value);
    setSelectedFinish(null);
  };

  const handleSubmit = async () => {
    if (!selectedVariant || !selectedFinish || !selectedCondition) {
      setError("Por favor completa todos los campos");
      return;
    }

    setError("");
    setSuccess(false);

    try {
      await addToInventory({
        variant: parseInt(selectedVariant, 10),
        finish: selectedFinish,
        condition: selectedCondition,
      }).unwrap();

      setSuccess(true);
      // Reset form
      setSearch("");
      setSelectedCardId(null);
      setSelectedVariant(null);
      setSelectedFinish(null);
      setSelectedCondition(null);
    } catch {
      setError("Error al agregar la carta");
    }
  };

  if (authLoading || !user) {
    return (
      <Container size="sm" py="xl">
        <Loader size="lg" />
      </Container>
    );
  }

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Title order={1} ta="center">
          Agregar al Inventario
        </Title>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            {error && <Alert color="red">{error}</Alert>}
            {success && (
              <Alert color="green">Carta agregada exitosamente</Alert>
            )}

            <Autocomplete
              label="Carta"
              placeholder="Buscar carta..."
              value={search}
              onChange={setSearch}
              onOptionSubmit={handleCardSelect}
              data={cardOptions}
              rightSection={searchFetching ? <Loader size="xs" /> : null}
            />

            <Select
              label="Variante"
              placeholder="Selecciona una variante"
              data={variantOptions}
              value={selectedVariant}
              onChange={handleVariantChange}
              disabled={!selectedCardId}
            />

            <Select
              label="Finish"
              placeholder="Selecciona finish"
              data={finishOptions}
              value={selectedFinish}
              onChange={setSelectedFinish}
              disabled={!selectedVariant}
            />

            <Select
              label="Condición"
              placeholder="Selecciona condición"
              data={[
                { value: "M", label: "Mint" },
                { value: "NM", label: "Near Mint" },
              ]}
              value={selectedCondition}
              onChange={setSelectedCondition}
              disabled={!selectedVariant}
            />

            <Button
              onClick={handleSubmit}
              loading={isAdding}
              disabled={
                !selectedVariant || !selectedFinish || !selectedCondition
              }
            >
              Agregar
            </Button>
          </Stack>
        </Card>

        <Button variant="subtle" onClick={() => router.push("/inventory")}>
          Volver al inventario
        </Button>
      </Stack>
    </Container>
  );
}
