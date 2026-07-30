"use client";

import { Container, Title, Stack, Button } from "@mantine/core";
import { IconBrandGoogle } from "@tabler/icons-react";

export default function RegisterPage() {
  const handleGoogleLogin = () => {
    const clientId =
      "515844406627-aga1ubuskj6eais72skhbi4tfq08ca9m.apps.googleusercontent.com";
    const redirectUri = encodeURIComponent(
      `${window.location.origin}/auth/callback/google`
    );
    const scope = encodeURIComponent("profile email");
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&access_type=online`;
    window.location.href = googleAuthUrl;
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
        </Stack>
      </Stack>
    </Container>
  );
}
