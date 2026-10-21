import assert from "node:assert/strict";
import test from "node:test";
import { isAgreementNotFoundError, isFutureExpiryTimestamp, isValidAgreementIdCore, parseContractAddress } from "../src/lib/contract-core.mjs";
import { createContentSecurityPolicy } from "../src/lib/security-policy.mjs";

test("contract configuration rejects missing, malformed and zero addresses", () => {
  assert.deepEqual(parseContractAddress(undefined), { address: undefined, issue: "missing" });
  assert.deepEqual(parseContractAddress("  "), { address: undefined, issue: "missing" });
  assert.deepEqual(parseContractAddress("not-an-address"), { address: undefined, issue: "invalid" });
  assert.deepEqual(parseContractAddress("0x0000000000000000000000000000000000000000"), { address: undefined, issue: "invalid" });
  assert.deepEqual(parseContractAddress("0x2D10621878796F3920a2B68d30C3850708F764D8"), {
    address: "0x2D10621878796F3920a2B68d30C3850708F764D8",
    issue: undefined,
  });
});

test("agreement route IDs must be canonical nonzero uint256 values", () => {
  assert.equal(isValidAgreementIdCore("1"), true);
  assert.equal(isValidAgreementIdCore(((1n << 256n) - 1n).toString()), true);
  assert.equal(isValidAgreementIdCore("0"), false);
  assert.equal(isValidAgreementIdCore("01"), false);
  assert.equal(isValidAgreementIdCore("-1"), false);
  assert.equal(isValidAgreementIdCore((1n << 256n).toString()), false);
  assert.equal(isValidAgreementIdCore("9".repeat(1000)), false);
});

test("expiry validation accepts only safe integer timestamps strictly in the future", () => {
  assert.equal(isFutureExpiryTimestamp(1_001, 1_000), true);
  assert.equal(isFutureExpiryTimestamp(1_000, 1_000), false);
  assert.equal(isFutureExpiryTimestamp(999, 1_000), false);
  assert.equal(isFutureExpiryTimestamp(Number.NaN, 1_000), false);
  assert.equal(isFutureExpiryTimestamp(Number.MAX_SAFE_INTEGER + 1, 1_000), false);
  assert.equal(isFutureExpiryTimestamp(1_001, Number.NaN), false);
});

test("custom missing-record errors are distinguished from RPC failures", () => {
  assert.equal(isAgreementNotFoundError({ name: "ContractFunctionRevertedError", message: "AgreementNotFound()" }), true);
  assert.equal(isAgreementNotFoundError({ message: "execution reverted: 0x9cc59cb9" }), true);
  assert.equal(isAgreementNotFoundError({ name: "HttpRequestError", message: "request timed out" }), false);
});

test("content security policy scopes inline scripts to the per-request nonce", () => {
  const policy = createContentSecurityPolicy("c2VjdXJlLW5vbmNl");
  assert.match(policy, /script-src 'self' 'nonce-c2VjdXJlLW5vbmNl' 'strict-dynamic'/);
  assert.doesNotMatch(policy, /script-src[^;]*unsafe-inline/);
  assert.doesNotMatch(policy, /unsafe-eval/);
  assert.match(policy, /connect-src 'self' https:\/\/testnet-rpc\.monad\.xyz https:\/\/rpc\.bohr\.life/);
  assert.match(policy, /style-src 'self' 'unsafe-inline'/);
  assert.match(createContentSecurityPolicy("dev", true), /script-src[^;]*unsafe-eval/);
});
