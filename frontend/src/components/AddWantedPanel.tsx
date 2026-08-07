"use client";

import { useState } from "react";
import {
  Drawer,
  Stack,
  Select,
  Button,
  Alert,
  Autocomplete,
  Loader,
  Group,
  Image,
  Center,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import {
  useSearchCardsQuery,
  useGetVariantsQuery,
  useAddToWishlistMutation,
} from "@/lib/api";

interface AddWantedPanelProps {
  opened: boolean;
  onClose: () => void;
}

export default function AddWantedPanel({
  opened,
  onClose,
}: AddWantedPanelProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedFinish, setSelectedFinish] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { data: cards, isFetching: searchFetching } = useSearchCardsQuery(
    debouncedSearch,
    { skip: debouncedSearch.length < 2 }
  );

  const { data: variants } = useGetVariantsQuery(selectedCardId!, {
    skip: !selectedCardId,
  });

  const [addToWishlist, { isLoading: isAdding }] = useAddToWishlistMutation();

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
  const finishOptions = selectedVariantData
    ? selectedVariantData.finishes.map((f) => ({
        value: f,
        label: f === "foil" ? "Foil" : "Non-Foil",
      }))
    : [
        { value: "foil", label: "Foil" },
        { value: "nonfoil", label: "Non-Foil" },
      ];

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
    // If the newly (de)selected variant no longer offers the currently
    // chosen finish, clear it rather than silently keeping an invalid value.
    if (value) {
      const variant = variants?.find((v) => v.id.toString() === value);
      if (variant && selectedFinish && !variant.finishes.includes(selectedFinish)) {
        setSelectedFinish(null);
      }
    }
  };

  const resetForm = () => {
    setSearch("");
    setSelectedCardId(null);
    setSelectedVariant(null);
    setSelectedFinish(null);
    setError("");
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (keepOpen: boolean) => {
    if (!selectedCardId) {
      setError("Por favor selecciona una carta");
      return;
    }

    setError("");
    setSuccess(false);

    try {
      await addToWishlist({
        card: selectedCardId,
        ...(selectedVariant && { variant: parseInt(selectedVariant, 10) }),
        ...(selectedFinish && { finish: selectedFinish }),
      }).unwrap();

      if (keepOpen) {
        setSuccess(true);
        setSearch("");
        setSelectedCardId(null);
        setSelectedVariant(null);
        setSelectedFinish(null);
      } else {
        resetForm();
        onClose();
      }
    } catch {
      setError("Error al agregar la carta");
    }
  };

  const isFormValid = !!selectedCardId;

  return (
    <Drawer
      opened={opened}
      onClose={handleClose}
      title="Agregar a la Wishlist"
      position="right"
      size="sm"
    >
      <Stack gap="md">
        {error && <Alert color="red">{error}</Alert>}
        {success && <Alert color="green">Carta agregada exitosamente</Alert>}

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
          label="Variante (opcional)"
          placeholder="Cualquier edición"
          data={variantOptions}
          value={selectedVariant}
          onChange={handleVariantChange}
          disabled={!selectedCardId}
          clearable
        />

        {selectedVariantData && (
          <Center>
            <Image
              src={selectedVariantData.image}
              alt={selectedVariantData.set_name}
              radius="md"
              maw={180}
            />
          </Center>
        )}

        <Select
          label="Finish (opcional)"
          placeholder="Sin preferencia"
          data={finishOptions}
          value={selectedFinish}
          onChange={setSelectedFinish}
          disabled={!selectedCardId}
          clearable
        />

        <Group grow>
          <Button
            variant="light"
            onClick={() => handleSubmit(true)}
            loading={isAdding}
            disabled={!isFormValid}
          >
            Guardar y agregar otra
          </Button>
          <Button
            onClick={() => handleSubmit(false)}
            loading={isAdding}
            disabled={!isFormValid}
          >
            Agregar
          </Button>
        </Group>
      </Stack>
    </Drawer>
  );
}
