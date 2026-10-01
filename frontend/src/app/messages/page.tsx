"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Container, Title, Stack, Loader, Center, Card, Text, Group, Badge } from "@mantine/core";
import { useAuth } from "@/lib/AuthProvider";
import { useGetConversationsQuery } from "@/lib/api";
import { loginRoute } from "@/lib/routes";

const POLL_INTERVAL_MS = 15_000;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function MessagesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading: authLoading, isLoggingOut } = useAuth();

  const { data: conversations, isLoading, error } = useGetConversationsQuery(undefined, {
    skip: !user,
    pollingInterval: POLL_INTERVAL_MS,
  });

  useEffect(() => {
    if (!authLoading && !user && !isLoggingOut()) {
      router.push(loginRoute(pathname));
    }
  }, [authLoading, user, router, pathname, isLoggingOut]);

  if (authLoading || !user) {
    return (
      <Container size="sm" py="xl">
        <Center>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Title order={1}>Mensajes</Title>

        {isLoading && (
          <Center>
            <Loader size="lg" />
          </Center>
        )}

        {error && <Text c="red">No se pudieron cargar tus conversaciones</Text>}

        {!isLoading && !error && conversations?.length === 0 && (
          <Text c="dimmed">Todavía no tienes conversaciones. Contacta a alguien desde su perfil.</Text>
        )}

        {!isLoading && !error && conversations && conversations.length > 0 && (
          <Stack gap="sm">
            {conversations.map((conversation) => (
              <Card
                key={conversation.id}
                withBorder
                padding="md"
                onClick={() => router.push(`/messages/${conversation.id}`)}
                style={{ cursor: "pointer" }}
              >
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Stack gap={4} style={{ minWidth: 0, flex: 1 }}>
                    <Group gap="xs">
                      <Text fw={600}>{conversation.other_username}</Text>
                      {conversation.unread_count > 0 && (
                        <Badge size="sm" color="blue">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </Group>
                    {conversation.last_message && (
                      <Text size="sm" c="dimmed" lineClamp={1}>
                        {conversation.last_message.body}
                      </Text>
                    )}
                  </Stack>
                  <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                    {formatDate(conversation.last_message_at)}
                  </Text>
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
