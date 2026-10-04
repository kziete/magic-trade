import { Box, Container, Group, Text, Anchor } from "@mantine/core";
import { IconBrandDiscord } from "@tabler/icons-react";

export default function Footer() {
  return (
    <Box
      style={{
        borderTop: "1px solid var(--mantine-color-dark-5)",
        background: "var(--mantine-color-dark-8)",
      }}
    >
      <Container size="lg">
        <Group h={60} justify="center" gap="xs">
          <IconBrandDiscord size={18} />
          <Text size="sm" c="dimmed">
            ¿Dudas o sugerencias? Únete a nuestro{" "}
            <Anchor
              href="https://discord.gg/uxkY3Bpy9C"
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
            >
              Discord
            </Anchor>
          </Text>
        </Group>
      </Container>
    </Box>
  );
}
