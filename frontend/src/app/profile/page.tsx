"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Container,
  Title,
  Stack,
  TextInput,
  Textarea,
  Button,
  Alert,
  Loader,
  Center,
} from "@mantine/core";
import { useAuth } from "@/lib/AuthProvider";
import { useGetMeQuery, useUpdateProfileMutation } from "@/lib/api";
import { loginRoute } from "@/lib/routes";

export default function ProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user: authUser, isLoading: authLoading, isLoggingOut } = useAuth();

  const { data: me, isLoading: meLoading } = useGetMeQuery(undefined, {
    skip: !authUser,
  });
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !authUser && !isLoggingOut()) {
      router.push(loginRoute(pathname));
    }
  }, [authLoading, authUser, router, pathname, isLoggingOut]);

  useEffect(() => {
    if (me) {
      setUsername(me.username);
      setBio(me.bio ?? "");
    }
  }, [me]);

  const handleSubmit = async () => {
    setError("");
    setSuccess(false);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError("El nombre de usuario no puede estar vacío");
      return;
    }

    try {
      await updateProfile({
        username: trimmedUsername,
        bio: bio.trim() || null,
      }).unwrap();
      setSuccess(true);
    } catch (err) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "data" in err &&
        typeof (err as { data?: { error?: string } }).data?.error === "string"
          ? (err as { data: { error: string } }).data.error
          : "Error al guardar el perfil";
      setError(message);
    }
  };

  if (authLoading || !authUser || meLoading) {
    return (
      <Container size="xs" py="xl">
        <Center>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xs" py="xl">
      <Stack gap="lg">
        <Title order={1}>Mis datos</Title>

        <Stack gap="md">
          {error && <Alert color="red">{error}</Alert>}
          {success && <Alert color="green">Perfil actualizado exitosamente</Alert>}

          <TextInput
            label="Nombre de usuario"
            placeholder="tu_usuario"
            value={username}
            onChange={(e) => setUsername(e.currentTarget.value)}
          />

          <Textarea
            label="Descripción"
            placeholder="vendo/cambio"
            value={bio}
            onChange={(e) => setBio(e.currentTarget.value)}
            autosize
            minRows={2}
          />

          <Button onClick={handleSubmit} loading={isSaving}>
            Guardar
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
