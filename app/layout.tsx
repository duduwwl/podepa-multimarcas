import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pode Pá Multimarcas | Moda masculina em Lavras",
  description: "Moda masculina, tênis e kits com entrega para todo o Brasil ou retirada grátis em Lavras, MG.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
