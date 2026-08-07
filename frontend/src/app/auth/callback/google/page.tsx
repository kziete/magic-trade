"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Container, Loader, Center, Alert, Stack, Text } from "@mantine/core";
import { useGoogleLoginMutation } from "@/lib/authApi";
import { useAuth } from "@/lib/AuthProvider";
import { sanitizeRedirectPath } from "@/lib/routes";

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [googleLogin] = useGoogleLoginMutation();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError("Acceso denegado por Google");
      return;
    }

    if (code) {
      handleGoogleCallback(code);
    }
  }, [searchParams]);

  const handleGoogleCallback = async (code: string) => {
    try {
      const result = await googleLogin({ code }).unwrap();
      localStorage.setItem("refreshToken", result.refresh);
      await login(result.access);
      router.push(sanitizeRedirectPath(searchParams.get("state")));
    } catch {
      setError("Error al iniciar sesión con Google");
    }
  };

  if (error) {
    return (
      <Container size="xs" py="xl">
        <Stack gap="md">
          <Alert color="red">{error}</Alert>
          <Text ta="center">
            <a href="/login">Volver al login</a>
          </Text>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xs" py="xl">
      <Center>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text>Iniciando sesión con Google...</Text>
        </Stack>
      </Center>
    </Container>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <Container size="xs" py="xl">
          <Center>
            <Loader size="lg" />
          </Center>
        </Container>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
