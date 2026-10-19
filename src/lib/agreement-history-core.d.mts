export type AgreementHistoryRole = "proposer" | "counterparty" | "participant";

export type AgreementCreatedLog = {
  transactionHash: `0x${string}`;
  blockHash?: `0x${string}`;
  blockNumber: bigint;
  logIndex: number | bigint;
  args: { proposer?: `0x${string}`; counterparty?: `0x${string}`; [key: string]: unknown };
};

export function readAgreementHistory(options: {
  getLogs: (range: { address: `0x${string}`; fromBlock: bigint; toBlock: bigint }) => Promise<AgreementCreatedLog[]>;
  address: `0x${string}`;
  deploymentBlock: bigint | number | string;
  fromBlock?: bigint | number | string;
  toBlock: bigint | number | string;
  pageSize?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  wait?: (milliseconds: number) => Promise<void>;
  account?: `0x${string}`;
  role?: AgreementHistoryRole;
}): Promise<AgreementCreatedLog[]>;
