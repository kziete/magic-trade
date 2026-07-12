"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Container,
  Title,
  Stack,
  Table,
  Badge,
  Loader,
  Center,
  Text,
  Pagination,
  Group,
  Button,
  ActionIcon,
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useAuth } from "@/lib/AuthProvider";
import { useGetInventoryQuery, useDeleteFromInventoryMutation } from "@/lib/api";
import AddInventoryPanel from "@/components/AddInventoryPanel";

export default function InventoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [modalOpened, setModalOpened] = useState(false);

  const page = parseInt(searchParams.get("page") || "1", 10);

  const {
    data: inventoryData,
    isLoading,
    error,
    refetch,
  } = useGetInventoryQuery(page, {
    skip: !user,
  });

  const [deleteFromInventory] = useDeleteFromInventoryMutation();

  const handleDelete = async (id: number, cardName: string) => {
    if (confirm(`¿Eliminar "${cardName}" del inventario?`)) {
      await deleteFromInventory(id);
      refetch();
    }
  };

  const totalPages = inventoryData
    ? Math.ceil(inventoryData.count / 20)
    : 1;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const handlePageChange = (newPage: number) => {
    router.push(`/inventory?page=${newPage}`);
  };

  if (authLoading || !user) {
    return (
      <Container size="md" py="xl">
        <Center>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={1}>Mi Inventario</Title>
          <Button leftSection={<IconPlus size={16} />} onClick={() => setModalOpened(true)}>
            Agregar
          </Button>
        </Group>

        {isLoading && (
          <Center>
            <Loader size="lg" />
          </Center>
        )}

        {error && (
          <Text c="red" ta="center">
            Error al cargar inventario
          </Text>
        )}

        {!isLoading && !error && inventoryData && inventoryData.results.length > 0 && (
          <>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Carta</Table.Th>
                  <Table.Th>Set</Table.Th>
                  <Table.Th>Finish</Table.Th>
                  <Table.Th>Condición</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {inventoryData.results.map((item) => (
                  <Table.Tr key={item.id}>
                    <Table.Td>
                      <Text size="sm" fw={500}>{item.card_name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">{item.set_name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge size="sm" color={item.finish === "foil" ? "yellow" : "gray"}>
                        {item.finish}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge size="sm" color="blue">{item.condition}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleDelete(item.id, item.card_name)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            <Group justify="center">
              <Pagination
                value={page}
                onChange={handlePageChange}
                total={totalPages}
              />
            </Group>
          </>
        )}

        {!isLoading && !error && inventoryData && inventoryData.results.length === 0 && (
          <Text ta="center" c="dimmed">
            No tienes cartas en tu inventario
          </Text>
        )}

        <AddInventoryPanel
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          onSuccess={refetch}
        />
      </Stack>
    </Container>
  );
}
