"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Card, Stack, Avatar, Text, Button, Modal, Group } from "@mantine/core";
import { IconUser, IconMessageCircle } from "@tabler/icons-react";
import { useAuth } from "@/lib/AuthProvider";
import { loginRoute } from "@/lib/routes";
import ContactUserPanel from "@/components/ContactUserPanel";

interface UserProfileSidebarProps {
  username: string;
}

export default function UserProfileSidebar({ username }: UserProfileSidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [contactOpened, setContactOpened] = useState(false);
  const [loginModalOpened, setLoginModalOpened] = useState(false);

  const isOwnProfile = !!user && user.username === username;

  const handleContactClick = () => {
    if (user) {
      setContactOpened(true);
    } else {
      setLoginModalOpened(true);
    }
  };

  return (
    <Card padding="lg" withBorder>
      <Stack gap="md" align="center">
        <Avatar size={64} radius="xl">
          <IconUser size={32} />
        </Avatar>
        <Text fw={600} size="lg">
          {username}
        </Text>

        {!isOwnProfile && (
          <Button
            variant="light"
            leftSection={<IconMessageCircle size={16} />}
            onClick={handleContactClick}
            fullWidth
          >
            Contactar
          </Button>
        )}
      </Stack>

      <ContactUserPanel
        username={username}
        opened={contactOpened}
        onClose={() => setContactOpened(false)}
      />

      <Modal
        opened={loginModalOpened}
        onClose={() => setLoginModalOpened(false)}
        title="Inicia sesión"
        centered
      >
        <Stack gap="md">
          <Text>Necesitas iniciar sesión para contactar a otros usuarios.</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setLoginModalOpened(false)}>
              Cancelar
            </Button>
            <Button component={Link} href={loginRoute(pathname)}>
              Iniciar sesión
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Card>
  );
}
