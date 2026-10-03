"use client";

import { Table, Group, Text, Center } from "@mantine/core";
import { IconChevronUp, IconChevronDown, IconSelector } from "@tabler/icons-react";
import { SortField, SortOrder } from "@/lib/api";

interface SortableThProps {
  field: SortField;
  label: string;
  activeSort: SortField | undefined;
  order: SortOrder;
  onSort: (field: SortField) => void;
}

export default function SortableTh({ field, label, activeSort, order, onSort }: SortableThProps) {
  const isActive = activeSort === field;
  const Icon = isActive ? (order === "asc" ? IconChevronUp : IconChevronDown) : IconSelector;

  return (
    <Table.Th
      onClick={() => onSort(field)}
      style={{ cursor: "pointer", userSelect: "none" }}
    >
      <Group gap={4} wrap="nowrap">
        <Text size="sm" fw={isActive ? 700 : undefined}>
          {label}
        </Text>
        <Center>
          <Icon size={14} stroke={1.5} opacity={isActive ? 1 : 0.4} />
        </Center>
      </Group>
    </Table.Th>
  );
}
