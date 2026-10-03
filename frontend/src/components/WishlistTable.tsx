"use client";

import {
  Table,
  Badge,
  Loader,
  Center,
  Text,
  ActionIcon,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import Link from "next/link";
import { Wanted, SortField, SortOrder } from "@/lib/api";
import CardHoverPreview from "@/components/CardHoverPreview";
import { cardRoutes } from "@/lib/routes";
import { priceForFinish } from "@/lib/cardPrice";
import SortableTh from "@/components/SortableTh";

interface WishlistTableProps {
  items: Wanted[];
  isLoading: boolean;
  error: boolean;
  emptyMessage: string;
  onDelete?: (id: number, cardName: string) => void;
  showMatchCount?: boolean;
  sort: SortField | undefined;
  order: SortOrder;
  onSortChange: (field: SortField) => void;
}

export default function WishlistTable({
  items,
  isLoading,
  error,
  emptyMessage,
  onDelete,
  showMatchCount = false,
  sort,
  order,
  onSortChange,
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
          <SortableTh field="card_name" label="Carta" activeSort={sort} order={order} onSort={onSortChange} />
          <SortableTh field="set_name" label="Set" activeSort={sort} order={order} onSort={onSortChange} />
          <Table.Th>Finish</Table.Th>
          <Table.Th>Cantidad</Table.Th>
          <SortableTh field="price" label="Precio" activeSort={sort} order={order} onSort={onSortChange} />
          {showMatchCount && <Table.Th>Coincidencias</Table.Th>}
          {onDelete && <Table.Th></Table.Th>}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {items.map((item) => (
          <Table.Tr key={item.id}>
            <Table.Td>
              <CardHoverPreview src={item.image} alt={item.card_name}>
                <Text size="sm" fw={500}>{item.card_name}</Text>
              </CardHoverPreview>
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
            <Table.Td>
              <Text size="sm">{item.quantity}</Text>
            </Table.Td>
            <Table.Td>
              <Text size="sm" fw={500}>{priceForFinish(item.price, item.finish) ?? "—"}</Text>
            </Table.Td>
            {showMatchCount && (
              <Table.Td>
                {item.matches_count > 0 ? (
                  <Badge
                    component={Link}
                    href={cardRoutes.matches(item.card_id)}
                    size="sm"
                    variant="filled"
                    color="teal"
                    style={{ cursor: "pointer", textDecoration: "none" }}
                  >
                    {item.matches_count}
                  </Badge>
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
