import test from "node:test";
import assert from "node:assert/strict";
import { readAgreementHistory } from "../src/lib/agreement-history-core.mjs";

const address = "0x1111111111111111111111111111111111111111";
const proposer = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const counterparty = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const log = (n, args = { proposer, counterparty }) => ({
  transactionHash: `0x${String(n).padStart(64, "0")}`,
  blockNumber: BigInt(n),
  logIndex: 0,
  args,
});

test("paginates from deployment boundary, sorts and deduplicates provider results", async () => {
  const ranges = [];
  const pages = await readAgreementHistory({
    address,
    deploymentBlock: 10n,
    fromBlock: 1n,
    toBlock: 14n,
    pageSize: 2,
    getLogs: async (range) => {
      ranges.push(range);
      return range.fromBlock === 10n ? [log(11), log(10)] : range.fromBlock === 12n ? [log(11), log(12)] : [log(14)];
    },
  });
  assert.deepEqual(ranges.map(({ fromBlock, toBlock }) => [fromBlock, toBlock]), [[10n, 11n], [12n, 13n], [14n, 14n]]);
  assert.deepEqual(pages.map((item) => item.blockNumber), [10n, 11n, 12n, 14n]);
});

test("filters creation logs by proposer, counterparty, or either participant", async () => {
  const logs = [log(1), log(2, { proposer, counterparty: "0xcccccccccccccccccccccccccccccccccccccccc" })];
  const getLogs = async () => logs;
  const base = { getLogs, address, deploymentBlock: 0, toBlock: 2 };
  assert.deepEqual((await readAgreementHistory({ ...base, account: proposer, role: "proposer" })).map((item) => item.blockNumber), [1n, 2n]);
  assert.deepEqual((await readAgreementHistory({ ...base, account: counterparty, role: "counterparty" })).map((item) => item.blockNumber), [1n]);
  assert.deepEqual((await readAgreementHistory({ ...base, account: counterparty, role: "participant" })).map((item) => item.blockNumber), [1n]);
});

test("retries transient RPC failure only up to configured bound", async () => {
  let calls = 0;
  const waits = [];
  const logs = await readAgreementHistory({
    address, deploymentBlock: 3, toBlock: 3, maxRetries: 2, retryDelayMs: 5,
    wait: async (ms) => waits.push(ms),
    getLogs: async () => { calls += 1; if (calls < 3) throw new Error("temporary"); return [log(3)]; },
  });
  assert.equal(logs.length, 1);
  assert.equal(calls, 3);
  assert.deepEqual(waits, [5, 10]);

  calls = 0;
  await assert.rejects(readAgreementHistory({
    address, deploymentBlock: 3, toBlock: 3, maxRetries: 1,
    wait: async () => {},
    getLogs: async () => { calls += 1; throw new Error("offline"); },
  }), /offline/);
  assert.equal(calls, 2);
});

test("validates bounded page size and requires account for role filtering", async () => {
  const base = { getLogs: async () => [], address, deploymentBlock: 1, toBlock: 1 };
  await assert.rejects(readAgreementHistory({ ...base, pageSize: 5_001 }), /pageSize/);
  await assert.rejects(readAgreementHistory({ ...base, role: "participant" }), /valid account/);
});
