"use client";

import { Container, Stack } from "@mantine/core";
import CtaSection from "@/components/CtaSection";
import LatestCardsMarquee from "@/components/LatestCardsMarquee";

export default function Home() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <CtaSection />
        <LatestCardsMarquee />
      </Stack>
    </Container>
  );
}
