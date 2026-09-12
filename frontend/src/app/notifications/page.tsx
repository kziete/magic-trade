"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Container,
  Title,
  Stack,
  Loader,
  Center,
  Pagination,
  Group,
  Card,
  Text,
  Button,
  Badge,
} from "@mantine/core";
import { useAuth } from "@/lib/AuthProvider";
import { useGetContactHistoryQuery, useMarkContactReadMutation } from "@/lib/api";
import { loginRoute } from "@/lib/routes";

const PAGE_SIZE = 20;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function NotificationsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading, isLoggingOut } = useAuth();

  const page = parseInt(searchParams.get("page") || "1", 10);

  const { data, isLoading, error } = useGetContactHistoryQuery(
    { page },
    { skip: !user }
  );
  const [markContactRead, { isLoading: isMarking }] = useMarkContactReadMutation();

  useEffect(() => {
    if (!authLoading && !user && !isLoggingOut()) {
      router.push(loginRoute(pathname));
    }
  }, [authLoading, user, router, pathname, isLoggingOut]);

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 1;

  const handlePageChange = (newPage: number) => {
    router.push(`/notifications?page=${newPage}`);
  };

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
        <Title order={1}>Historial de contactos</Title>

        {isLoading && (
          <Center>
            <Loader size="lg" />
          </Center>
        )}

        {error && <Text c="red">No se pudo cargar el historial</Text>}

        {!isLoading && !error && data?.results.length === 0 && (
          <Text c="dimmed">Todavía no recibiste ningún contacto</Text>
        )}

        {!isLoading && !error && data && data.results.length > 0 && (
          <Stack gap="sm">
            {data.results.map((contact) => (
              <Card
                key={contact.id}
                withBorder
                padding="md"
                onClick={() => router.push(`/notifications/${contact.id}`)}
                style={{ cursor: "pointer" }}
              >
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Stack gap={4}>
                    <Group gap="xs">
                      <Text fw={600}>{contact.sender_username}</Text>
                      {!contact.is_read && <Badge size="sm" color="blue">Nuevo</Badge>}
                    </Group>
                    <Text size="sm">{contact.message}</Text>
                    <Text size="xs" c="dimmed">
                      {formatDate(contact.created_at)}
                    </Text>
                  </Stack>
                  {!contact.is_read && (
                    <Button
                      variant="subtle"
                      size="xs"
                      loading={isMarking}
                      onClick={(event) => {
                        event.stopPropagation();
                        markContactRead(contact.id);
                      }}
                    >
                      Marcar como leído
                    </Button>
                  )}
                </Group>
              </Card>
            ))}
          </Stack>
        )}

        {!isLoading && !error && data && data.results.length > 0 && (
          <Group justify="center">
            <Pagination value={page} onChange={handlePageChange} total={totalPages} />
          </Group>
        )}
      </Stack>
    </Container>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <Container size="sm" py="xl">
          <Center>
            <Loader size="lg" />
          </Center>
        </Container>
      }
    >
      <NotificationsPageContent />
    </Suspense>
  );
}
