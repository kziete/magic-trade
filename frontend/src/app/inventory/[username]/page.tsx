"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import {
  Container,
  Title,
  Stack,
  Pagination,
  Group,
  Text,
  Anchor,
  Grid,
  Card,
  Avatar,
  Divider,
  Loader,
  Center,
  TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconUser, IconPhone, IconMail, IconBrandFacebook, IconSearch } from "@tabler/icons-react";
import { useGetUserInventoryQuery, useGetUserProfileQuery } from "@/lib/api";
import InventoryTable from "@/components/InventoryTable";
import InventoryGrid from "@/components/InventoryGrid";
import InventoryViewToggle, { ViewMode } from "@/components/InventoryViewToggle";

const VIEW_MODE_KEY = "inventory-view-mode";

function UserInventoryPageContent() {
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
    data: inventoryData,
    isLoading,
    error,
  } = useGetUserInventoryQuery({ username, page, query: debouncedSearch || undefined });

  // Reset to page 1 whenever the filter changes (but not on the initial mount,
  // so deep-linking to a specific page still works before the user types).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (page !== 1) {
      router.push(`/inventory/${username}?page=1`);
    }
  }, [debouncedSearch]);

  const { data: profile } = useGetUserProfileQuery(username);

  const hasContactInfo =
    profile && (profile.phone || profile.contact_email || profile.facebook_url);

  const totalPages = inventoryData
    ? Math.ceil(inventoryData.count / 20)
    : 1;

  const handlePageChange = (newPage: number) => {
    router.push(`/inventory/${username}?page=${newPage}`);
  };

  return (
    <Container size="lg" py="xl">
      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="md" align="center">
              <Avatar size={64} radius="xl">
                <IconUser size={32} />
              </Avatar>
              <Text fw={600} size="lg">
                {username}
              </Text>

              {hasContactInfo && (
                <>
                  <Divider w="100%" />
                  <Stack gap="xs" w="100%">
                    {profile.phone && (
                      <Group gap={6} wrap="nowrap">
                        <IconPhone size={16} />
                        <Text size="sm">{profile.phone}</Text>
                      </Group>
                    )}
                    {profile.contact_email && (
                      <Group gap={6} wrap="nowrap">
                        <IconMail size={16} />
                        <Text size="sm">{profile.contact_email}</Text>
                      </Group>
                    )}
                    {profile.facebook_url && (
                      <Group gap={6} wrap="nowrap">
                        <IconBrandFacebook size={16} />
                        <Anchor
                          href={profile.facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="sm"
                        >
                          Facebook
                        </Anchor>
                      </Group>
                    )}
                  </Stack>
                </>
              )}
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 9 }}>
          <Stack gap="lg">
            <Group justify="space-between" align="center">
              <Title order={1}>Inventario de {username}</Title>
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
        </Grid.Col>
      </Grid>
    </Container>
  );
}

export default function UserInventoryPage() {
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
      <UserInventoryPageContent />
    </Suspense>
  );
}
