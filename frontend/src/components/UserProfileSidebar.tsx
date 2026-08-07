"use client";

import { useState } from "react";
import { Card, Stack, Avatar, Text, Button } from "@mantine/core";
import { IconUser, IconMessageCircle } from "@tabler/icons-react";
import { useAuth } from "@/lib/AuthProvider";
import ContactUserPanel from "@/components/ContactUserPanel";

interface UserProfileSidebarProps {
  username: string;
}

export default function UserProfileSidebar({ username }: UserProfileSidebarProps) {
  const { user } = useAuth();
  const [contactOpened, setContactOpened] = useState(false);

  const canContact = !!user && user.username !== username;

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md" align="center">
        <Avatar size={64} radius="xl">
          <IconUser size={32} />
        </Avatar>
        <Text fw={600} size="lg">
          {username}
        </Text>

        {canContact && (
          <Button
            variant="light"
            leftSection={<IconMessageCircle size={16} />}
            onClick={() => setContactOpened(true)}
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
    </Card>
  );
}
