"use client";

import { useEffect, useRef, useState } from "react";
import { Stack, ScrollArea, Paper, Text, Group, Textarea, ActionIcon, Center, Loader } from "@mantine/core";
import { IconSend } from "@tabler/icons-react";
import { useGetConversationMessagesQuery, useSendMessageMutation } from "@/lib/api";
import { useAuth } from "@/lib/AuthProvider";

const POLL_INTERVAL_MS = 4_000;

function formatTime(value: string) {
  return new Intl.DateTimeFormat("es", { timeStyle: "short" }).format(new Date(value));
}

interface MessageThreadProps {
  conversationId: number;
}

export default function MessageThread({ conversationId }: MessageThreadProps) {
  const { user } = useAuth();
  const { data: messages, isLoading, error } = useGetConversationMessagesQuery(conversationId, {
    pollingInterval: POLL_INTERVAL_MS,
  });
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [body, setBody] = useState("");
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: "smooth" });
  }, [messages?.length]);

  const handleSend = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    setBody("");
    try {
      await sendMessage({ conversationId, body: trimmed }).unwrap();
    } catch {
      setBody(trimmed);
    }
  };

  return (
    <Stack gap="sm" h="100%">
      <ScrollArea viewportRef={viewportRef} style={{ flex: 1 }} offsetScrollbars>
        <Stack gap="xs" py="sm">
          {isLoading && (
            <Center py="xl">
              <Loader size="sm" />
            </Center>
          )}

          {error && (
            <Text c="red" ta="center" size="sm">
              No se pudo cargar la conversación
            </Text>
          )}

          {!isLoading && !error && messages?.length === 0 && (
            <Text c="dimmed" ta="center" size="sm">
              Todavía no hay mensajes. Escribe el primero.
            </Text>
          )}

          {messages?.map((m) => {
            const isMine = m.sender_username === user?.username;
            return (
              <Group key={m.id} justify={isMine ? "flex-end" : "flex-start"} wrap="nowrap">
                <Paper withBorder radius="md" p="sm" maw="75%" bg={isMine ? "blue.9" : "dark.6"}>
                  <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                    {m.body}
                  </Text>
                  <Text size="xs" c="dimmed" ta="right" mt={4}>
                    {formatTime(m.created_at)}
                  </Text>
                </Paper>
              </Group>
            );
          })}
        </Stack>
      </ScrollArea>

      <Group align="flex-end" gap="xs" wrap="nowrap">
        <Textarea
          placeholder="Escribe un mensaje..."
          value={body}
          onChange={(e) => setBody(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          autosize
          minRows={1}
          maxRows={4}
          style={{ flex: 1 }}
        />
        <ActionIcon size="lg" onClick={handleSend} loading={isSending} disabled={!body.trim()}>
          <IconSend size={18} />
        </ActionIcon>
      </Group>
    </Stack>
  );
}
