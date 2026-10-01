"use client";

import Link from "next/link";
import { Box, Button, ActionIcon, Indicator } from "@mantine/core";
import { IconMessageCircle } from "@tabler/icons-react";
import { useGetConversationsQuery } from "@/lib/api";
import { useAuth } from "@/lib/AuthProvider";

const POLL_INTERVAL_MS = 25_000;

export default function MessagesNavLink() {
  const { user } = useAuth();
  const { data: conversations } = useGetConversationsQuery(undefined, {
    pollingInterval: POLL_INTERVAL_MS,
    skip: !user,
  });

  const unreadCount = conversations?.reduce((total, c) => total + c.unread_count, 0) ?? 0;

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Desktop */}
      <Box visibleFrom="sm">
        <Indicator label={unreadCount} size={16} disabled={unreadCount === 0} offset={4}>
          <Link href="/messages" style={{ textDecoration: "none" }}>
            <Button variant="subtle">Mensajes</Button>
          </Link>
        </Indicator>
      </Box>

      {/* Mobile */}
      <Box hiddenFrom="sm">
        <Indicator label={unreadCount} size={16} disabled={unreadCount === 0} offset={4}>
          <Link href="/messages">
            <ActionIcon variant="subtle" size="lg">
              <IconMessageCircle size={20} />
            </ActionIcon>
          </Link>
        </Indicator>
      </Box>
    </>
  );
}
