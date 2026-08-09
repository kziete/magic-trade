"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Group, Button, Text, Menu, Avatar, ActionIcon, Box, Container } from "@mantine/core";
import { IconUser, IconLogout, IconCards, IconUserCircle, IconHeart, IconEye } from "@tabler/icons-react";
import { useAuth } from "@/lib/AuthProvider";
import { userProfileRoutes } from "@/lib/routes";
import CardSearch from "@/components/CardSearch";

export default function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const displayName = user?.username ?? "";

  const handleLogout = () => {
    router.replace("/");
    logout();
  };

  return (
    <Box
      style={{
        borderBottom: "1px solid var(--mantine-color-dark-5)",
        background: "var(--mantine-color-dark-8)",
      }}
    >
      <Container size="lg">
        <Group h={60} justify="space-between" wrap="nowrap">
          <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
            <Text fw={650} size="lg" c="dark.0" style={{ letterSpacing: "-0.01em" }}>
              Magic Trade
            </Text>
          </Link>

          <Box mx="md" style={{ flex: 1, minWidth: 0 }}>
            <CardSearch size="sm" />
          </Box>

          <Group gap="xs" wrap="nowrap">
            {/* Desktop */}
            <Box visibleFrom="sm">
              <Link href="/inventory" style={{ textDecoration: "none" }}>
                <Button variant="subtle">Inventario</Button>
              </Link>
            </Box>
            <Box visibleFrom="sm">
              <Link href="/wishlist" style={{ textDecoration: "none" }}>
                <Button variant="subtle">Wishlist</Button>
              </Link>
            </Box>

            {/* Mobile */}
            <Box hiddenFrom="sm">
              <Link href="/inventory">
                <ActionIcon variant="subtle" size="lg">
                  <IconCards size={20} />
                </ActionIcon>
              </Link>
            </Box>
            <Box hiddenFrom="sm">
              <Link href="/wishlist">
                <ActionIcon variant="subtle" size="lg">
                  <IconHeart size={20} />
                </ActionIcon>
              </Link>
            </Box>

            {user ? (
              <>
                {/* Desktop */}
                <Box visibleFrom="sm">
                  <Menu shadow="md" width={200}>
                    <Menu.Target>
                      <Button
                        variant="subtle"
                        leftSection={<Avatar size="sm" radius="xl"><IconUser size={16} /></Avatar>}
                      >
                        {displayName}
                      </Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        component={Link}
                        href={userProfileRoutes.inventory(displayName)}
                        leftSection={<IconEye size={16} />}
                      >
                        Ver mi perfil público
                      </Menu.Item>
                      <Menu.Item
                        component={Link}
                        href="/profile"
                        leftSection={<IconUserCircle size={16} />}
                      >
                        Datos de contacto
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconLogout size={16} />}
                        onClick={handleLogout}
                      >
                        Cerrar sesión
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Box>

                {/* Mobile */}
                <Box hiddenFrom="sm">
                  <Menu shadow="md" width={200}>
                    <Menu.Target>
                      <ActionIcon variant="subtle" size="lg">
                        <Avatar size="sm" radius="xl">
                          <IconUser size={16} />
                        </Avatar>
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Label>{displayName}</Menu.Label>
                      <Menu.Divider />
                      <Menu.Item
                        component={Link}
                        href={userProfileRoutes.inventory(displayName)}
                        leftSection={<IconEye size={16} />}
                      >
                        Ver mi perfil público
                      </Menu.Item>
                      <Menu.Item
                        component={Link}
                        href="/profile"
                        leftSection={<IconUserCircle size={16} />}
                      >
                        Datos de contacto
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconLogout size={16} />}
                        onClick={handleLogout}
                      >
                        Cerrar sesión
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Box>
              </>
            ) : (
              <>
                {/* Desktop */}
                <Box visibleFrom="sm">
                  <Link href="/login" style={{ textDecoration: "none" }}>
                    <Button variant="outline">Iniciar sesión</Button>
                  </Link>
                </Box>

                {/* Mobile */}
                <Box hiddenFrom="sm">
                  <Link href="/login">
                    <ActionIcon variant="subtle" size="lg">
                      <IconUser size={20} />
                    </ActionIcon>
                  </Link>
                </Box>
              </>
            )}
          </Group>
        </Group>
      </Container>
    </Box>
  );
}
