"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Container,
  Title,
  Stack,
  Loader,
  Center,
  Pagination,
  Group,
  Button,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useDebouncedValue, useClipboard } from "@mantine/hooks";
import { IconPlus, IconUpload, IconSearch, IconShare } from "@tabler/icons-react";
import { useAuth } from "@/lib/AuthProvider";
import { useGetInventoryQuery, useDeleteFromInventoryMutation } from "@/lib/api";
import { userProfileRoutes, loginRoute } from "@/lib/routes";
import AddInventoryPanel from "@/components/AddInventoryPanel";
import ImportInventoryPanel from "@/components/ImportInventoryPanel";
import InventoryTable from "@/components/InventoryTable";
import InventoryGrid from "@/components/InventoryGrid";
import InventoryViewToggle, { ViewMode } from "@/components/InventoryViewToggle";

const VIEW_MODE_KEY = "inventory-view-mode";

function InventoryPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading, isLoggingOut } = useAuth();
  const [panelOpened, setPanelOpened] = useState(() => searchParams.get("open") === "add");
  const [importPanelOpened, setImportPanelOpened] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const isFirstRender = useRef(true);
  const clipboard = useClipboard({ timeout: 2000 });

  const page = parseInt(searchParams.get("page") || "1", 10);

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

  const {
    data: inventoryData,
    isLoading,
    error,
  } = useGetInventoryQuery(
    { page, query: debouncedSearch || undefined },
    { skip: !user }
  );

  // Reset to page 1 whenever the filter changes (but not on the initial mount,
  // so deep-linking to a specific page still works before the user types).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (page !== 1) {
      router.push("/inventory?page=1");
    }
  }, [debouncedSearch]);

  const [deleteFromInventory] = useDeleteFromInventoryMutation();

  const handleDelete = async (id: number, cardName: string) => {
    if (confirm(`¿Eliminar "${cardName}" del inventario?`)) {
      await deleteFromInventory(id);
    }
  };

  const totalPages = inventoryData
    ? Math.ceil(inventoryData.count / 20)
    : 1;

  useEffect(() => {
    if (!authLoading && !user && !isLoggingOut()) {
      const query = searchParams.toString();
      router.push(loginRoute(query ? `${pathname}?${query}` : pathname));
    }
  }, [authLoading, user, router, pathname, searchParams, isLoggingOut]);

  const handlePageChange = (newPage: number) => {
    router.push(`/inventory?page=${newPage}`);
  };

  const handleShare = () => {
    clipboard.copy(`${window.location.origin}${userProfileRoutes.inventory(user?.username ?? "")}`);
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
            <Tooltip label="¡URL copiada al portapapeles!" opened={clipboard.copied} position="bottom" withArrow>
              <Button variant="light" leftSection={<IconShare size={16} />} onClick={handleShare}>
                Compartir
              </Button>
            </Tooltip>
            <Button variant="light" leftSection={<IconUpload size={16} />} onClick={() => setImportPanelOpened(true)}>
              Importar
            </Button>
            <Button leftSection={<IconPlus size={16} />} onClick={() => setPanelOpened(true)}>
              Agregar
            </Button>
          </Group>
        </Group>

        <TextInput
          placeholder="Buscar por nombre..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          maw={400}
        />

        {viewMode === "table" ? (
          <InventoryTable
            items={inventoryData?.results ?? []}
            isLoading={isLoading}
            error={!!error}
            emptyMessage="No tienes cartas en tu inventario"
            onDelete={handleDelete}
            showMatchCount
          />
        ) : (
          <InventoryGrid
            items={inventoryData?.results ?? []}
            isLoading={isLoading}
            error={!!error}
            emptyMessage="No tienes cartas en tu inventario"
            onDelete={handleDelete}
            showMatchCount
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
        />

        <ImportInventoryPanel
          opened={importPanelOpened}
          onClose={() => setImportPanelOpened(false)}
        />
      </Stack>
    </Container>
  );
}

export default function InventoryPage() {
  return (
    <Suspense
      fallback={
        <Container size="lg" py="xl">
          <Center>
            <Loader size="lg" />
          </Center>
        </Container>
      }
    >
      <InventoryPageContent />
    </Suspense>
  );
}
