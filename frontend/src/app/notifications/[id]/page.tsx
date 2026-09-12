"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter, usePathname } from "next/navigation";
import {
  Container,
  Title,
  Stack,
  Loader,
  Center,
  Card,
  Text,
  Group,
  Anchor,
  Button,
} from "@mantine/core";
import { IconMail, IconPhone, IconBrandFacebook, IconArrowLeft } from "@tabler/icons-react";
import { useAuth } from "@/lib/AuthProvider";
import { useGetContactDetailQuery } from "@/lib/api";
import { userProfileRoutes, loginRoute } from "@/lib/routes";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ContactDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const contactId = Number(params.id);
  const { user, isLoading: authLoading, isLoggingOut } = useAuth();

  const { data, isLoading, error } = useGetContactDetailQuery(contactId, {
    skip: !user || Number.isNaN(contactId),
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
        <Button
          component={Link}
          href="/notifications"
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          w="fit-content"
          px={0}
        >
          Volver al historial
        </Button>

        {isLoading && (
          <Center>
            <Loader size="lg" />
          </Center>
        )}

        {error && <Text c="red">No se pudo cargar esta notificación</Text>}

        {!isLoading && !error && data && (
          <Stack gap="lg">
            <Stack gap={4}>
              <Title order={2}>
                <Anchor component={Link} href={userProfileRoutes.inventory(data.sender_username)}>
                  {data.sender_username}
                </Anchor>
              </Title>
              <Text c="dimmed" size="sm">
                Quiere contactarte · {formatDate(data.created_at)}
              </Text>
            </Stack>

            <Card withBorder padding="lg">
              <Text style={{ whiteSpace: "pre-wrap" }}>{data.message}</Text>
            </Card>

            <Card withBorder padding="md">
              <Stack gap="sm">
                <Text fw={600}>Datos de contacto</Text>

                {data.sender_email && (
                  <Group gap="xs">
                    <IconMail size={16} />
                    <Anchor href={`mailto:${data.sender_email}`} size="sm">
                      {data.sender_email}
                    </Anchor>
                  </Group>
                )}

                {data.sender_phone && (
                  <Group gap="xs">
                    <IconPhone size={16} />
                    <Text size="sm">{data.sender_phone}</Text>
                  </Group>
                )}

                {data.sender_facebook_url && (
                  <Group gap="xs">
                    <IconBrandFacebook size={16} />
                    <Anchor href={data.sender_facebook_url} target="_blank" rel="noopener noreferrer" size="sm">
                      {data.sender_facebook_url}
                    </Anchor>
                  </Group>
                )}

                {!data.sender_email && !data.sender_phone && !data.sender_facebook_url && (
                  <Text size="sm" c="dimmed">
                    Este usuario no dejó datos de contacto
                  </Text>
                )}
              </Stack>
            </Card>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
