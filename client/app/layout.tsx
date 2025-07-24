// client/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Quantum Bluff",
  description: "A quantum-based bluffing game",
};

const csp = [
  "default-src 'self';",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline';",
  "style-src 'self' 'unsafe-inline';",
  "img-src 'self' data: http://localhost:4000;",
  // UPDATED LINE: Added http://localhost:4000 to connect-src
  "connect-src 'self' http://localhost:4000 ws://localhost:4000 wss://localhost:4000;",
  "font-src 'self';",
  "frame-src 'self';",
].join(' ');

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="Content-Security-Policy" content={csp} />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}