"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, injected, WagmiProvider } from "wagmi";
import { botTestnet, monadTestnet } from "@/src/lib/networks";
import { useState, type ReactNode } from "react";

const config = createConfig({
  chains: [monadTestnet, botTestnet],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [monadTestnet.id]: http(monadTestnet.rpcUrls.default.http[0], { timeout: 10_000, retryCount: 2, retryDelay: 250 }),
    [botTestnet.id]: http(botTestnet.rpcUrls.default.http[0], { timeout: 10_000, retryCount: 2, retryDelay: 250 }),
  },
  ssr: true,
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
