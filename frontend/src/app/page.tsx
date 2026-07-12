import { Container, Title, Stack } from "@mantine/core";
import CardSearch from "@/components/CardSearch";

export default function Home() {
  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Title order={1} ta="center">
          Magic Trade
        </Title>
        <CardSearch />
      </Stack>
    </Container>
  );
}
