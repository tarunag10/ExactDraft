# Operations and release boundaries

This document describes the current app architecture and the operating decisions that must be completed before any invited or production pilot. It does not claim that hosting, RPC, legal, security-review, incident-response, or partner support terms have been approved.

## Current service boundary

ExactDraft is a browser frontend. In its current flow, file bytes are hashed locally and are not intentionally sent to an ExactDraft backend or file store. A public chain receives a digest and agreement metadata. Wallet addresses, references, transaction details, and timestamps are public and permanent. Public RPC providers receive requests associated with wallet/record activity. Users exchange the actual file through a separate channel of their choice.

The repository includes Monad and BOT testnet configurations. BOT deployment remains pending; do not enable BOT writes until a reviewed BOT contract address has code and the deployment/source evidence is recorded. Production hosting/provider configuration must be checked against the actual deployed environment before publishing privacy or availability claims.

## Supported use and known limits

- Current supported workflow: two wallets, one designated counterparty, a SHA-256 digest, public metadata, and testnet transactions.
- Maximum selected file size is 25 MB. File content does not go onchain.
- A matching digest demonstrates byte equality under SHA-256 for the submitted values. It does not verify identity, authority, possession, reading, consent, or legal enforceability.
- ExactDraft cannot erase or amend an immutable chain record. A frontend rollback does not reverse an already confirmed transaction.
- No backend, database, indexer, or app analytics service is currently part of the repository implementation.
- The frontend RPC transport uses a 10-second request timeout and two retries against the selected network's configured RPC. No alternate provider/failover endpoint is configured because an operator and approved secondary endpoint have not been selected.
- No app-side monitoring or operational logging service is configured. Do not infer uptime or incident detection from the CI workflow.
- No uptime, RPC SLA, supported mobile-wallet, or user-support commitment is established by this repository.

The current wallet connector is EIP-1193 injected. A mobile wallet's in-app browser may provide this interface; the integration has not been device-tested and a standalone mobile browser has no configured WalletConnect path. Treat mobile compatibility as unverified until tested with supported devices and wallets.

The Content Security Policy is an initial allowlist for the app's two configured testnet RPCs. It includes `unsafe-inline` for the current Next.js bootstrap and has no nonce. Revisit it before adding third-party scripts, external font/image hosts, WalletConnect, or sensitive server-rendered content. Verify the final headers and browser console on the hosted deployment.

## Required ownership before an invited pilot

Fill in and approve these items with the actual operators; do not infer them from default configuration.

| Responsibility | Owner / evidence |
| --- | --- |
| Frontend hosting, access controls, release and rollback | Pending written confirmation |
| RPC and explorer provider, limits, privacy terms and outage escalation | Pending provider/partner confirmation |
| Contract deployment wallet, test funds, custody and key rotation | Pending written procedure; never put private keys in this repository or frontend environment |
| Security incident triage and user communication | Pending named owner and contact route |
| Privacy/legal review for intended users and jurisdictions | Pending qualified review |
| User support, supported browsers/wallets and response expectations | Pending pilot scope |
| Pilot budget, gas caps and any sponsorship/reward | Pending written approval; gas and development/maintenance budget are separate |

## Incident handling checklist

1. Stop new writes if the configured network, contract address, or UI behavior is suspect; keep public reads available only if they remain safe and accurate.
2. Capture the affected release/source revision, chain ID, contract address, public transaction hashes, observed error, and time. Do not capture documents, filenames, private keys, or sensitive references.
3. Check the chain ID, contract bytecode, explorer, RPC health, wallet network, and transaction receipt. Report RPC inclusion separately from protocol finality.
4. Roll back a faulty frontend release through the hosting provider’s reviewed procedure. A frontend rollback does not undo contract state.
5. For a suspected immutable-contract defect, pause use of that deployment, notify the named owner, preserve public evidence, and prepare a separately reviewed replacement/migration decision. Never imply old records were changed.
6. Record cause, affected scope, user communication, remediation, and approval before resuming writes.

No incident owner or communication channel is assigned yet. Complete this section with the pilot operator before onboarding users.

## Privacy and retention

The app itself has no file database or app-side retention schedule today. The blockchain retains public records according to the network’s protocol. Hosting, RPC, browser-wallet, and explorer providers may process request metadata under their own terms. Confirm actual providers, logs, retention, access controls, and data-location terms before publishing a customer-facing privacy statement. Never promise deletion of onchain data.

Use synthetic files and opaque references for demos. Do not put names, client identifiers, confidential titles, or other personal/sensitive information into public references. Do not claim public hashes are confidential; a known or guessable document can be hashed and matched. Any change to a salted/commitment format requires a separately versioned protocol and focused cryptographic review.

## Release checklist

- Review source diff, dependencies, CI results, and deployment environment.
- Verify network ID and contract bytecode before enabling writes.
- Confirm source revision, compiler/optimizer settings, address, deployment transaction/block, and explorer verification status.
- Run synthetic two-wallet smoke tests, wrong-network and wallet-rejection recovery, RPC outage behavior, and evidence/link checks.
- Check browser console/network requests using synthetic markers; verify document bytes, filenames, references, and secrets are absent from app requests and logs.
- Verify security headers on the actual hosted deployment, not only the local build.
- Record release owner, rollback steps, incident owner, support route, and approved operating budget.
- Do not expand to real sensitive documents or mainnet until written scope and independent security/privacy reviews are complete.
