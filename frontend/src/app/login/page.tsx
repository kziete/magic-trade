"use client";

import {
  Container,
  Title,
  Stack,
  Button,
} from "@mantine/core";
import { IconBrandFacebook } from "@tabler/icons-react";

export default function LoginPage() {
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
            leftSection={<IconBrandFacebook size={18} />}
            onClick={handleFacebookLogin}
            fullWidth
          >
            Continuar con Facebook
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
