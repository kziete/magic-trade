"use client";

import { useEffect, useState } from "react";
import {
  Drawer,
  Stack,
  Select,
  Button,
  Alert,
  Group,
  Image,
  Center,
  NumberInput,
  Text,
} from "@mantine/core";
import { useGetVariantDetailQuery, useUpdateInventoryMutation, Available } from "@/lib/api";
import { priceForFinish } from "@/lib/cardPrice";

interface EditInventoryPanelProps {
  item: Available | null;
  onClose: () => void;
}

export default function EditInventoryPanel({ item, onClose }: EditInventoryPanelProps) {
  const [finish, setFinish] = useState<string | null>(null);
  const [condition, setCondition] = useState<string | null>(null);
  const [language, setLanguage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [error, setError] = useState("");

  const { data: variant } = useGetVariantDetailQuery(item?.variant_id ?? 0, {
    skip: !item,
  });

  const [updateInventory, { isLoading: isSaving }] = useUpdateInventoryMutation();

  useEffect(() => {
    if (item) {
      setFinish(item.finish);
      setCondition(item.condition);
      setLanguage(item.language);
      setQuantity(item.quantity);
      setError("");
    }
  }, [item]);

  const finishOptions =
    variant?.finishes.map((f) => ({
      value: f,
      label: f === "foil" ? "Foil" : "Non-Foil",
    })) ?? [];

  const isFormValid = finish && condition && language;

  const handleSubmit = async () => {
    if (!item || !finish || !condition || !language) {
      setError("Por favor completa todos los campos");
      return;
    }

    setError("");

    try {
      await updateInventory({
        id: item.id,
        finish,
        condition,
        language,
        quantity,
      }).unwrap();
      onClose();
    } catch {
      setError("Error al guardar los cambios");
    }
  };

  return (
    <Drawer
      opened={!!item}
      onClose={onClose}
      title="Editar Carta"
      position="right"
      size="sm"
    >
      <Stack gap="md">
        {error && <Alert color="red">{error}</Alert>}

        {item && (
          <Center>
            <Stack gap={4} align="center">
              <Image src={item.image} alt={item.card_name} radius="md" maw={180} />
              <Text size="sm" fw={500}>{item.card_name}</Text>
              <Text size="xs" c="dimmed">{item.set_name}</Text>
              <Text size="sm" c="dimmed">
                {priceForFinish(variant?.price, finish) ?? "Valor no disponible"}
              </Text>
            </Stack>
          </Center>
        )}

        <Select
          label="Finish"
          placeholder="Selecciona finish"
          data={finishOptions}
          value={finish}
          onChange={setFinish}
        />

        <Select
          label="Condición"
          placeholder="Selecciona condición"
          data={[
            { value: "M", label: "Mint" },
            { value: "NM", label: "Near Mint" },
            { value: "LP", label: "Lightly Played" },
            { value: "MP", label: "Moderately Played" },
            { value: "HP", label: "Heavily Played" },
          ]}
          value={condition}
          onChange={setCondition}
        />

        <Select
          label="Idioma"
          placeholder="Selecciona idioma"
          data={[
            { value: "EN", label: "English" },
            { value: "ES", label: "Spanish" },
            { value: "CN", label: "Chinese" },
            { value: "JP", label: "Japanese" },
            { value: "ITA", label: "Italian" },
            { value: "OTHER", label: "Other" },
          ]}
          value={language}
          onChange={setLanguage}
        />

        <NumberInput
          label="Cantidad"
          min={1}
          value={quantity}
          onChange={(value) => setQuantity(typeof value === "number" ? value : 1)}
        />

        <Group grow>
          <Button onClick={handleSubmit} loading={isSaving} disabled={!isFormValid}>
            Guardar cambios
          </Button>
        </Group>
      </Stack>
    </Drawer>
  );
}
