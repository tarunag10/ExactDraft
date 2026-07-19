import type { Address } from "viem";

export const contractAddress = process.env.NEXT_PUBLIC_EXACTDRAFT_CONTRACT_ADDRESS as
  | Address
  | undefined;

export const exactDraftAbi = [
  {
    type: "function",
    name: "createAgreement",
    stateMutability: "nonpayable",
    inputs: [
      { name: "fileHash", type: "bytes32" },
      { name: "counterparty", type: "address" },
      { name: "reference", type: "string" },
      { name: "expiresAt", type: "uint64" },
    ],
    outputs: [{ name: "agreementId", type: "uint256" }],
  },
  {
    type: "function",
    name: "acceptAgreement",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agreementId", type: "uint256" },
      { name: "presentedHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "cancelAgreement",
    stateMutability: "nonpayable",
    inputs: [{ name: "agreementId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "getAgreement",
    stateMutability: "view",
    inputs: [{ name: "agreementId", type: "uint256" }],
    outputs: [
      {
        name: "agreement",
        type: "tuple",
        components: [
          { name: "proposer", type: "address" },
          { name: "counterparty", type: "address" },
          { name: "fileHash", type: "bytes32" },
          { name: "reference", type: "string" },
          { name: "createdAt", type: "uint64" },
          { name: "expiresAt", type: "uint64" },
          { name: "acceptedAt", type: "uint64" },
          { name: "status", type: "uint8" },
        ],
      },
    ],
  },
  {
    type: "event",
    name: "AgreementCreated",
    inputs: [
      { name: "agreementId", type: "uint256", indexed: true },
      { name: "proposer", type: "address", indexed: true },
      { name: "counterparty", type: "address", indexed: true },
      { name: "fileHash", type: "bytes32", indexed: false },
      { name: "reference", type: "string", indexed: false },
      { name: "createdAt", type: "uint64", indexed: false },
      { name: "expiresAt", type: "uint64", indexed: false },
    ],
  },
  {
    type: "event",
    name: "AgreementAccepted",
    inputs: [
      { name: "agreementId", type: "uint256", indexed: true },
      { name: "counterparty", type: "address", indexed: true },
      { name: "presentedHash", type: "bytes32", indexed: false },
      { name: "acceptedAt", type: "uint64", indexed: false },
    ],
  },
  {
    type: "event",
    name: "AgreementCancelled",
    inputs: [
      { name: "agreementId", type: "uint256", indexed: true },
      { name: "proposer", type: "address", indexed: true },
      { name: "cancelledAt", type: "uint64", indexed: false },
    ],
  },
] as const;

export type AgreementStatus = "pending" | "accepted" | "cancelled" | "expired";

export type AgreementRecord = {
  proposer: `0x${string}`;
  counterparty: `0x${string}`;
  fileHash: `0x${string}`;
  reference: string;
  createdAt: bigint;
  expiresAt: bigint;
  acceptedAt: bigint;
  status: number | bigint;
};

export function normalizeAgreement(value: unknown): AgreementRecord | undefined {
  const tuple = Array.isArray(value) ? value[0] : value;
  if (!tuple || typeof tuple !== "object") return undefined;
  const record = tuple as Record<string, unknown> & Record<number, unknown>;
  const get = (name: string, index: number) => record[name] ?? record[index];
  if (typeof get("proposer", 0) !== "string" || typeof get("counterparty", 1) !== "string") return undefined;
  return {
    proposer: get("proposer", 0) as AgreementRecord["proposer"],
    counterparty: get("counterparty", 1) as AgreementRecord["counterparty"],
    fileHash: get("fileHash", 2) as AgreementRecord["fileHash"],
    reference: String(get("reference", 3)),
    createdAt: BigInt(get("createdAt", 4) as bigint),
    expiresAt: BigInt(get("expiresAt", 5) as bigint),
    acceptedAt: BigInt(get("acceptedAt", 6) as bigint),
    status: get("status", 7) as number | bigint,
  };
}

export function statusLabel(status: number | bigint): AgreementStatus {
  switch (Number(status)) {
    case 1:
      return "accepted";
    case 2:
      return "cancelled";
    case 3:
      return "expired";
    default:
      return "pending";
  }
}

export function requireContractAddress(): Address {
  if (!contractAddress) {
    throw new Error(
      "ExactDraft is not configured yet. Deploy the contract and set NEXT_PUBLIC_EXACTDRAFT_CONTRACT_ADDRESS.",
    );
  }
  return contractAddress;
}
