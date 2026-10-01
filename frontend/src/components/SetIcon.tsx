interface SetIconProps {
  src?: string | null;
  size?: number;
}

/**
 * Scryfall set icons are flat black SVGs meant to be recolored by the
 * consumer. Rendering them as <img> would show a black glyph on our dark
 * theme, so we use them as a CSS mask filled with the current text color.
 */
export default function SetIcon({ src, size = 16 }: SetIconProps) {
  if (!src) return null;

  return (
    <span
      style={{
        display: "inline-block",
        flexShrink: 0,
        width: size,
        height: size,
        backgroundColor: "currentColor",
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}
