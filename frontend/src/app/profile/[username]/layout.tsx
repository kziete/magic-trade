"use client";

import { ReactNode } from "react";
import { usePathname, useParams } from "next/navigation";
import { Container, Grid, Stack, Center, Loader, Text } from "@mantine/core";
import { useGetUserProfileQuery } from "@/lib/api";
import UserProfileSidebar from "@/components/UserProfileSidebar";
import UserProfileTabs, { ProfileTab } from "@/components/UserProfileTabs";

function getActiveTab(pathname: string): ProfileTab {
  return pathname.endsWith("/wishlist") ? "wishlist" : "inventory";
}

export default function UserProfileLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const username = params.username as string;
  const active = getActiveTab(pathname);

  const { data: profile, isLoading, error } = useGetUserProfileQuery(username);

  if (isLoading) {
    return (
      <Container size="lg" py="xl">
        <Center>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Center>
          <Text c="dimmed">Usuario no encontrado</Text>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 3 }}>
          <UserProfileSidebar username={username} profile={profile} />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 9 }}>
          <Stack gap="lg">
            <UserProfileTabs username={username} active={active} />
            {children}
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
