import test from "node:test";
import assert from "node:assert/strict";
import { serializeAgreementEvidence } from "../src/lib/evidence-core.mjs";

const proposer = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const counterparty = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const txHash = `0x${"c".repeat(64)}`;
const record = {
  proposer,
  counterparty,
  fileHash: `0x${"d".repeat(64)}`,
  reference: "case-opaque-42",
  createdAt: 1_800_000_000_000_000_000n,
  expiresAt: 1_800_000_100_000_000_000n,
  acceptedAt: 1_800_000_010_000_000_000n,
  status: 1n,
};

test("exports versioned allowlisted evidence and safely stringifies uint256 values", () => {
  const marker = "private-client-file-name.docx";
  const encoded = serializeAgreementEvidence({
    network: { chainId: 968, name: "BOT Chain testnet" },
    contractAddress: "0x1111111111111111111111111111111111111111",
    agreementId: 9_007_199_254_740_993n,
    record: { ...record, fileName: marker, fileBytes: new Uint8Array([1, 2, 3]) },
    transactions: [{ type: "created", hash: txHash, blockNumber: 9_007_199_254_740_993n, status: "included" }],
    exportedAt: "2026-10-19T12:00:00Z",
  });
  const evidence = JSON.parse(encoded);
  assert.equal(evidence.format, "exactdraft-evidence");
  assert.equal(evidence.version, 1);
  assert.equal(evidence.agreementId, "9007199254740993");
  assert.equal(evidence.agreement.createdAt, "1800000000000000000");
  assert.equal(evidence.transactions[0].blockNumber, "9007199254740993");
  assert.equal(evidence.agreement.status, "accepted");
  assert.equal(encoded.includes(marker), false);
  assert.equal("fileBytes" in evidence.agreement, false);
});

test("rejects invalid identities, status, and unsafe numeric serialization", () => {
  const base = {
    network: { chainId: 968, name: "BOT" },
    contractAddress: "0x1111111111111111111111111111111111111111",
    agreementId: 1n,
    record,
  };
  assert.throws(() => serializeAgreementEvidence({ ...base, agreementId: 9_007_199_254_740_993 }), /unsafe JavaScript number/);
  assert.throws(() => serializeAgreementEvidence({ ...base, record: { ...record, status: 9 } }), /status/);
  assert.throws(() => serializeAgreementEvidence({ ...base, record: { ...record, proposer: "bad" } }), /participants/);
});
