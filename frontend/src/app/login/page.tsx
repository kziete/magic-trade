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
      localStorage.setItem("refreshToken", result.refresh);
      login(result.access);
      router.push("/");
    } catch {
      setError("Usuario o contraseña incorrectos");
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
          Iniciar Sesión
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

        <Divider label="o inicia sesión con tu cuenta" labelPosition="center" />

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

        <Group justify="center">
          <Text size="sm" c="dimmed">
            ¿No tienes cuenta?{" "}
            <Anchor component={Link} href="/register">
              Regístrate
            </Anchor>
          </Text>
        </Group>
      </Stack>
    </Container>
  );
}
