import type { Metadata } from "next";
import { MantineProvider, ColorSchemeScript } from "@mantine/core";
import StoreProvider from "@/lib/StoreProvider";
import AuthProvider from "@/lib/AuthProvider";
import Header from "@/components/Header";
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <StoreProvider>
          <MantineProvider>
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
