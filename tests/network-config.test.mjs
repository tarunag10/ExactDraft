import test from "node:test";
import assert from "node:assert/strict";
import { agreementPath } from "../src/lib/network-core.mjs";

test("Monad shared links keep their legacy route while BOT links are chain-scoped", () => {
  assert.equal(agreementPath("monad", "12"), "/agreement/12");
  assert.equal(agreementPath("bot", "12"), "/bot/agreement/12");
  assert.notEqual(agreementPath("monad", "12"), agreementPath("bot", "12"));
});

test("unsupported networks and invalid IDs cannot create shared routes", () => {
  assert.equal(agreementPath("unknown", "12"), undefined);
  assert.equal(agreementPath("bot", "0"), undefined);
  assert.equal(agreementPath("bot", "1e9"), undefined);
});
