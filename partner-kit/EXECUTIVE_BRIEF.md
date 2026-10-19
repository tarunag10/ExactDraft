# ExactDraft × BOT Chain — feasibility brief

## The product

ExactDraft lets two parties compare local copies of a document and record a designated wallet’s acknowledgement that its SHA-256 digest matches a previously registered digest. Each party chooses their own file. The browser computes the digest; file bytes are not uploaded by the current flow. A small Solidity contract records the digest and agreement metadata and enforces the designated counterparty, exact-hash, expiry, and status checks.

The record is public and permanent. It does not identify a wallet holder, establish authority, prove possession or reading of a file, or establish legal enforceability. This is a narrow integrity-and-acknowledgement primitive, not a signing or document-management system.

## Why BOT Chain is a plausible fit

The app already has a separate BOT Chain testnet network configuration alongside its Monad testnet deployment. A BOT testnet pilot can test whether an additional network is useful without migrating existing records or changing the Monad route. BOT-specific links are chain-scoped. The BOT contract address still needs to be deployed and configured before the BOT workflow can be used end to end.

## Proposed first pilot

Keep the first increment small and reversible:

1. Confirm testnet RPC, chain ID, explorer, token/faucet access, contract compiler settings, verification process, and receipt/finality expectations with BOT technical staff.
2. Deploy the existing contract source to BOT testnet from a disposable test-only wallet; record the source revision, compiler settings, deploy transaction, block, and address.
3. Verify/publish source in the explorer if supported; otherwise document the exact verification blocker.
4. Configure the BOT test deployment and run a synthetic two-wallet walkthrough covering match, mismatch, wrong wallet, cancellation, expiry, reload, and RPC recovery.
5. Review evidence and operational ownership before deciding whether to continue to an invited testnet cohort.

No mainnet deployment, data migration, indexing service, confidential-document use, or reward-optimising activity is included.

## Current state

- Existing Monad testnet contract and public demo are documented in the repository README.
- BOT chain/provider, network-specific contract configuration, BOT review route, explorer links, and deployment chain guard are implemented.
- Unit/contract/build/browser checks for the code path are recorded in `CODEX_PLAN.md`.
- BOT deployment, source verification, BOT transaction evidence, and two-wallet acceptance walkthrough remain outstanding because deployer credentials and RPC deployment configuration were absent from the implementation environment.

This is implementation readiness for a testnet deployment assessment, not a live BOT integration or production-ready release.

## Decisions requested from the partner

- Confirm the supported BOT testnet endpoint, chain ID, explorer, faucet process, token availability, and current operational limits.
- Confirm whether deployment gas support is available, its amount and process, and who funds/controls the wallet. Treat gas as unconfirmed until written down.
- Identify the technical contact for RPC, contract verification, finality, and testnet incident questions.
- Clarify any programme eligibility, evidence, usage, reward, publicity, or reporting conditions and who approves them.
- Confirm whether a testnet demonstration is sufficient for the first milestone; discuss mainnet only after technical and privacy gates pass.

## Proposed outcome of the meeting

Agree (a) a named technical contact, (b) a testnet deployment and verification checklist, (c) who supplies test gas and infrastructure, (d) the evidence that would constitute a successful pilot, and (e) whether a follow-up assessment is worthwhile. No commercial or funding commitment is assumed by this brief.
