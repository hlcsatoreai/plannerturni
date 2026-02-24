import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Crypto War Machine ULTRA",
  description: "Dashboard probabilistica crypto con Supabase + Binance"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
