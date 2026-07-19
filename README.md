# ExactDraft

ExactDraft is a Spark hackathon project for verifying that two wallet holders possess the exact same document file. Each person selects their own local copy. The browser calculates SHA-256 locally, and only the resulting `bytes32` digest plus agreement metadata is written to Monad testnet.

The document bytes never leave the browser. ExactDraft has no backend and no database.

## Stack

- Next.js + TypeScript + App Router
- Tailwind CSS
- wagmi + viem with a custom Monad testnet chain definition
- Solidity 0.8.24 + Foundry
- Monad testnet, chain ID `10143`
- RPC: `https://testnet-rpc.monad.xyz`
- Explorer: `https://testnet.monadvision.com`

## Setup

Install Node.js 20+ and Foundry, then install the JavaScript dependencies:

```bash
npm install
```

Copy the environment template:

```bash
cp .env.example .env.local
```

The app intentionally has no built-in or mock contract address. After deployment, set the real address in `.env.local`:

```bash
NEXT_PUBLIC_EXACTDRAFT_CONTRACT_ADDRESS=<deployed-exactdraft-contract-address>
```

Restart Next.js after changing environment variables. Without this value, the UI remains read-only and explains that the contract is not configured.

## Monad testnet deployment

The current public Spark hackathon deployment is live on Monad testnet:

- Contract: `0x2D10621878796F3920a2B68d30C3850708F764D8`
- Deployment transaction: [`0x88655ef486868d4c217eac5e2532d845f6803bb0a667892b9a734ccfae7f108b`](https://testnet.monadvision.com/tx/0x88655ef486868d4c217eac5e2532d845f6803bb0a667892b9a734ccfae7f108b)
- Contract explorer: [Open ExactDraft on MonadVision](https://testnet.monadvision.com/address/0x2D10621878796F3920a2B68d30C3850708F764D8)

The deployer is a temporary testnet-only account. Its private key is not part of this repository or the frontend configuration.

## Contract deployment

Keep the deployer key private and fund it with Monad testnet MON. The deploy script reads the key from the environment and broadcasts to the supplied RPC:

```bash
export MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
export MONAD_TESTNET_PRIVATE_KEY=<private-key-without-0x>

forge script contracts/script/Deploy.s.sol:Deploy \
  --rpc-url "$MONAD_TESTNET_RPC_URL" \
  --broadcast
```

Copy the deployed `ExactDraft` address into `NEXT_PUBLIC_EXACTDRAFT_CONTRACT_ADDRESS`. The address is intentionally a deployment-time placeholder in this README only; no placeholder blockchain value is used by the application.

## Development

```bash
npm run dev
```

Open `http://localhost:3000` with an injected wallet such as MetaMask. The wallet must be connected to Monad testnet. The app prompts for a network switch and reports rejected wallet connections, wrong-network state, transaction failures, and pending confirmations.

## Demonstration

1. Connect wallet A on Monad testnet.
2. Select a local document. Confirm the visible local SHA-256 digest and enter wallet B, a reference, and an expiry time.
3. Submit the transaction. The `AgreementCreated` event gives the one-based agreement ID. Open the generated review URL or share `/agreement/<id>` with wallet B.
4. On a separate browser/profile, connect wallet B and select its own copy of the document.
5. An exact digest shows a strong green `Exact match` state and enables `Attest exact match`. A different file shows a red `Mismatch` state and keeps acceptance disabled.
6. After confirmation, the review page shows the final onchain record: proposer, counterparty, digest, reference, creation/expiry/acceptance timestamps, status, wallet explorer links, and transaction explorer links.

Use two actual copies of the same bytes for the green path. A renamed file still matches; changing even one byte does not.

## Architecture

```text
Local File A ──SHA-256 in browser──┐
                                   ├── bytes32 comparison ── wallet B acceptance
Local File B ──SHA-256 in browser──┘                              │
                                                                  ▼
                                  Monad testnet: ExactDraft contract
```

`contracts/src/ExactDraft.sol` stores proposer, designated counterparty, file digest, reference, timestamps, and status. Agreement IDs are one-based. `getAgreement` computes an `Expired` read status when a pending record reaches its deadline; no backend job is needed. The contract accepts only when the caller is the designated counterparty and the presented hash matches exactly. Accepted, cancelled, and expired records cannot be accepted again.

The Next.js client uses `crypto.subtle.digest("SHA-256", ...)` and never sends a `File`, `Blob`, or file bytes to a route, API, storage service, or contract. `src/lib/contract.ts` contains the frontend ABI and the real deployment address is supplied only by environment configuration.

## Contract interface

- `createAgreement(bytes32 fileHash, address counterparty, string reference, uint64 expiresAt)`
- `acceptAgreement(uint256 agreementId, bytes32 presentedHash)`
- `cancelAgreement(uint256 agreementId)`
- `getAgreement(uint256 agreementId)`

Events are `AgreementCreated`, `AgreementAccepted`, and `AgreementCancelled`. The contract also exposes `agreementCount()` for basic discovery without a database.

## Tests

```bash
npm run test:contract
```

The Foundry suite covers one-based creation, metadata persistence, counterparty authorization, exact-hash matching, accepted/cancelled/expired replay protection, proposer-only cancellation, and invalid input reverts.

## Legal disclaimer

ExactDraft records wallet attestations and a file digest. It is not itself an electronic-signature or legal-advice service. Users are responsible for deciding whether a wallet attestation is appropriate for their document and jurisdiction.
