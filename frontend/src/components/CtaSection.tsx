"use client";

import { ComponentType } from "react";
import Link from "next/link";
import { SimpleGrid, Card, Stack, Title, Text, Button } from "@mantine/core";
import { IconUpload } from "@tabler/icons-react";

interface CtaItem {
  id: string;
  title: string;
  description: string;
  buttonLabel: string;
  href: string;
  icon: ComponentType<{ size?: number }>;
}

const CTA_ITEMS: CtaItem[] = [
  {
    id: "upload-cards",
    title: "¿Tenés cartas para vender?",
    description: "Subí tu colección y que la gente que las busca te encuentre.",
    buttonLabel: "Subir mis cartas",
    href: "/inventory",
    icon: IconUpload,
  },
];

function CtaCard({ item }: { item: CtaItem }) {
  const Icon = item.icon;
  return (
    <Card withBorder radius="lg" p="xl">
      <Stack gap="md" justify="center" h="100%">
        <Title order={2}>{item.title}</Title>
        <Text c="dimmed">{item.description}</Text>
        <Button component={Link} href={item.href} size="md" leftSection={<Icon size={18} />}>
          {item.buttonLabel}
        </Button>
      </Stack>
    </Card>
  );
}

export default function CtaSection() {
  return (
    <SimpleGrid
      cols={{ base: 1, sm: Math.min(CTA_ITEMS.length, 2), lg: Math.min(CTA_ITEMS.length, 3) }}
      spacing="xl"
    >
      {CTA_ITEMS.map((item) => (
        <CtaCard key={item.id} item={item} />
      ))}
    </SimpleGrid>
  );
}
