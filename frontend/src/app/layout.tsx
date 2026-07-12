import type { Metadata } from "next";
import { MantineProvider, ColorSchemeScript } from "@mantine/core";
import StoreProvider from "@/lib/StoreProvider";
import AuthProvider from "@/lib/AuthProvider";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";
import "@mantine/core/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Magic Trade",
  description: "Trade Magic cards",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-mantine-color-scheme="dark" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body>
        <StoreProvider>
          <MantineProvider theme={theme} defaultColorScheme="dark">
            <AuthProvider>
              <Header />
              {children}
            </AuthProvider>
          </MantineProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
