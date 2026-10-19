# Meeting guide for Leon

## 30-second opening

“ExactDraft is a small two-party document-integrity demo. Each person hashes their own local copy; a designated wallet can record an onchain acknowledgement only when the digest matches. We have added BOT testnet configuration alongside the existing Monad demo. We have not deployed or verified the BOT contract yet, so I’d like to use this discussion to confirm the smallest useful testnet assessment and what BOT can actually support.”

## Three points to land

1. **Small scope:** one existing contract, an optional second testnet, two wallets, synthetic files, and a bounded validation checklist.
2. **Honest privacy boundary:** no file upload in the current flow, but hashes, wallet addresses, references, and timestamps are public and permanent; use opaque references and synthetic documents.
3. **Clear gate:** BOT deployment and two-wallet evidence depend on confirmed network details, test gas, a disposable wallet, and a technical contact. A code path is not a live integration.

## Questions to ask

- Which RPC, chain ID, explorer, faucet, and test token should this pilot use, and who confirms changes?
- Can BOT provide testnet gas for a disposable wallet? What amount, process, and conditions apply?
- Who can review compiler/EVM settings and guide contract verification on BOTScan?
- What finality should the product display, and what is the expected confirmation policy for a small app?
- What are the RPC rate limits and outage/support escalation path?
- Is any development support approved, or is the current offer only deployment gas and programme eligibility review?
- What exact programme activity and evidence rules apply? Are rewards, publicity, customer introductions, or case studies separately approved?
- What is the smallest deliverable that would be useful to BOT, and who signs off?

## Suggested close

“Let’s capture the testnet parameters, technical owner, gas process, verification steps, and the evidence you’d want to see. I can then return with a bounded estimate and deployment checklist. We’ll keep mainnet and commercial terms as separate decisions.”

## Answers to likely questions

**Does ExactDraft store documents?** No, not in the current application flow. It computes SHA-256 in the browser and submits a digest and metadata. The data written onchain is public.

**Does the acknowledgement prove who signed or read the file?** No. It records a wallet’s contract call for a digest. It does not establish identity, authority, possession, reading, consent quality, or legal enforceability.

**Is BOT live in the app?** BOT testnet configuration and routes are in source, but there is no BOT contract address configured here and no BOT deployment/two-wallet evidence yet.

**Is the funding approved?** No funding or rewards should be described as approved without a specific written confirmation. Gas assistance, development funding, maintenance, user acquisition, and programme rewards are distinct.

**What comes after a testnet demo?** Review evidence and ownership. Only then decide whether an invited testnet cohort is useful. Mainnet requires separate written scope, security/privacy/operational gates, and explicit authorization.
