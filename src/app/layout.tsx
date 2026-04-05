import { type Metadata } from "next";
import { Inter, Georama } from "next/font/google";
import { ThemeProvider } from "next-themes";

import { TRPCReactProvider } from "@/trpc/react";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
});

const georama = Georama({
  subsets: ["latin"],
  variable: "--font-georama",
});

export const metadata: Metadata = {
  title: {
    default: "Worky — Gestion de chantier pour artisans",
    template: "%s | Worky",
  },
  description:
    "Gérez vos chantiers, photos, heures et factures depuis votre téléphone. La solution SaaS des artisans BTP.",
  keywords: ["chantier", "artisan", "BTP", "gestion", "facturation", "Worky"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body className={`${inter.variable} ${georama.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

