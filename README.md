# ExactDraft

ExactDraft is a Spark hackathon project for comparing two local document copies and recording a wallet acknowledgement of a matching SHA-256 digest. Each person selects their own copy in the browser. Only the resulting `bytes32` digest and agreement metadata are written to Monad testnet.

In the current application flow, document bytes are not uploaded and ExactDraft has no backend or database. This does not make the record confidential: the digest, wallet addresses, reference and timestamps are public and permanent onchain. A digest may reveal a match if someone already knows or can guess the document. Use an opaque reference, never a client name or confidential title. The app does not establish a wallet holder's identity, authority, possession of or reading of a file, or legal enforceability.

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

## Public demo

Open the hosted hackathon demo at [exactdraft.vercel.app](https://exactdraft.vercel.app/). The Vercel deployment has the production contract address configured and is linked to this public GitHub repository.

## Contract deployment

Keep the deployer key private and fund it with the selected testnet's native token. The deploy script reads the key from the environment and broadcasts only to the RPC you explicitly supply. For BOT Chain testnet:

```bash
export EXACTDRAFT_DEPLOY_RPC_URL=https://rpc.bohr.life
export EXACTDRAFT_DEPLOY_CHAIN_ID=968
export EXACTDRAFT_DEPLOYER_PRIVATE_KEY=<disposable-testnet-private-key-without-0x>

forge script contracts/script/Deploy.s.sol:Deploy \
  --rpc-url "$EXACTDRAFT_DEPLOY_RPC_URL" \
  --broadcast
```

Copy the deployed `ExactDraft` address into `NEXT_PUBLIC_BOT_EXACTDRAFT_CONTRACT_ADDRESS` for BOT testnet or `NEXT_PUBLIC_EXACTDRAFT_CONTRACT_ADDRESS` for Monad testnet. The app configuration keeps the two deployments separate. Never use a mainnet key or RPC with this command.

## Development

```bash
npm run dev
```

Open `http://localhost:3000` with an injected wallet such as MetaMask. The app supports Monad testnet and BOT Chain testnet; each chain needs its own deployed contract address configured. The active testnet and explorer appear in the header. Legacy Monad review links remain `/agreement/<id>`; BOT review links use `/bot/agreement/<id>`.

## Demonstration

1. Connect wallet A on Monad testnet.
2. Select a local document up to 25 MB. Confirm the visible local SHA-256 digest and enter wallet B, an opaque reference of at most 140 UTF-8 bytes, and an expiry time.
3. Submit the transaction. The `AgreementCreated` event gives the one-based agreement ID. Open the generated review URL or share `/agreement/<id>` with wallet B.
4. On a separate browser/profile, connect wallet B and select its own copy of the document.
5. An exact digest shows a strong green `Exact match` state and enables `Attest exact match`. A different file shows a red `Mismatch` state and keeps acceptance disabled. Renaming preserves a match; editing or resaving may change the file bytes and digest.
6. After confirmation, the review page shows the final onchain record: proposer, counterparty, digest, reference, creation/expiry/acceptance timestamps, status, wallet explorer links, and transaction explorer links.

Use two copies of the same bytes for the green path. The comparison occurs locally in the browser. The contract permits the designated wallet to submit the already-public digest; it cannot prove that the wallet holder selected, possessed or read a file.

## Architecture

```text
Local File A ──SHA-256 in browser──┐
                                   ├── bytes32 comparison ── wallet B acceptance
Local File B ──SHA-256 in browser──┘                              │
                                                                  ▼
                                  Monad testnet: ExactDraft contract
```

`contracts/src/ExactDraft.sol` stores proposer, designated counterparty, file digest, reference, timestamps, and status. Agreement IDs are one-based. `getAgreement` computes an `Expired` read status when a pending record reaches its deadline; no backend job is needed. The contract accepts only when the caller is the designated counterparty and the presented hash matches exactly. Accepted, cancelled, and expired records cannot be accepted again.

Source revisions also reject proposer cancellation at or after expiry. The already deployed Monad testnet contract is immutable and retains the behavior it was deployed with; this source change only applies to future deployments. No contract redeployment is implied by the source change.

The Next.js client uses `crypto.subtle.digest("SHA-256", ...)` and the current application flow does not send a `File`, `Blob`, or file bytes to a route, API, storage service, or contract. `src/lib/contract.ts` contains the frontend ABI and the real deployment address is supplied only by environment configuration. File names remain in the page's local UI state to label the selected digest and are not written onchain.

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

ExactDraft records a public file digest and wallet acknowledgements. It does not establish identity, authority, possession, reading or legal enforceability, and is not itself an electronic-signature or legal-advice service. Users are responsible for deciding whether a wallet acknowledgement is appropriate for their document and jurisdiction.
