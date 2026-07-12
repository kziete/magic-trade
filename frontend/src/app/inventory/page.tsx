"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Container,
  Title,
  Stack,
  Loader,
  Center,
  Pagination,
  Group,
  Button,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useAuth } from "@/lib/AuthProvider";
import { useGetInventoryQuery, useDeleteFromInventoryMutation } from "@/lib/api";
import AddInventoryPanel from "@/components/AddInventoryPanel";
import InventoryTable from "@/components/InventoryTable";

export default function InventoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [panelOpened, setPanelOpened] = useState(false);

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
          <Button leftSection={<IconPlus size={16} />} onClick={() => setPanelOpened(true)}>
            Agregar
          </Button>
        </Group>

        <InventoryTable
          items={inventoryData?.results ?? []}
          isLoading={isLoading}
          error={!!error}
          emptyMessage="No tienes cartas en tu inventario"
          onDelete={handleDelete}
        />

        {!isLoading && !error && inventoryData && inventoryData.results.length > 0 && (
          <Group justify="center">
            <Pagination
              value={page}
              onChange={handlePageChange}
              total={totalPages}
            />
          </Group>
        )}

        <AddInventoryPanel
          opened={panelOpened}
          onClose={() => setPanelOpened(false)}
          onSuccess={refetch}
        />
      </Stack>
    </Container>
  );
}
