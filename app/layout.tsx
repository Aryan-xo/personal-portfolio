import type { Metadata, Viewport } from "next";
import { config } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: `${config.identity.name} — ${config.identity.title}`,
  description: config.identity.tagline,
  openGraph: {
    title: `${config.identity.name} — ${config.identity.title}`,
    description: config.identity.tagline,
    type: "profile",
  },
};

export const viewport: Viewport = {
  themeColor: "#020a02",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
