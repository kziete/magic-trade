"use client";

import { createTheme, MantineColorsTuple } from "@mantine/core";

const brand: MantineColorsTuple = [
  "#f0f4ff",
  "#dce4f5",
  "#b4c6e7",
  "#8aa6da",
  "#678bcf",
  "#517ac9",
  "#4471c7",
  "#3560b0",
  "#2c559e",
  "#1e498d",
];

export const theme = createTheme({
  primaryColor: "brand",
  primaryShade: { dark: 7 },
  colors: {
    brand,
    dark: [
      "#f5f5f5",
      "#e4e4e7",
      "#9a9a9f",
      "#6b6b70",
      "#3a3a3f",
      "#2a2a2e",
      "#212124",
      "#18181b",
      "#111113",
      "#0a0a0b",
    ],
  },
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
  headings: {
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
    fontWeight: "600",
    sizes: {
      h1: { fontSize: "28px", lineHeight: "1.25", fontWeight: "650" },
      h2: { fontSize: "22px", lineHeight: "1.3", fontWeight: "600" },
      h3: { fontSize: "18px", lineHeight: "1.35", fontWeight: "600" },
      h4: { fontSize: "16px", lineHeight: "1.4", fontWeight: "550" },
    },
  },
  radius: {
    xs: "2px",
    sm: "4px",
    md: "6px",
    lg: "10px",
    xl: "999px",
  },
  defaultRadius: "sm",
  components: {
    Button: {
      defaultProps: {
        radius: "sm",
      },
    },
    Card: {
      defaultProps: {
        radius: "sm",
        shadow: "none",
      },
    },
    Select: {
      defaultProps: {
        radius: "sm",
      },
    },
    TextInput: {
      defaultProps: {
        radius: "sm",
      },
    },
    Autocomplete: {
      defaultProps: {
        radius: "sm",
      },
    },
    Badge: {
      defaultProps: {
        radius: "xl",
      },
    },
    Table: {
      styles: {
        table: {
          borderRadius: "var(--mantine-radius-sm)",
          overflow: "hidden",
        },
      },
    },
  },
});
