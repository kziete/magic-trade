"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter, usePathname } from "next/navigation";
import { Container, Title, Stack, Loader, Center, Paper, Button, Text } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { useAuth } from "@/lib/AuthProvider";
import { useGetConversationsQuery } from "@/lib/api";
import { loginRoute, userProfileRoutes } from "@/lib/routes";
import MessageThread from "@/components/MessageThread";

const POLL_INTERVAL_MS = 15_000;

export default function ConversationPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const conversationId = Number(params.id);
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

  const conversation = conversations?.find((c) => c.id === conversationId);

  return (
    <Container size="sm" py="xl" style={{ height: "calc(100vh - 60px)", display: "flex", flexDirection: "column" }}>
      <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
        <Button
          component={Link}
          href="/messages"
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          w="fit-content"
          px={0}
        >
          Volver a mensajes
        </Button>

        {isLoading && (
          <Center>
            <Loader size="lg" />
          </Center>
        )}

        {error && <Text c="red">No se pudo cargar la conversación</Text>}

        {!isLoading && !error && !conversation && (
          <Text c="dimmed">Esta conversación no existe o no tienes acceso a ella</Text>
        )}

        {conversation && (
          <>
            <Title order={2}>
              <Text
                component={Link}
                href={userProfileRoutes.inventory(conversation.other_username)}
                inherit
              >
                {conversation.other_username}
              </Text>
            </Title>

            <Paper withBorder p="md" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <MessageThread conversationId={conversationId} />
            </Paper>
          </>
        )}
      </Stack>
    </Container>
  );
}
