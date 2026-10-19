import assert from "node:assert/strict";
import test from "node:test";
import { keccak256, stringToHex, toHex } from "viem";
import { findContractEvent, submitSimulatedTransaction } from "../src/lib/transaction-core.mjs";
import { pendingTransactionKey } from "../src/lib/contract-core.mjs";

const address = "0x2D10621878796F3920a2B68d30C3850708F764D8";
const unrelated = "0x0000000000000000000000000000000000000001";
const eventAbi = [{
  type: "event",
  name: "AgreementCreated",
  anonymous: false,
  inputs: [{ name: "agreementId", type: "uint256", indexed: true }],
}];
const createdLog = {
  data: "0x",
  topics: [keccak256(stringToHex("AgreementCreated(uint256)")), toHex(7n, { size: 32 })],
};
const receipt = (status, logs) => ({ status, logs });

test("write is requested only after simulation succeeds", async () => {
  const calls = [];
  const request = { chainId: 10143, account: "0xabc" };
  const hash = await submitSimulatedTransaction(
    { simulateContract: async (value) => { calls.push(["simulate", value]); } },
    async (value) => { calls.push(["write", value]); return "0xtx"; },
    request,
  );
  assert.equal(hash, "0xtx");
  assert.deepEqual(calls, [["simulate", request], ["write", request]]);

  let wrote = false;
  await assert.rejects(submitSimulatedTransaction(
    { simulateContract: async () => { throw new Error("revert"); } },
    async () => { wrote = true; },
    request,
  ), /revert/);
  assert.equal(wrote, false);
});

test("only a successful matching event from the configured contract is accepted", () => {
  assert.equal(findContractEvent(receipt("success", [{ ...createdLog, address: unrelated }]), eventAbi, address, "AgreementCreated"), undefined);
  assert.equal(findContractEvent(receipt("success", [{ ...createdLog, address }]), eventAbi, address, "AgreementCreated", 8n), undefined);
  assert.equal(findContractEvent(receipt("reverted", [{ ...createdLog, address }]), eventAbi, address, "AgreementCreated"), undefined);
  assert.equal(findContractEvent(receipt("success", [{ ...createdLog, address }]), eventAbi, address, "AgreementCreated", 7n)?.args.agreementId, 7n);
});

test("pending receipt keys distinguish chains, contracts and operations", () => {
  const create = pendingTransactionKey(10143, address, "create");
  assert.notEqual(create, pendingTransactionKey(968, address, "create"));
  assert.notEqual(create, pendingTransactionKey(10143, unrelated, "create"));
  assert.notEqual(create, pendingTransactionKey(10143, address, "accept"));
  assert.notEqual(pendingTransactionKey(10143, address, "accept"), pendingTransactionKey(10143, address, "cancel"));
});
