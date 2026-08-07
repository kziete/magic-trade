"use client";

import { useEffect } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { Grid, Stack, Title, Loader, Center } from "@mantine/core";
import { useAuth } from "@/lib/AuthProvider";
import { useGetUserMatchesAvailableQuery, useGetUserMatchesWantedQuery } from "@/lib/api";
import { userProfileRoutes, loginRoute } from "@/lib/routes";
import InventoryGrid from "@/components/InventoryGrid";
import WishlistGrid from "@/components/WishlistGrid";

export default function UserMatchesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const username = params.username as string;
  const { user, isLoading: authLoading, isLoggingOut } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      if (!isLoggingOut()) {
        router.push(loginRoute(pathname));
      }
      return;
    }
    if (user.username === username) {
      router.push(userProfileRoutes.inventory(username));
    }
  }, [authLoading, user, username, router, pathname, isLoggingOut]);

  const skip = authLoading || !user || user.username === username;

  const {
    data: haveData,
    isLoading: haveLoading,
    error: haveError,
  } = useGetUserMatchesAvailableQuery(username, { skip });

  const {
    data: wantData,
    isLoading: wantLoading,
    error: wantError,
  } = useGetUserMatchesWantedQuery(username, { skip });

  if (skip) {
    return (
      <Center>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Grid gutter="lg">
      <Grid.Col span={6}>
        <Stack gap="md">
          <Title order={3}>Tiene lo que buscás</Title>
          <InventoryGrid
            items={haveData ?? []}
            isLoading={haveLoading}
            error={!!haveError}
            emptyMessage={`${username} no tiene ninguna carta que estés buscando`}
            cols={{ base: 1, sm: 2 }}
          />
        </Stack>
      </Grid.Col>

      <Grid.Col span={6}>
        <Stack gap="md">
          <Title order={3}>Busca lo que tenés</Title>
          <WishlistGrid
            items={wantData ?? []}
            isLoading={wantLoading}
            error={!!wantError}
            emptyMessage={`${username} no está buscando ninguna carta que tengas`}
            cols={{ base: 1, sm: 2 }}
          />
        </Stack>
      </Grid.Col>
    </Grid>
  );
}
