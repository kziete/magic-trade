"use client";

import { Image, ImageProps } from "@mantine/core";
import CardHoverPreview from "@/components/CardHoverPreview";

interface CardImagePreviewProps extends ImageProps {
  alt?: string;
}

export default function CardImagePreview({ src, alt, ...thumbnailProps }: CardImagePreviewProps) {
  return (
    <CardHoverPreview src={src as string | null} alt={alt ?? ""}>
      <Image src={src} alt={alt} {...thumbnailProps} />
    </CardHoverPreview>
  );
}
