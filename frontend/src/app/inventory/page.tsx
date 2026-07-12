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
import { IconPlus, IconUpload } from "@tabler/icons-react";
import { useAuth } from "@/lib/AuthProvider";
import { useGetInventoryQuery, useDeleteFromInventoryMutation } from "@/lib/api";
import AddInventoryPanel from "@/components/AddInventoryPanel";
import ImportInventoryPanel from "@/components/ImportInventoryPanel";
import InventoryTable from "@/components/InventoryTable";
import InventoryGrid from "@/components/InventoryGrid";
import InventoryViewToggle, { ViewMode } from "@/components/InventoryViewToggle";

const VIEW_MODE_KEY = "inventory-view-mode";

export default function InventoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [panelOpened, setPanelOpened] = useState(false);
  const [importPanelOpened, setImportPanelOpened] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const page = parseInt(searchParams.get("page") || "1", 10);

  // Load view mode from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem(VIEW_MODE_KEY) as ViewMode | null;
    if (savedMode === "table" || savedMode === "grid") {
      setViewMode(savedMode);
    }
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_KEY, mode);
  };

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
      <Container size="lg" py="xl">
        <Center>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={1}>Mi Inventario</Title>
          <Group gap="sm">
            <InventoryViewToggle value={viewMode} onChange={handleViewModeChange} />
            <Button variant="light" leftSection={<IconUpload size={16} />} onClick={() => setImportPanelOpened(true)}>
              Importar
            </Button>
            <Button leftSection={<IconPlus size={16} />} onClick={() => setPanelOpened(true)}>
              Agregar
            </Button>
          </Group>
        </Group>

        {viewMode === "table" ? (
          <InventoryTable
            items={inventoryData?.results ?? []}
            isLoading={isLoading}
            error={!!error}
            emptyMessage="No tienes cartas en tu inventario"
            onDelete={handleDelete}
          />
        ) : (
          <InventoryGrid
            items={inventoryData?.results ?? []}
            isLoading={isLoading}
            error={!!error}
            emptyMessage="No tienes cartas en tu inventario"
            onDelete={handleDelete}
          />
        )}

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

        <ImportInventoryPanel
          opened={importPanelOpened}
          onClose={() => setImportPanelOpened(false)}
          onSuccess={refetch}
        />
      </Stack>
    </Container>
  );
}
