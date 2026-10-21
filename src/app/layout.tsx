import type { Metadata } from "next";
import { connection } from "next/server";
import { Providers } from "@/src/app/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExactDraft — same file, independently verified",
  description: "A local-first document hash attestation on supported testnets.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
