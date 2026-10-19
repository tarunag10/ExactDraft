const STATUSES = new Map([[0, "pending"], [1, "accepted"], [2, "cancelled"], [3, "expired"]]);

export function classifyTransactionFinality(includedBlock, finalizedBlock) {
  const included = BigInt(includedBlock);
  const finalized = BigInt(finalizedBlock);
  if (included < 0n || finalized < 0n) throw new RangeError("Block numbers must not be negative.");
  return included <= finalized ? "finalized" : "included";
}

export function mergePendingEvidenceTransactions(includedTransactions, pendingTransactions) {
  const includedHashes = new Set(includedTransactions.map(({ hash }) => hash.toLowerCase()));
  return [
    ...includedTransactions,
    ...pendingTransactions
      .filter(({ hash }) => !includedHashes.has(hash.toLowerCase()))
      .map((transaction) => ({ ...transaction, status: "pending" })),
  ];
}

export function summarizeTransactionStatus(transactions = []) {
  if (transactions.length === 0) return "No transaction status provided.";
  const statuses = transactions.map(({ status }) => status);
  const pending = statuses.includes("pending");
  const included = statuses.includes("included") || statuses.includes("finalized");
  if (pending && included) return "Some transactions are included; at least one remains pending.";
  if (pending) return "Pending — no included receipt found yet.";
  if (statuses.every((status) => status === "finalized")) return "The selected RPC reports these transactions as finalized.";
  if (included) return "Included in a block — inclusion alone does not establish finality.";
  return "Transaction references provided; inclusion status is unavailable.";
}

function decimalString(value, field, { positive = false } = {}) {
  if (typeof value === "number" && !Number.isSafeInteger(value)) {
    throw new TypeError(`${field} must not be an unsafe JavaScript number.`);
  }
  let parsed;
  try {
    parsed = BigInt(value);
  } catch {
    throw new TypeError(`${field} must be an integer.`);
  }
  if (parsed < 0n || (positive && parsed === 0n)) throw new RangeError(`${field} is out of range.`);
  return parsed.toString(10);
}

function statusName(status) {
  if (typeof status === "string" && [...STATUSES.values()].includes(status)) return status;
  const parsed = Number(status);
  const name = STATUSES.get(parsed);
  if (!name) throw new TypeError("status must be pending, accepted, cancelled, expired, or its onchain enum value.");
  return name;
}

function txEntry(transaction, index) {
  if (!transaction || typeof transaction !== "object") throw new TypeError(`transactions[${index}] must be an object.`);
  if (!/^0x[\da-fA-F]{64}$/.test(transaction.hash ?? "")) throw new TypeError(`transactions[${index}].hash must be a transaction hash.`);
  const entry = { type: String(transaction.type ?? "transaction"), hash: transaction.hash };
  if (transaction.blockNumber !== undefined) entry.blockNumber = decimalString(transaction.blockNumber, `transactions[${index}].blockNumber`);
  if (transaction.blockHash !== undefined) {
    if (!/^0x[\da-fA-F]{64}$/.test(transaction.blockHash)) throw new TypeError(`transactions[${index}].blockHash must be a block hash.`);
    entry.blockHash = transaction.blockHash;
  }
  if (transaction.status !== undefined) {
    if (!["included", "finalized", "pending"].includes(transaction.status)) throw new TypeError(`transactions[${index}].status is unsupported.`);
    entry.status = transaction.status;
  }
  return entry;
}

/** Allowlist-based export: local File/Blob data and filenames cannot enter the result. */
export function serializeAgreementEvidence({
  network,
  contractAddress,
  agreementId,
  record,
  transactions = [],
  exportedAt = new Date(),
}) {
  if (!network || typeof network !== "object") throw new TypeError("network is required.");
  if (!Number.isSafeInteger(Number(network.chainId)) || Number(network.chainId) < 1) throw new TypeError("network.chainId must be a positive safe integer.");
  if (typeof network.name !== "string" || !network.name.trim()) throw new TypeError("network.name is required.");
  if (!/^0x[\da-fA-F]{40}$/.test(contractAddress ?? "")) throw new TypeError("contractAddress must be an address.");
  if (!record || typeof record !== "object") throw new TypeError("record is required.");
  if (!Array.isArray(transactions)) throw new TypeError("transactions must be an array.");
  const exportedDate = exportedAt instanceof Date ? exportedAt : new Date(exportedAt);
  if (Number.isNaN(exportedDate.valueOf())) throw new TypeError("exportedAt must be a valid date.");
  if (!/^0x[\da-fA-F]{40}$/.test(record.proposer ?? "") || !/^0x[\da-fA-F]{40}$/.test(record.counterparty ?? "")) {
    throw new TypeError("record participants must be wallet addresses.");
  }
  if (!/^0x[\da-fA-F]{64}$/.test(record.fileHash ?? "")) throw new TypeError("record.fileHash must be a SHA-256 digest.");
  if (typeof record.reference !== "string") throw new TypeError("record.reference must be a string.");

  return JSON.stringify({
    format: "exactdraft-evidence",
    version: 1,
    exportedAt: exportedDate.toISOString(),
    network: { chainId: Number(network.chainId), name: network.name },
    contractAddress,
    agreementId: decimalString(agreementId, "agreementId", { positive: true }),
    agreement: {
      proposer: record.proposer,
      counterparty: record.counterparty,
      fileHash: record.fileHash,
      hashAlgorithm: "SHA-256",
      reference: record.reference,
      createdAt: decimalString(record.createdAt, "createdAt"),
      expiresAt: decimalString(record.expiresAt, "expiresAt"),
      acceptedAt: decimalString(record.acceptedAt, "acceptedAt"),
      status: statusName(record.status),
    },
    transactions: transactions.map(txEntry),
    verification: [
      "Check the chain ID, contract address, and agreement ID against the intended deployment.",
      "Read getAgreement(agreementId) from the contract and compare every agreement field in this export.",
      "For included or finalized transactions, compare the explorer block number and block hash; pending transactions have no inclusion block yet.",
      "Compare each transaction block number with the selected RPC's finalized block; transactions above it are included but not finalized.",
      "To compare a document, calculate its SHA-256 digest locally and compare it with agreement.fileHash; do not upload the document.",
    ],
    limitations: [
      "This record shows public onchain data and wallet activity; it does not establish identity, authority, possession, reading, or legal enforceability.",
      "The document itself and local filename are not included. A SHA-256 digest may still match a known document.",
      "A transaction marked included is not a claim of finality unless its status is explicitly finalized.",
    ],
  }, null, 2);
}
