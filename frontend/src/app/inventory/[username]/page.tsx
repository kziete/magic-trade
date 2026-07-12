"use client";

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

export default function UserInventoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const username = params.username as string;

  const page = parseInt(searchParams.get("page") || "1", 10);

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
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Title order={1}>Inventario de {username}</Title>

        <InventoryTable
          items={inventoryData?.results ?? []}
          isLoading={isLoading}
          error={!!error}
          emptyMessage={`${username} no tiene cartas en su inventario`}
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
      </Stack>
    </Container>
  );
}
