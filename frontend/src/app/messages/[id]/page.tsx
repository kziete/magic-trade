"use client";

import { useEffect } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { Container, Center, Loader } from "@mantine/core";
import { useAuth } from "@/lib/AuthProvider";
import { useMessagesDrawer } from "@/lib/MessagesDrawerContext";
import { loginRoute } from "@/lib/routes";

export default function OpenConversationPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const conversationId = Number(params.id);
  const { user, isLoading: authLoading, isLoggingOut } = useAuth();
  const { open } = useMessagesDrawer();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      if (!isLoggingOut()) {
        router.replace(loginRoute(pathname));
      }
      return;
    }

    if (!Number.isNaN(conversationId)) {
      open(conversationId);
    }
    router.replace("/");
  }, [authLoading, user, conversationId, open, router, pathname, isLoggingOut]);

  return (
    <Container size="sm" py="xl">
      <Center>
        <Loader size="lg" />
      </Center>
    </Container>
  );
}
