"use client";

import Link from "next/link";
import { Drawer, Stack, Loader, Center, Card, Text, Group, Badge, Button, Anchor } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { useGetConversationsQuery } from "@/lib/api";
import { useMessagesDrawer } from "@/lib/MessagesDrawerContext";
import { useAuth } from "@/lib/AuthProvider";
import MessageThread from "@/components/MessageThread";
import { userProfileRoutes } from "@/lib/routes";

const POLL_INTERVAL_MS = 15_000;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function MessagesDrawer() {
  const { user } = useAuth();
  const { opened, conversationId, close, showList, open } = useMessagesDrawer();

  const { data: conversations, isLoading, error } = useGetConversationsQuery(undefined, {
    skip: !user || !opened,
    pollingInterval: POLL_INTERVAL_MS,
  });

  const activeConversation = conversations?.find((c) => c.id === conversationId);

  return (
    <Drawer
      opened={opened}
      onClose={close}
      position="right"
      size="sm"
      title={
        conversationId ? (
          activeConversation ? (
            <Anchor
              component={Link}
              href={userProfileRoutes.inventory(activeConversation.other_username)}
              size="sm"
              fw={600}
              underline="hover"
            >
              {activeConversation.other_username}
            </Anchor>
          ) : (
            "Conversación"
          )
        ) : (
          "Mensajes"
        )
      }
      withOverlay={false}
      trapFocus={false}
      lockScroll={false}
      closeOnClickOutside={false}
      styles={{
        content: { display: "flex", flexDirection: "column" },
        body: { flex: 1, display: "flex", flexDirection: "column", minHeight: 0 },
      }}
    >
      {conversationId ? (
        <Stack gap="sm" style={{ flex: 1, minHeight: 0 }}>
          <Button
            variant="subtle"
            size="xs"
            leftSection={<IconArrowLeft size={14} />}
            onClick={showList}
            w="fit-content"
            px={0}
          >
            Volver a mensajes
          </Button>
          <MessageThread conversationId={conversationId} />
        </Stack>
      ) : (
        <Stack gap="sm" style={{ flex: 1, overflow: "auto" }}>
          {isLoading && (
            <Center py="lg">
              <Loader size="sm" />
            </Center>
          )}

          {error && (
            <Text c="red" size="sm">
              No se pudieron cargar tus conversaciones
            </Text>
          )}

          {!isLoading && !error && conversations?.length === 0 && (
            <Text c="dimmed" size="sm">
              Todavía no tienes conversaciones. Contacta a alguien desde su perfil.
            </Text>
          )}

          {conversations?.map((conversation) => (
            <Card
              key={conversation.id}
              withBorder
              padding="sm"
              onClick={() => open(conversation.id)}
              style={{ cursor: "pointer" }}
            >
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Stack gap={4} style={{ minWidth: 0, flex: 1 }}>
                  <Group gap="xs">
                    <Text fw={600} size="sm">
                      {conversation.other_username}
                    </Text>
                    {conversation.unread_count > 0 && (
                      <Badge size="sm" color="blue">
                        {conversation.unread_count}
                      </Badge>
                    )}
                  </Group>
                  {conversation.last_message && (
                    <Text size="xs" c="dimmed" lineClamp={1}>
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
    </Drawer>
  );
}
