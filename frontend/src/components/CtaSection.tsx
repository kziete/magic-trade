"use client";

import { ComponentType } from "react";
import Link from "next/link";
import { SimpleGrid, Card, Stack, Title, Text, Button } from "@mantine/core";
import { IconUpload, IconBellPlus } from "@tabler/icons-react";

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
    title: "¿Tienes cartas para vender o cambiar?",
    description: "Sube tu colección y que la gente que las busca te encuentre.",
    buttonLabel: "Subir mis cartas",
    href: "/inventory?open=add",
    icon: IconUpload,
  },
  {
    id: "register-wanted",
    title: "¿No encuentras lo que buscas?",
    description: "Regístralas y te avisaremos cuando esten disponibles.",
    buttonLabel: "Crear alerta",
    href: "/wishlist?open=add",
    icon: IconBellPlus,
  },
];

function CtaCard({ item }: { item: CtaItem }) {
  const Icon = item.icon;
  return (
    <Card withBorder p="xl">
      <Stack gap="md" justify="center" h="100%">
        <Title order={2}>{item.title}</Title>
        <Text c="dimmed">{item.description}</Text>
        <Button
          component={Link}
          href={item.href}
          size="md"
          leftSection={<Icon size={18} />}
        >
          {item.buttonLabel}
        </Button>
      </Stack>
    </Card>
  );
}

export default function CtaSection() {
  return (
    <SimpleGrid
      cols={{
        base: 1,
        sm: Math.min(CTA_ITEMS.length, 2),
        lg: Math.min(CTA_ITEMS.length, 3),
      }}
      spacing="xl"
    >
      {CTA_ITEMS.map((item) => (
        <CtaCard key={item.id} item={item} />
      ))}
    </SimpleGrid>
  );
}
