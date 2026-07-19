import type { Metadata } from "next";
import { Providers } from "@/src/app/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExactDraft — same file, independently verified",
  description: "A local-first document hash attestation on Monad testnet.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
