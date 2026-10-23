"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, useParams, usePathname } from "next/navigation";
import {
  Title,
  Stack,
  Pagination,
  Group,
  Loader,
  Center,
  TextInput,
  Button,
  Tooltip,
} from "@mantine/core";
import { useDebouncedValue, useClipboard } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconUpload, IconSearch, IconShare, IconPhoto } from "@tabler/icons-react";
import { useAuth } from "@/lib/AuthProvider";
import {
  Available,
  useGetInventoryQuery,
  useGetUserInventoryQuery,
  useDeleteFromInventoryMutation,
  useExportInventoryMutation,
} from "@/lib/api";
import { useSortParams } from "@/lib/useSortParams";
import { userProfileRoutes } from "@/lib/routes";
import AddInventoryPanel from "@/components/AddInventoryPanel";
import EditInventoryPanel from "@/components/EditInventoryPanel";
import ImportInventoryPanel from "@/components/ImportInventoryPanel";
import InventoryTable from "@/components/InventoryTable";
import InventoryGrid from "@/components/InventoryGrid";
import InventoryViewToggle, { ViewMode } from "@/components/InventoryViewToggle";

const VIEW_MODE_KEY = "inventory-view-mode";

function UserInventoryPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const username = params.username as string;
  const { user, isLoading: authLoading } = useAuth();
  const isOwnProfile = !!user && user.username === username;

  const [panelOpened, setPanelOpened] = useState(() => searchParams.get("open") === "add");
  const [importPanelOpened, setImportPanelOpened] = useState(false);
  const [editingItem, setEditingItem] = useState<Available | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const isFirstRender = useRef(true);
  const clipboard = useClipboard({ timeout: 2000 });

  const page = parseInt(searchParams.get("page") || "1", 10);
  const { sort, order, onSortChange } = useSortParams();

  // Load view mode from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem(VIEW_MODE_KEY) as ViewMode | null;
    if (savedMode === "table" || savedMode === "grid") {
      setViewMode(savedMode);
    }
  }, []);

  // Strip a consumed ?open=add so closing the panel and refreshing (or going
  // back) doesn't reopen it.
  useEffect(() => {
    if (searchParams.get("open") === "add") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("open");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    }
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_KEY, mode);
  };

  const ownQuery = useGetInventoryQuery(
    { page, query: debouncedSearch || undefined, sort, order },
    { skip: !isOwnProfile }
  );
  const publicQuery = useGetUserInventoryQuery(
    { username, page, query: debouncedSearch || undefined, sort, order },
    { skip: isOwnProfile }
  );
  const { data: inventoryData, isLoading, error } = isOwnProfile ? ownQuery : publicQuery;

  // Reset to page 1 whenever the filter changes (but not on the initial mount,
  // so deep-linking to a specific page still works before the user types).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (page !== 1) {
      router.push(`${userProfileRoutes.inventory(username)}?page=1`);
    }
  }, [debouncedSearch]);

  const [deleteFromInventory] = useDeleteFromInventoryMutation();
  const [exportInventory, { isLoading: isExporting }] = useExportInventoryMutation();

  const handleEdit = (item: Available) => {
    setEditingItem(item);
  };

  const handleDelete = async (id: number, cardName: string) => {
    if (confirm(`¿Eliminar "${cardName}" del inventario?`)) {
      await deleteFromInventory(id);
    }
  };

  const handleExport = async () => {
    try {
      const { blob, filename, truncated } = await exportInventory().unwrap();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      if (truncated) {
        notifications.show({
          color: "yellow",
          title: "Exportación parcial",
          message: "Tu inventario tiene muchas cartas: se exportaron solo las primeras 300.",
        });
      }
    } catch {
      notifications.show({
        color: "red",
        title: "Error",
        message: "No se pudo exportar el inventario",
      });
    }
  };

  const totalPages = inventoryData
    ? Math.ceil(inventoryData.count / 20)
    : 1;

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${userProfileRoutes.inventory(username)}?${params.toString()}`);
  };

  const handleShare = () => {
    clipboard.copy(`${window.location.origin}${userProfileRoutes.inventory(username)}`);
  };

  const emptyMessage = isOwnProfile
    ? "No tienes cartas en tu inventario"
    : `${username} no tiene cartas en su inventario`;

  if (authLoading) {
    return (
      <Center>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      {isOwnProfile && (
        <Group justify="space-between" align="center">
          <Title order={2}>Mi Inventario</Title>
          <Group gap="sm">
            <Tooltip label="¡URL copiada al portapapeles!" opened={clipboard.copied} position="bottom" withArrow>
              <Button variant="light" leftSection={<IconShare size={16} />} onClick={handleShare}>
                Compartir
              </Button>
            </Tooltip>
            <Button variant="light" leftSection={<IconUpload size={16} />} onClick={() => setImportPanelOpened(true)}>
              Importar
            </Button>
            <Tooltip label="Genera un ZIP con imágenes y precios de tus cartas" position="bottom" withArrow>
              <Button
                variant="light"
                leftSection={<IconPhoto size={16} />}
                onClick={handleExport}
                loading={isExporting}
                disabled={!inventoryData || inventoryData.count === 0}
              >
                Exportar
              </Button>
            </Tooltip>
            <Button leftSection={<IconPlus size={16} />} onClick={() => setPanelOpened(true)}>
              Agregar
            </Button>
          </Group>
        </Group>
      )}

      <Group justify="space-between" align="center">
        <TextInput
          placeholder="Buscar por nombre..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          maw={400}
          style={{ flex: 1 }}
        />
        <InventoryViewToggle value={viewMode} onChange={handleViewModeChange} />
      </Group>

      {viewMode === "table" ? (
        <InventoryTable
          items={inventoryData?.results ?? []}
          isLoading={isLoading}
          error={!!error}
          emptyMessage={emptyMessage}
          onDelete={isOwnProfile ? handleDelete : undefined}
          onEdit={isOwnProfile ? handleEdit : undefined}
          showMatchCount={isOwnProfile}
          sort={sort}
          order={order}
          onSortChange={onSortChange}
        />
      ) : (
        <InventoryGrid
          items={inventoryData?.results ?? []}
          isLoading={isLoading}
          error={!!error}
          emptyMessage={emptyMessage}
          onDelete={isOwnProfile ? handleDelete : undefined}
          onEdit={isOwnProfile ? handleEdit : undefined}
          showMatchCount={isOwnProfile}
          cols={{ base: 2, xs: 2, sm: 3, md: 4 }}
          sort={sort}
          order={order}
          onSortChange={onSortChange}
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

      {isOwnProfile && (
        <>
          <AddInventoryPanel
            opened={panelOpened}
            onClose={() => setPanelOpened(false)}
          />

          <ImportInventoryPanel
            opened={importPanelOpened}
            onClose={() => setImportPanelOpened(false)}
          />

          <EditInventoryPanel
            item={editingItem}
            onClose={() => setEditingItem(null)}
          />
        </>
      )}
    </Stack>
  );
}

export default function UserInventoryPage() {
  return (
    <Suspense
      fallback={
        <Center>
          <Loader size="lg" />
        </Center>
      }
    >
      <UserInventoryPageContent />
    </Suspense>
  );
}
