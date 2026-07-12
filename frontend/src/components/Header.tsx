"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Group, Button, Text, Menu, Avatar, ActionIcon, Box } from "@mantine/core";
import { IconUser, IconLogout, IconCards } from "@tabler/icons-react";
import { useAuth } from "@/lib/AuthProvider";

export default function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <Group
      h={60}
      px="md"
      justify="space-between"
      wrap="nowrap"
      style={{ borderBottom: "1px solid #e9ecef" }}
    >
      <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
        <Text fw={700} size="lg" c="dark">
          Magic Trade
        </Text>
      </Link>

      <Group gap="xs" wrap="nowrap">
        {/* Desktop */}
        <Box visibleFrom="sm">
          <Link href="/inventory" style={{ textDecoration: "none" }}>
            <Button variant="subtle">Inventario</Button>
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
                    {user.username}
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
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
                  <Menu.Label>{user.username}</Menu.Label>
                  <Menu.Divider />
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
  );
}
