"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Group, Button, Text, Menu, Avatar } from "@mantine/core";
import { IconUser, IconLogout } from "@tabler/icons-react";
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
      style={{ borderBottom: "1px solid #e9ecef" }}
    >
      <Link href="/" style={{ textDecoration: "none" }}>
        <Text fw={700} size="lg" c="dark">
          Magic Trade
        </Text>
      </Link>

      <Group>
        <Link href="/inventory" style={{ textDecoration: "none" }}>
          <Button variant="subtle">Inventario</Button>
        </Link>
      </Group>

      <Group>
        {user ? (
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button variant="subtle" leftSection={<Avatar size="sm" radius="xl"><IconUser size={16} /></Avatar>}>
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
        ) : (
          <Link href="/login" style={{ textDecoration: "none" }}>
            <Button variant="outline">Iniciar sesión</Button>
          </Link>
        )}
      </Group>
    </Group>
  );
}
