"use client";

import { Button, Group, Text } from "@mantine/core";
import { IconChevronUp, IconChevronDown } from "@tabler/icons-react";
import { SortField, SortOrder } from "@/lib/api";

interface SortBarProps {
  sort: SortField | undefined;
  order: SortOrder;
  onSortChange: (field: SortField) => void;
}

const OPTIONS: { field: SortField; label: string }[] = [
  { field: "card_name", label: "Nombre" },
  { field: "set_name", label: "Set" },
  { field: "price", label: "Precio" },
];

export default function SortBar({ sort, order, onSortChange }: SortBarProps) {
  return (
    <Group gap={6} align="center">
      <Text size="sm" c="dimmed">
        Ordenar por:
      </Text>
      <Button.Group>
        {OPTIONS.map(({ field, label }) => {
          const isActive = sort === field;
          return (
            <Button
              key={field}
              size="xs"
              variant={isActive ? "filled" : "default"}
              onClick={() => onSortChange(field)}
              rightSection={
                isActive ? (
                  order === "asc" ? (
                    <IconChevronUp size={14} />
                  ) : (
                    <IconChevronDown size={14} />
                  )
                ) : undefined
              }
            >
              {label}
            </Button>
          );
        })}
      </Button.Group>
    </Group>
  );
}
