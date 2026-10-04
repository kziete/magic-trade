import type { Metadata } from "next";
import { MantineProvider, ColorSchemeScript, Box } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import StoreProvider from "@/lib/StoreProvider";
import AuthProvider from "@/lib/AuthProvider";
import MessagesDrawerProvider from "@/lib/MessagesDrawerContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MessagesDrawer from "@/components/MessagesDrawer";
import { theme } from "@/lib/theme";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://cardtones.com"),
  title: "Cardtones",
  description: "Trade Magic cards",
  openGraph: {
    title: "Cardtones",
    description: "Trade Magic cards",
    url: "https://cardtones.com",
    siteName: "Cardtones",
    locale: "es_CL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cardtones",
    description: "Trade Magic cards",
  },
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
            <Notifications position="bottom-right" />
            <AuthProvider>
              <MessagesDrawerProvider>
                <Header />
                <Box style={{ flex: 1 }}>{children}</Box>
                <Footer />
                <MessagesDrawer />
              </MessagesDrawerProvider>
            </AuthProvider>
          </MantineProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
