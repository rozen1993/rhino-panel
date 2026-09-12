import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DA VINCI",
  description: "Plataforma de gestión de actividades de DA VINCI",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
