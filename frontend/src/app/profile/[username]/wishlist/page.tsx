"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import {
  Stack,
  Pagination,
  Group,
  Title,
  Loader,
  Center,
  TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import { useGetUserWishlistQuery } from "@/lib/api";
import WishlistTable from "@/components/WishlistTable";
import WishlistGrid from "@/components/WishlistGrid";
import InventoryViewToggle, { ViewMode } from "@/components/InventoryViewToggle";

const VIEW_MODE_KEY = "wishlist-view-mode";

function UserWishlistPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const username = params.username as string;
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const isFirstRender = useRef(true);

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
  } = useGetUserWishlistQuery({ username, page, query: debouncedSearch || undefined });

  // Reset to page 1 whenever the filter changes (but not on the initial mount,
  // so deep-linking to a specific page still works before the user types).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (page !== 1) {
      router.push(`/profile/${username}/wishlist?page=1`);
    }
  }, [debouncedSearch]);

  const totalPages = wishlistData
    ? Math.ceil(wishlistData.count / 20)
    : 1;

  const handlePageChange = (newPage: number) => {
    router.push(`/profile/${username}/wishlist?page=${newPage}`);
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Title order={1}>Wishlist de {username}</Title>
        <InventoryViewToggle value={viewMode} onChange={handleViewModeChange} />
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
          emptyMessage={`${username} no tiene cartas en su wishlist`}
        />
      ) : (
        <WishlistGrid
          items={wishlistData?.results ?? []}
          isLoading={isLoading}
          error={!!error}
          emptyMessage={`${username} no tiene cartas en su wishlist`}
          cols={{ base: 2, xs: 2, sm: 3, md: 4 }}
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
    </Stack>
  );
}

export default function UserWishlistPage() {
  return (
    <Suspense
      fallback={
        <Center>
          <Loader size="lg" />
        </Center>
      }
    >
      <UserWishlistPageContent />
    </Suspense>
  );
}
