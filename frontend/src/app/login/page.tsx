"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Title,
  Stack,
  TextInput,
  PasswordInput,
  Button,
  Alert,
} from "@mantine/core";
import { useLoginMutation } from "@/lib/authApi";
import { useAuth } from "@/lib/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loginMutation, { isLoading }] = useLoginMutation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const result = await loginMutation({ username, password }).unwrap();
      login(result.access);
      router.push("/");
    } catch {
      setError("Usuario o contraseña incorrectos");
    }
  };

  return (
    <Container size="xs" py="xl">
      <Stack gap="lg">
        <Title order={1} ta="center">
          Iniciar Sesión
        </Title>

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            {error && <Alert color="red">{error}</Alert>}

            <TextInput
              label="Usuario"
              placeholder="Tu usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <PasswordInput
              label="Contraseña"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" loading={isLoading} fullWidth>
              Entrar
            </Button>
          </Stack>
        </form>
      </Stack>
    </Container>
  );
}
