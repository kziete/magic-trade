"use client";

import {
  Table,
  Badge,
  Loader,
  Center,
  Text,
  ActionIcon,
  Anchor,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import Link from "next/link";
import { Wanted } from "@/lib/api";

interface WishlistTableProps {
  items: Wanted[];
  isLoading: boolean;
  error: boolean;
  emptyMessage: string;
  onDelete?: (id: number, cardName: string) => void;
  showMatchCount?: boolean;
}

export default function WishlistTable({
  items,
  isLoading,
  error,
  emptyMessage,
  onDelete,
  showMatchCount = false,
}: WishlistTableProps) {
  if (isLoading) {
    return (
      <Center>
        <Loader size="lg" />
      </Center>
    );
  }

  if (error) {
    return (
      <Text c="red" ta="center">
        Error al cargar wishlist
      </Text>
    );
  }

  if (items.length === 0) {
    return (
      <Text ta="center" c="dimmed">
        {emptyMessage}
      </Text>
    );
  }

  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Carta</Table.Th>
          <Table.Th>Set</Table.Th>
          <Table.Th>Finish</Table.Th>
          {showMatchCount && <Table.Th>Coincidencias</Table.Th>}
          {onDelete && <Table.Th></Table.Th>}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {items.map((item) => (
          <Table.Tr key={item.id}>
            <Table.Td>
              <Text size="sm" fw={500}>{item.card_name}</Text>
            </Table.Td>
            <Table.Td>
              {item.set_name ? (
                <Text size="sm" c="dimmed">{item.set_name}</Text>
              ) : (
                <Text size="sm" c="dimmed" fs="italic">Cualquier edición</Text>
              )}
            </Table.Td>
            <Table.Td>
              {item.finish ? (
                <Badge size="sm" color={item.finish === "foil" ? "yellow" : "gray"}>
                  {item.finish}
                </Badge>
              ) : (
                <Badge size="sm" variant="outline" color="gray">Sin preferencia</Badge>
              )}
            </Table.Td>
            {showMatchCount && (
              <Table.Td>
                {item.matches_count > 0 ? (
                  <Anchor
                    component={Link}
                    href={`/cards/${item.card_id}?wanted=${item.id}`}
                    underline="never"
                  >
                    <Badge size="sm" variant="filled" color="teal" style={{ cursor: "pointer" }}>
                      {item.matches_count}
                    </Badge>
                  </Anchor>
                ) : (
                  <Badge size="sm" variant="outline" color="gray">
                    {item.matches_count}
                  </Badge>
                )}
              </Table.Td>
            )}
            {onDelete && (
              <Table.Td>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  onClick={() => onDelete(item.id, item.card_name)}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Table.Td>
            )}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
