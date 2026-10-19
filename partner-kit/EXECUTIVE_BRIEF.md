# ExactDraft × BOT Chain — feasibility brief

## The product

ExactDraft lets two parties compare local copies of a document and record a designated wallet’s acknowledgement that its SHA-256 digest matches a previously registered digest. Each party chooses their own file. The browser computes the digest; file bytes are not uploaded by the current flow. A small Solidity contract records the digest and agreement metadata and enforces the designated counterparty, exact-hash, expiry, and status checks.

The record is public and permanent. It does not identify a wallet holder, establish authority, prove possession or reading of a file, or establish legal enforceability. This is a narrow integrity-and-acknowledgement primitive, not a signing or document-management system.

## Why BOT Chain is a plausible fit

The app has a separate BOT Chain testnet configuration alongside its Monad testnet deployment. BOT-specific links are chain-scoped. `ExactDraft.sol` is now deployed and source-verified on BOT testnet, and a synthetic two-wallet create-and-accept transaction pair has finalized. The hosted Vercel app still needs BOT address and deployment-block settings before it can use this deployment.

## Proposed first pilot

Keep the first increment small and reversible:

1. Review the verified deployment, source revision, compiler settings, finality evidence, and synthetic two-wallet pilot.
2. Configure and deploy the BOT-enabled frontend, then complete browser-level matching/mismatch, wrong-wallet, cancellation, expiry, reload, and RPC-recovery checks.
3. Obtain independent security, privacy, and jurisdiction reviews; confirm provider terms and retention.
4. Assign support/operations ownership, an RPC fallback, monitoring, and an incident/rollback drill.
5. Review the evidence and written partner scope before considering an invited testnet cohort.

No mainnet deployment, data migration, indexing service, confidential-document use, or reward-optimising activity is included.

## Current state

- Existing Monad testnet contract and public demo are documented in the repository README.
- BOT chain/provider, network-specific contract configuration, BOT review route, explorer links, and deployment chain guard are implemented.
- BOT contract `0x56a0d7414c950572032b3d434b7c4d09264a3579` is deployed at block `27449470` and source-verified on BOTScan.
- A synthetic two-wallet pilot created and accepted agreement `1`; both transactions finalized. Exact hashes and local verification evidence are recorded in the root README and `CODEX_PLAN.md`.
- BOT contract address and deployment block are in `.env.example` and local `.env.local`; the existing Vercel deployment still needs these values.

This is verified testnet integration evidence, not a hosted BOT-enabled user pilot or production-ready release.

## Decisions requested from the partner

- Confirm the supported BOT testnet endpoint, chain ID, explorer, faucet process, token availability, and current operational limits.
- Confirm whether deployment gas support is available, its amount and process, and who funds/controls the wallet. Treat gas as unconfirmed until written down.
- Identify the technical contact for RPC, contract verification, finality, and testnet incident questions.
- Clarify any programme eligibility, evidence, usage, reward, publicity, or reporting conditions and who approves them.
- Confirm whether a testnet demonstration is sufficient for the first milestone; discuss mainnet only after technical and privacy gates pass.

## Proposed outcome of the meeting

Agree (a) a named technical contact, (b) a testnet deployment and verification checklist, (c) who supplies test gas and infrastructure, (d) the evidence that would constitute a successful pilot, and (e) whether a follow-up assessment is worthwhile. No commercial or funding commitment is assumed by this brief.
