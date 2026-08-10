"use client";

import type { ReactNode } from "react";
import { HoverCard, Image } from "@mantine/core";

interface CardHoverPreviewProps {
  src?: string | null;
  alt: string;
  children: ReactNode;
}

export default function CardHoverPreview({ src, alt, children }: CardHoverPreviewProps) {
  if (!src) {
    return <>{children}</>;
  }

  return (
    <HoverCard openDelay={500} position="right" withArrow shadow="md">
      <HoverCard.Target>{children}</HoverCard.Target>
      <HoverCard.Dropdown p={0} style={{ border: "none", background: "transparent" }}>
        <Image src={src} alt={alt} w={320} radius="lg" />
      </HoverCard.Dropdown>
    </HoverCard>
  );
}
