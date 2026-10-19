export type EvidenceTransaction = {
  type: string;
  hash: `0x${string}`;
  blockNumber?: bigint | number | string;
  blockHash?: `0x${string}`;
  status?: "included" | "finalized" | "pending";
};

export function serializeAgreementEvidence(input: {
  network: { chainId: number; name: string };
  contractAddress: `0x${string}`;
  agreementId: bigint | number | string;
  record: {
    proposer: `0x${string}`;
    counterparty: `0x${string}`;
    fileHash: `0x${string}`;
    reference: string;
    createdAt: bigint | number | string;
    expiresAt: bigint | number | string;
    acceptedAt: bigint | number | string;
    status: bigint | number | string;
  };
  transactions?: EvidenceTransaction[];
  exportedAt?: Date | string | number;
}): string;
