"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ActionIcon, Indicator, Menu, Stack, Text, Divider, ScrollArea } from "@mantine/core";
import { IconBell } from "@tabler/icons-react";
import { notifications as toast } from "@mantine/notifications";
import {
  usePollNotificationsQuery,
  useMarkAllContactsReadMutation,
  ContactNotification,
} from "@/lib/api";
import { useAuth } from "@/lib/AuthProvider";
import { playNotificationSound } from "@/lib/notificationSound";

const POLL_INTERVAL_MS = 25_000;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const { data } = usePollNotificationsQuery(undefined, {
    pollingInterval: POLL_INTERVAL_MS,
    skip: !user,
  });
  const [markAllContactsRead] = useMarkAllContactsReadMutation();

  const [displayedItems, setDisplayedItems] = useState<ContactNotification[]>([]);
  const seenIds = useRef<Set<number> | null>(null);

  // Toast solo para notificaciones que llegan mientras el usuario navega, no
  // para el backlog que ya estaba sin leer cuando se montó el componente.
  useEffect(() => {
    if (!data) return;
    const currentIds = new Set(data.unread.map((n) => n.id));

    if (seenIds.current === null) {
      seenIds.current = currentIds;
      return;
    }

    for (const contact of data.unread) {
      if (!seenIds.current.has(contact.id)) {
        toast.show({
          title: `${contact.sender_username} quiere contactarte`,
          message: contact.message,
          autoClose: 6000,
          style: { cursor: "pointer" },
          onClick: (event) => {
            // No navegar si el click fue sobre el botón de cerrar (X) del toast.
            if ((event.target as HTMLElement).closest("button")) return;
            router.push(`/notifications/${contact.id}`);
          },
        });
        playNotificationSound();
      }
    }
    seenIds.current = currentIds;
  }, [data, router]);

  if (!user) {
    return null;
  }

  const unreadCount = data?.unread_count ?? 0;

  return (
    <Menu
      shadow="md"
      width={320}
      position="bottom-end"
      onOpen={() => {
        setDisplayedItems(data?.unread ?? []);
        if ((data?.unread_count ?? 0) > 0) {
          markAllContactsRead();
        }
      }}
    >
      <Menu.Target>
        <Indicator label={unreadCount} size={16} disabled={unreadCount === 0} offset={4}>
          <ActionIcon variant="subtle" size="lg">
            <IconBell size={20} />
          </ActionIcon>
        </Indicator>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Notificaciones</Menu.Label>

        {displayedItems.length === 0 ? (
          <Text size="sm" c="dimmed" px="sm" py="xs">
            No tienes notificaciones nuevas
          </Text>
        ) : (
          <ScrollArea.Autosize mah={320}>
            {displayedItems.map((contact) => (
              <Menu.Item
                key={contact.id}
                component={Link}
                href={`/notifications/${contact.id}`}
              >
                <Stack gap={2}>
                  <Text size="sm" fw={600}>
                    {contact.sender_username} quiere contactarte
                  </Text>
                  <Text size="xs" c="dimmed" lineClamp={2}>
                    {contact.message}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {formatDate(contact.created_at)}
                  </Text>
                </Stack>
              </Menu.Item>
            ))}
          </ScrollArea.Autosize>
        )}

        <Divider my="xs" />

        <Menu.Item component={Link} href="/notifications">
          Ver historial completo
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
