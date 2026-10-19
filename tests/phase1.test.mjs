import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { isValidReferenceCore, MAX_FILE_SIZE_BYTES, MAX_REFERENCE_BYTES, sha256FileCore } from "../src/lib/hash-core.mjs";

test("SHA-256 matches the standard digest and ignores file names", async () => {
  const bytes = new TextEncoder().encode("abc");
  const expected = `0x${createHash("sha256").update(bytes).digest("hex")}`;
  assert.equal(await sha256FileCore(new File([bytes], "first.txt"), MAX_FILE_SIZE_BYTES), expected);
  assert.equal(await sha256FileCore(new File([bytes], "renamed.txt"), MAX_FILE_SIZE_BYTES), expected);
  assert.notEqual(await sha256FileCore(new File([new TextEncoder().encode("abd")], "first.txt"), MAX_FILE_SIZE_BYTES), expected);
});

test("oversized files are rejected before reading bytes; the limit is accepted", async () => {
  let read = false;
  const oversized = { size: MAX_FILE_SIZE_BYTES + 1, arrayBuffer: async () => { read = true; return new ArrayBuffer(0); } };
  await assert.rejects(sha256FileCore(oversized, MAX_FILE_SIZE_BYTES), /25 MB/);
  assert.equal(read, false);

  const atLimit = { size: MAX_FILE_SIZE_BYTES, arrayBuffer: async () => new TextEncoder().encode("ok").buffer };
  assert.match(await sha256FileCore(atLimit, MAX_FILE_SIZE_BYTES), /^0x[0-9a-f]{64}$/);
});

test("references follow the contract's 140-byte UTF-8 limit", () => {
  assert.equal(MAX_REFERENCE_BYTES, 140);
  assert.equal(isValidReferenceCore("a".repeat(140), MAX_REFERENCE_BYTES), true);
  assert.equal(isValidReferenceCore("a".repeat(141), MAX_REFERENCE_BYTES), false);
  assert.equal(isValidReferenceCore("é".repeat(70), MAX_REFERENCE_BYTES), true);
  assert.equal(isValidReferenceCore("é".repeat(71), MAX_REFERENCE_BYTES), false);
  assert.equal(isValidReferenceCore("😀".repeat(35), MAX_REFERENCE_BYTES), true);
  assert.equal(isValidReferenceCore("😀".repeat(36), MAX_REFERENCE_BYTES), false);
  assert.equal(isValidReferenceCore("   ", MAX_REFERENCE_BYTES), false);
});
