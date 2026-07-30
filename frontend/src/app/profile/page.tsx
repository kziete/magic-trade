"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Title,
  Stack,
  TextInput,
  Button,
  Alert,
  Loader,
  Center,
} from "@mantine/core";
import { useAuth } from "@/lib/AuthProvider";
import { useGetMeQuery, useUpdateProfileMutation } from "@/lib/authApi";

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useAuth();

  const { data: me, isLoading: meLoading } = useGetMeQuery(undefined, {
    skip: !authUser,
  });
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();

  const [phone, setPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push("/login");
    }
  }, [authLoading, authUser, router]);

  useEffect(() => {
    if (me) {
      setPhone(me.phone ?? "");
      setContactEmail(me.contact_email ?? "");
      setFacebookUrl(me.facebook_url ?? "");
    }
  }, [me]);

  const handleSubmit = async () => {
    setError("");
    setSuccess(false);
    try {
      await updateProfile({
        phone: phone.trim() || null,
        contact_email: contactEmail.trim() || null,
        facebook_url: facebookUrl.trim() || null,
      }).unwrap();
      setSuccess(true);
    } catch {
      setError("Error al guardar el perfil");
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
        <Title order={1}>Mi perfil</Title>

        <Stack gap="md">
          {error && <Alert color="red">{error}</Alert>}
          {success && <Alert color="green">Perfil actualizado exitosamente</Alert>}

          <TextInput
            label="Teléfono"
            placeholder="Ej: +54 9 11 1234-5678"
            value={phone}
            onChange={(e) => setPhone(e.currentTarget.value)}
          />

          <TextInput
            label="Email de contacto"
            placeholder="contacto@ejemplo.com"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.currentTarget.value)}
          />

          <TextInput
            label="Facebook"
            placeholder="https://facebook.com/tu-perfil"
            value={facebookUrl}
            onChange={(e) => setFacebookUrl(e.currentTarget.value)}
          />

          <Button onClick={handleSubmit} loading={isSaving}>
            Guardar
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
