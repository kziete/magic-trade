"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Container,
  Title,
  Stack,
  TextInput,
  PasswordInput,
  Button,
  Alert,
  Divider,
  Text,
  Anchor,
  Group,
} from "@mantine/core";
import { IconBrandGoogle, IconBrandFacebook } from "@tabler/icons-react";
import { useRegisterMutation } from "@/lib/authApi";
import { useAuth } from "@/lib/AuthProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [registerMutation, { isLoading }] = useRegisterMutation();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    try {
      const result = await registerMutation({
        username,
        email,
        password,
      }).unwrap();
      localStorage.setItem("refreshToken", result.refresh);
      login(result.access);
      router.push("/");
    } catch (err: unknown) {
      const error = err as { data?: { error?: string } };
      setError(error.data?.error || "Error al crear la cuenta");
    }
  };

  const handleGoogleLogin = () => {
    // TODO: Implement Google OAuth flow
    alert("Google login coming soon! Configure your OAuth credentials first.");
  };

  const handleFacebookLogin = () => {
    const clientId = "1549795390081630";
    const redirectUri = encodeURIComponent(
      "http://localhost:3001/auth/callback/facebook"
    );
    const scope = encodeURIComponent("public_profile");
    const facebookAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
    window.location.href = facebookAuthUrl;
  };

  return (
    <Container size="xs" py="xl">
      <Stack gap="lg">
        <Title order={1} ta="center">
          Crear Cuenta
        </Title>

        <Stack gap="sm">
          <Button
            variant="default"
            leftSection={<IconBrandGoogle size={18} />}
            onClick={handleGoogleLogin}
            fullWidth
          >
            Continuar con Google
          </Button>
          <Button
            variant="default"
            leftSection={<IconBrandFacebook size={18} />}
            onClick={handleFacebookLogin}
            fullWidth
          >
            Continuar con Facebook
          </Button>
        </Stack>

        <Divider label="o registrate con email" labelPosition="center" />

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            {error && <Alert color="red">{error}</Alert>}

            <TextInput
              label="Usuario"
              placeholder="Tu nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <TextInput
              label="Email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <PasswordInput
              label="Contraseña"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <PasswordInput
              label="Confirmar Contraseña"
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button type="submit" loading={isLoading} fullWidth>
              Crear Cuenta
            </Button>
          </Stack>
        </form>

        <Group justify="center">
          <Text size="sm" c="dimmed">
            ¿Ya tienes cuenta?{" "}
            <Anchor component={Link} href="/login">
              Inicia sesión
            </Anchor>
          </Text>
        </Group>
      </Stack>
    </Container>
  );
}
