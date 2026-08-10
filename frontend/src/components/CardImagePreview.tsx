"use client";

import { HoverCard, Image, ImageProps } from "@mantine/core";

interface CardImagePreviewProps extends ImageProps {
  alt?: string;
}

export default function CardImagePreview({ src, alt, ...thumbnailProps }: CardImagePreviewProps) {
  return (
    <HoverCard openDelay={500} position="right" withArrow shadow="md">
      <HoverCard.Target>
        <Image src={src} alt={alt} {...thumbnailProps} />
      </HoverCard.Target>
      <HoverCard.Dropdown p={0} style={{ border: "none", background: "transparent" }}>
        <Image src={src} alt={alt} w={320} radius="lg" />
      </HoverCard.Dropdown>
    </HoverCard>
  );
}
