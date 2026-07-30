"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Container, Loader, Center, Alert, Stack, Text } from "@mantine/core";
import { useFacebookLoginMutation } from "@/lib/authApi";
import { useAuth } from "@/lib/AuthProvider";

function FacebookCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [facebookLogin] = useFacebookLoginMutation();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError("Acceso denegado por Facebook");
      return;
    }

    if (code) {
      handleFacebookCallback(code);
    }
  }, [searchParams]);

  const handleFacebookCallback = async (code: string) => {
    try {
      const result = await facebookLogin({ code }).unwrap();
      localStorage.setItem("refreshToken", result.refresh);
      login(result.access);
      router.push("/");
    } catch {
      setError("Error al iniciar sesión con Facebook");
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
          <Text>Iniciando sesión con Facebook...</Text>
        </Stack>
      </Center>
    </Container>
  );
}

export default function FacebookCallbackPage() {
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
      <FacebookCallbackContent />
    </Suspense>
  );
}
