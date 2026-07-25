import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Allô Services — Demo",
  description:
    "Universal citizen service gateway demo / Démo du guichet numérique universel",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
