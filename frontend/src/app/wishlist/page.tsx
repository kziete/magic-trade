"use client";

import { Suspense, useEffect, useRef, useState } from "react";
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
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useDebouncedValue, useClipboard } from "@mantine/hooks";
import { IconPlus, IconSearch, IconShare } from "@tabler/icons-react";
import { useAuth } from "@/lib/AuthProvider";
import { useGetWishlistQuery, useDeleteFromWishlistMutation } from "@/lib/api";
import { userProfileRoutes } from "@/lib/routes";
import AddWantedPanel from "@/components/AddWantedPanel";
import WishlistTable from "@/components/WishlistTable";
import WishlistGrid from "@/components/WishlistGrid";
import InventoryViewToggle, { ViewMode } from "@/components/InventoryViewToggle";

const VIEW_MODE_KEY = "wishlist-view-mode";

function WishlistPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [panelOpened, setPanelOpened] = useState(false);
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

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_KEY, mode);
  };

  const {
    data: wishlistData,
    isLoading,
    error,
    refetch,
  } = useGetWishlistQuery(
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
      router.push("/wishlist?page=1");
    }
  }, [debouncedSearch]);

  const [deleteFromWishlist] = useDeleteFromWishlistMutation();

  const handleDelete = async (id: number, cardName: string) => {
    if (confirm(`¿Eliminar "${cardName}" de la wishlist?`)) {
      await deleteFromWishlist(id);
      refetch();
    }
  };

  const totalPages = wishlistData
    ? Math.ceil(wishlistData.count / 20)
    : 1;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const handlePageChange = (newPage: number) => {
    router.push(`/wishlist?page=${newPage}`);
  };

  const handleShare = () => {
    clipboard.copy(`${window.location.origin}${userProfileRoutes.wishlist(user?.username ?? "")}`);
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
          <Title order={1}>Mi Wishlist</Title>
          <Group gap="sm">
            <InventoryViewToggle value={viewMode} onChange={handleViewModeChange} />
            <Tooltip label="¡URL copiada al portapapeles!" opened={clipboard.copied} position="bottom" withArrow>
              <Button variant="light" leftSection={<IconShare size={16} />} onClick={handleShare}>
                Compartir
              </Button>
            </Tooltip>
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
          <WishlistTable
            items={wishlistData?.results ?? []}
            isLoading={isLoading}
            error={!!error}
            emptyMessage="No tienes cartas en tu wishlist"
            onDelete={handleDelete}
          />
        ) : (
          <WishlistGrid
            items={wishlistData?.results ?? []}
            isLoading={isLoading}
            error={!!error}
            emptyMessage="No tienes cartas en tu wishlist"
            onDelete={handleDelete}
          />
        )}

        {!isLoading && !error && wishlistData && wishlistData.results.length > 0 && (
          <Group justify="center">
            <Pagination
              value={page}
              onChange={handlePageChange}
              total={totalPages}
            />
          </Group>
        )}

        <AddWantedPanel
          opened={panelOpened}
          onClose={() => setPanelOpened(false)}
          onSuccess={refetch}
        />
      </Stack>
    </Container>
  );
}

export default function WishlistPage() {
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
      <WishlistPageContent />
    </Suspense>
  );
}
