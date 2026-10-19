# Technical and privacy framework

## Current architecture

```mermaid
flowchart LR
  A[Proposer selects local file] --> B[Browser computes SHA-256]
  B --> C[Wallet submits digest + reference + counterparty + expiry]
  C --> D[Chain-specific ExactDraft contract]
  E[Counterparty selects own local copy] --> F[Browser computes SHA-256]
  F --> G{Exact digest match?}
  G -->|Yes| H[Designated wallet submits acknowledgement]
  G -->|No| I[Acceptance disabled]
  D --> J[Public contract read by agreement ID]
  H --> J
```

The frontend is Next.js/TypeScript with wagmi/viem. The contract is Solidity 0.8.24 and stores proposer address, counterparty address, `bytes32` file hash, reference string, timestamps, and status. It emits created/accepted/cancelled events and exposes `agreementCount` and `getAgreement`. Agreement IDs are one-based and deployment-local. Reads are direct contract calls; there is no app database, backend, or event indexer today.

Supported network configuration in source:

| Network | Chain ID | RPC | Explorer | Contract address |
| --- | ---: | --- | --- | --- |
| Monad testnet | 10143 | `https://testnet-rpc.monad.xyz` | `https://testnet.monadvision.com` | Existing address documented in root README; verify before use |
| BOT Chain testnet | 968 | `https://rpc.bohr.life` | `https://scan.bohr.life` | Deployed at `0x56a0d7414c950572032b3d434b7c4d09264a3579`, source verified; deployment block `27449470`; synthetic two-wallet pilot finalized. Vercel BOT environment still needs configuration. |

BOT values are current code/documentation values, not a guarantee of present service availability. Recheck RPC and explorer availability before a live session. The app reports transaction receipt inclusion as confirmed; do not describe that UI state as protocol finality.

## Trust and permission boundaries

- File selection and hashing happen in the browser. The current flow does not send the file or `Blob` to an ExactDraft API, backend, storage service, or contract.
- Wallets sign their own chain transactions. The deployer key is separate, test-only, and must never enter frontend/public environment variables or this repository.
- Any wallet can read public chain state. Only the proposer can cancel a pending record; only the designated counterparty can acknowledge, and acceptance requires the exact stored digest before expiry.
- The contract records a submitted digest. It cannot establish which file was selected or whether a person possesses, opened, read, or understood it.
- Contract source is not upgradeable. A deployed contract’s behavior cannot be changed by updating this repository.

## Data inventory and risk controls

| Data | Current handling | Exposure / control |
| --- | --- | --- |
| File bytes | Selected locally and hashed in browser | Not intentionally uploaded by the app flow. Do not select sensitive files for partner demos. Browser extensions, device compromise, or user actions are outside this guarantee. |
| File name | Local component state for display | Not written onchain by the current flow. Avoid screenshots that reveal private names. |
| SHA-256 digest | Sent in transaction and stored/emitted publicly | Permanent and linkable. Known or guessable documents may be matched by hashing candidate copies. Use synthetic files; consider a separately designed commitment/salt scheme only if a real use case justifies it. |
| Wallet addresses | Public proposer/counterparty and transaction signers | Linkable to other chain activity. Use test wallets for demos. |
| Reference and timestamps | Stored/emitted publicly | Never put names, client identifiers, contract titles, or confidential context in the reference. Use opaque, non-sensitive labels. |
| Private keys | Wallet/provider managed; deploy key supplied out of band | Never commit keys, place them in `NEXT_PUBLIC_*`, or paste them into logs/reports. Use disposable testnet keys with minimal funds. |
| RPC metadata | Public RPC requests from browser | RPC operators may observe addresses, IDs, and query timing. Avoid representing direct public RPC reads as anonymous. |

No contract event or hash is a substitute for identity, authority, electronic-signature, retention, or legal review. Obtain appropriate legal and security review before using this pattern for high-stakes transactions.

## BOT readiness gates

Deployment and base onchain acceptance evidence now recorded:

1. Chain ID `968` verified over `https://rpc.bohr.life`; explorer and faucet are documented at `https://scan.bohr.life` and the official BOT developer guide.
2. The reviewed `ExactDraft.sol` source is deployed at `0x56a0d7414c950572032b3d434b7c4d09264a3579`, block `27449470`, from a disposable test wallet.
3. Deployment receipt, source revision, Solidity `0.8.24`, optimizer settings, deploy transaction, address, and block are recorded in the root README and `CODEX_PLAN.md`.
4. BOTScan returned `Pass - Verified` for the submitted source.
5. BOT address/block are set in `.env.example` and local `.env.local`; the existing Vercel project still needs them before the hosted frontend can use BOT.
6. Two separate wallets created and accepted synthetic agreement `1`; both receipts succeeded and the acceptance block was below the RPC finalized height. Unit tests cover mismatch, wrong signer, expiry, and cancellation behavior; browser and accessibility pilot checks remain open.

Report transaction inclusion separately from the chain’s finality guarantee. The app UI currently reports receipt inclusion; the pilot finality check was performed independently.

## Next technical decisions

- Ask BOT staff about RPC quotas, rate limits, service ownership, incident communications, and whether public RPC is suitable for a small invited pilot.
- Keep direct reads by ID for a small pilot. Add an indexer only if measured history/discovery needs or RPC limits make direct reads inadequate.
- Confirm how BOTScan verifies contracts and which metadata/compiler settings it expects.
- Define a contract-address release/configuration process so an incorrect address fails closed, as the app currently intends.
