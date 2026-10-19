# Synthetic demo runbook

## Objective

Show a narrow workflow: two separate wallets independently hash synthetic copies, a matching digest permits the designated wallet to acknowledge, and a mismatch or wrong wallet is rejected. The demo demonstrates a public hash attestation, not file transfer, identity, authority, proof of possession, or legal enforceability.

## Current demo status

The repository documents a hosted Monad testnet demo. BOT contract `0x56a0d7414c950572032b3d434b7c4d09264a3579` is deployed at block `27449470` and source-verified. A synthetic BOT agreement was created and accepted by two separate wallets, with both transactions finalized. The local checkout has BOT environment values in `.env.example`; the hosted Vercel app still needs BOT configuration. Use the local app for a BOT browser walkthrough only after checking chain selection, wallet connection, contract code, and the displayed address. Do not present the current hosted Monad page as BOT-enabled.

The public demo URL and configuration are documented in the root README but were not independently validated while preparing this kit. Smoke-test the exact URL, chain, and contract address immediately before a meeting.

## Prepare

- Two separate browser profiles/devices and two disposable testnet wallets.
- Testnet funds for both relevant transaction flows; do not use valuable wallets.
- Two synthetic files with identical bytes (e.g. `sample-agreement-v1.txt` copied byte-for-byte) and one changed copy. Avoid private or client content.
- Opaque reference such as `DEMO-2026-01`; no names or sensitive title.
- Check current contract address, chain selector, RPC responsiveness, wallet prompts, explorer links, and available balance before the call.
- The prior onchain pilot agreement `1` is already accepted; make a fresh pending synthetic record for a live browser demonstration.
- Keep the app’s limitations slide available for privacy and evidence questions.

## 8–10 minute walkthrough

1. **Frame (1 min):** “ExactDraft compares local file digests and records a designated wallet’s acknowledgement. The file stays in the browser flow; the resulting hash and metadata are public.”
2. **Create (2 min):** In wallet A, select the synthetic file, show the local SHA-256, enter wallet B, an opaque reference, and a future expiry. Confirm the selected testnet. Submit and show the transaction and generated chain-specific review link.
3. **Match (2 min):** In wallet B’s separate profile, open the review link, select the byte-identical copy, and show exact match. Submit acknowledgement and show the receipt and onchain status.
4. **Mismatch (1 min):** Select the changed copy in a fresh pending test record (or use the app’s local comparison screen before acceptance). Show mismatch and disabled acceptance. Don’t create extra chain transactions solely to satisfy a reward threshold.
5. **Permission (1 min):** Demonstrate or explain that another wallet cannot accept; the contract restricts acceptance to the designated counterparty. Use a pre-existing synthetic record if generating another test transaction is undesirable.
6. **Inspect (1 min):** Open the explorer record and explain which fields are public and permanent. Mention that file names are not submitted by this app flow, while the digest, addresses, reference, and times are public.
7. **Close (1 min):** Confirm that this is a testnet demonstration and ask for the technical and support decisions in the feasibility framework.

## Expected behavior

- Byte-identical copies: matching SHA-256; file rename alone does not change digest.
- Changed bytes: different digest and acceptance unavailable.
- Wrong wallet: wallet cannot perform designated-counterparty acceptance.
- Expired or terminal record: cannot be accepted again.
- RPC/wallet/network failure: no success claim; retry/reconnect or stop and record the blocker.

## If the live demo fails

Stop before asking anyone to retry a transaction repeatedly. Capture the visible error and public transaction/RPC details, verify selected chain and contract code, and switch to the architecture/deck walkthrough. State the blocker plainly and reschedule the onchain portion. Never use a fake receipt or describe a local/mock result as onchain evidence.

## Evidence sheet

Record only synthetic test evidence: date/time, network and chain ID, public contract address, source revision, deploy transaction/block, create/accept transaction hashes, receipt and finality state, test cases passed/failed, source-verification state, and observed RPC/wallet issues. Do not record private keys, file contents, real names, client references, or personal data.
