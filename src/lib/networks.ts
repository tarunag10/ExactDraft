import { defineChain, type Chain } from "viem";
import { NETWORKS } from "./network-core.mjs";

export const monadTestnet = defineChain({
  id: NETWORKS.monad.id,
  name: NETWORKS.monad.name,
  nativeCurrency: { name: NETWORKS.monad.symbol, symbol: NETWORKS.monad.symbol, decimals: 18 },
  rpcUrls: { default: { http: [NETWORKS.monad.rpcUrl] } },
  blockExplorers: { default: { name: "MonadVision", url: NETWORKS.monad.explorerUrl } },
  testnet: true,
});

export const botTestnet = defineChain({
  id: NETWORKS.bot.id,
  name: NETWORKS.bot.name,
  nativeCurrency: { name: NETWORKS.bot.symbol, symbol: NETWORKS.bot.symbol, decimals: 18 },
  rpcUrls: { default: { http: [NETWORKS.bot.rpcUrl] } },
  blockExplorers: { default: { name: "BOTScan", url: NETWORKS.bot.explorerUrl } },
  testnet: true,
});

export const supportedTestnets = [monadTestnet, botTestnet] as const;
export type SupportedChainId = (typeof supportedTestnets)[number]["id"];

export type NetworkConfig = {
  chain: Chain;
  explorerUrl: string;
  slug: "monad" | "bot";
  label: string;
  contractAddress: `0x${string}` | undefined;
  contractEnvName: string;
  deploymentBlock: string | undefined;
  deploymentBlockEnvName: string;
};

export const networkConfigs: Record<SupportedChainId, NetworkConfig> = {
  [monadTestnet.id]: {
    chain: monadTestnet,
    explorerUrl: monadTestnet.blockExplorers.default.url,
    slug: "monad",
    label: "Monad testnet",
    contractAddress: process.env.NEXT_PUBLIC_EXACTDRAFT_CONTRACT_ADDRESS as `0x${string}` | undefined,
    contractEnvName: "NEXT_PUBLIC_EXACTDRAFT_CONTRACT_ADDRESS",
    deploymentBlock: process.env.NEXT_PUBLIC_EXACTDRAFT_DEPLOYMENT_BLOCK,
    deploymentBlockEnvName: "NEXT_PUBLIC_EXACTDRAFT_DEPLOYMENT_BLOCK",
  },
  [botTestnet.id]: {
    chain: botTestnet,
    explorerUrl: botTestnet.blockExplorers.default.url,
    slug: "bot",
    label: "BOT Chain testnet",
    contractAddress: process.env.NEXT_PUBLIC_BOT_EXACTDRAFT_CONTRACT_ADDRESS as `0x${string}` | undefined,
    contractEnvName: "NEXT_PUBLIC_BOT_EXACTDRAFT_CONTRACT_ADDRESS",
    deploymentBlock: process.env.NEXT_PUBLIC_BOT_EXACTDRAFT_DEPLOYMENT_BLOCK,
    deploymentBlockEnvName: "NEXT_PUBLIC_BOT_EXACTDRAFT_DEPLOYMENT_BLOCK",
  },
};

export function getNetworkConfig(chainId: number): NetworkConfig | undefined {
  return networkConfigs[chainId as SupportedChainId];
}

export function getNetworkBySlug(slug: string): NetworkConfig | undefined {
  return Object.values(networkConfigs).find((network) => network.slug === slug);
}

export function explorerTxUrl(hash: string, chainId: number = monadTestnet.id): string | undefined {
  const network = getNetworkConfig(chainId);
  return network ? `${network.explorerUrl}/tx/${hash}` : undefined;
}

export function explorerAddressUrl(address: string, chainId: number = monadTestnet.id): string | undefined {
  const network = getNetworkConfig(chainId);
  return network ? `${network.explorerUrl}/address/${address}` : undefined;
}
