"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import {
  Container,
  Title,
  Stack,
  Pagination,
  Group,
} from "@mantine/core";
import { useGetUserInventoryQuery } from "@/lib/api";
import InventoryTable from "@/components/InventoryTable";
import InventoryGrid from "@/components/InventoryGrid";
import InventoryViewToggle, { ViewMode } from "@/components/InventoryViewToggle";

const VIEW_MODE_KEY = "inventory-view-mode";

export default function UserInventoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const username = params.username as string;
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
  } = useGetUserInventoryQuery({ username, page });

  const totalPages = inventoryData
    ? Math.ceil(inventoryData.count / 20)
    : 1;

  const handlePageChange = (newPage: number) => {
    router.push(`/inventory/${username}?page=${newPage}`);
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={1}>Inventario de {username}</Title>
          <InventoryViewToggle value={viewMode} onChange={handleViewModeChange} />
        </Group>

        {viewMode === "table" ? (
          <InventoryTable
            items={inventoryData?.results ?? []}
            isLoading={isLoading}
            error={!!error}
            emptyMessage={`${username} no tiene cartas en su inventario`}
          />
        ) : (
          <InventoryGrid
            items={inventoryData?.results ?? []}
            isLoading={isLoading}
            error={!!error}
            emptyMessage={`${username} no tiene cartas en su inventario`}
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
      </Stack>
    </Container>
  );
}
