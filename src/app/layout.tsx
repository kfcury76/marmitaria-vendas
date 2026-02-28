import type { Metadata } from "next";
import { Playfair_Display, Outfit } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({ variable: "--font-serif", subsets: ["latin"] });
const outfit = Outfit({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Marmitaria Araras | Cardapio Premium",
  description: "O melhor sabor da regiao em embalagens praticas e seguras.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${playfair.variable} antialiased font-sans`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
