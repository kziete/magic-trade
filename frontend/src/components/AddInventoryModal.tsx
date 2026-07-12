"use client";

import { useState } from "react";
import {
  Modal,
  Stack,
  Select,
  Button,
  Alert,
  Autocomplete,
  Loader,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import {
  useSearchCardsQuery,
  useGetVariantsQuery,
  useAddToInventoryMutation,
} from "@/lib/api";

interface AddInventoryModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddInventoryModal({
  opened,
  onClose,
  onSuccess,
}: AddInventoryModalProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedFinish, setSelectedFinish] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [error, setError] = useState("");

  const { data: cards, isFetching: searchFetching } = useSearchCardsQuery(
    debouncedSearch,
    { skip: debouncedSearch.length < 2 }
  );

  const { data: variants } = useGetVariantsQuery(selectedCardId!, {
    skip: !selectedCardId,
  });

  const [addToInventory, { isLoading: isAdding }] = useAddToInventoryMutation();

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

  const resetForm = () => {
    setSearch("");
    setSelectedCardId(null);
    setSelectedVariant(null);
    setSelectedFinish(null);
    setSelectedCondition(null);
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedVariant || !selectedFinish || !selectedCondition) {
      setError("Por favor completa todos los campos");
      return;
    }

    setError("");

    try {
      await addToInventory({
        variant: parseInt(selectedVariant, 10),
        finish: selectedFinish,
        condition: selectedCondition,
      }).unwrap();

      resetForm();
      onSuccess();
    } catch {
      setError("Error al agregar la carta");
    }
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Agregar al Inventario" size="md">
      <Stack gap="md">
        {error && <Alert color="red">{error}</Alert>}

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
          disabled={!selectedVariant || !selectedFinish || !selectedCondition}
          fullWidth
        >
          Agregar
        </Button>
      </Stack>
    </Modal>
  );
}
