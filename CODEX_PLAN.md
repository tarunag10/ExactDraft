# ExactDraft implementation plan

Status: Phases 1–2 complete. Phase 3 implementation is present; BOT deployment validation is blocked by missing deploy access. Phase 4 implementation and Phase 5 local release preparation are present, with acceptance gates still open. Phase 6 is authorized for pursuit but blocked by external prerequisites. Updated: 2026-10-19.

## Objective and authorization

Move ExactDraft from a two-wallet Monad testnet demonstration to a reliable,
privacy-conscious document comparison and acknowledgement pilot, with BOT Chain
as an additional network. Correctness and privacy come before network expansion.

Phases 1–3 were explicitly authorized by Tarun on 2026-10-19. On 2026-10-19,
Tarun explicitly asked us to pursue all remaining phases through Phase 6. This
authorizes the implementation and preparation work described here. It does not
provide BOT/mainnet RPC credentials, deployer keys or funds, written partner
terms, named operators, or external security/legal approvals. No partner
messages, funding application or use of real client documents is authorized by
this plan. Mainnet transactions remain gated on the written scope, operational
ownership, and deployment prerequisites in Phase 6.

## Baseline and product boundaries

- Next.js/TypeScript, wagmi/viem, browser SHA-256 and a small Foundry contract.
- No application backend, document upload or database in the inspected flow.
- Contract operations: create, designated-counterparty acceptance, proposer
  cancellation and public reads. Agreement IDs are deployment-local.
- Network configuration, copy and deployment key names currently assume Monad
  testnet; the contract address is a single environment value.
- The previous assessment ran ESLint and four Foundry tests successfully. This
  does not establish current hosted-demo availability, security audit completion,
  BOT compatibility or production readiness. Re-run checks during implementation.
- An acknowledgement proves that a wallet submitted the registered digest. A
  public digest can be copied without possessing or reading the document.
- Public hashes, wallet relationships, references and timestamps are metadata;
  keeping document bytes local does not make the whole workflow confidential.
- BOT's correspondence offers a feasibility assessment and deployment gas;
  development funding, engineering allocation and customer acquisition are not
  committed. Confirm project terms separately before substantive partner work.

## Execution and evidence rules

Implement phases in order. Keep each change small, reuse current libraries and
native APIs, and add dependencies only for a demonstrated gap. Preserve unrelated
work. At the start of every phase verify cwd, branch, remote and working-tree state.

For each implementation phase:

1. Trace affected callers and existing tests before editing.
2. Implement only the listed scope and retain a runnable regression check for
   non-trivial logic. Use synthetic documents and disposable test wallets.
3. Run focused tests, ESLint, TypeScript checking and the production build for
   frontend changes; run Foundry tests for contract/deployment changes. Record
   blocked checks honestly rather than substituting inspection for execution.
4. Update the phase status and evidence here, including commands/results,
   limitations and any manual or external gates still open.
5. Commit and push the completed phase after checks pass. Verify the pushed
   commit matches the intended remote branch and the working tree is clean.

A phase is complete only when its acceptance criteria have evidence. A local
build, testnet deployment, mainnet deployment and publicly usable release are
separate milestones. Do not label pending external gates complete.

## Phase 1 — Local file correctness and accurate privacy claims

Priority: first implementation slice. Dependencies: explicit instruction to start.
Primary files: LocalFileHash.tsx, hash.ts, CreateAgreementForm.tsx,
AgreementReview.tsx, page.tsx and README.md.

### Work

- Invalidate the previous digest immediately when selection changes or clears.
  Prevent stale async results from replacing the latest selection; invalidate
  outstanding work on unmount. Prevent create/accept while hashing or failed.
- Establish one tested file-size limit suitable for supported desktop/mobile
  browsers. Reject oversized files before reading their bytes. Keep the native
  SHA-256 implementation; introduce streaming only if measured needs justify it.
- Align reference validation with Solidity's 140-byte UTF-8 limit using
  TextEncoder. Replace descriptive examples with opaque identifiers and explain
  that references are public and persistent before submission.
- Replace possession-proof language with precise local-comparison and wallet-
  acknowledgement language. Explain byte equality: renaming preserves a hash;
  editing, exporting or resaving may change it despite identical appearance.
- State that document content stays local in the supported application flow,
  while digests, wallets, references and timestamps are public. Explain known-
  document matching and avoid absolute secrecy or irreversibility claims.
- Distinguish acknowledgement from identity, organisational authority, reading,
  electronic signature status and legal enforceability.

### Acceptance criteria

- A newly selected file cannot be submitted using the previous file's digest.
- The final digest/name always belongs to the latest selection, irrespective of
  completion order. Cancellation, failure and unmount cannot restore stale state.
- A file at the documented limit works; an oversized file is rejected before
  arrayBuffer is called. Errors are accessible and a valid retry succeeds.
- Frontend reference validation accepts at most 140 UTF-8 bytes, including
  international text, and rejects excess before opening a transaction request.
- Creation and review screens disclose public data and acknowledgement limits.
  No confidential title or client-detail example encourages public disclosure.
- Synthetic document bytes and filenames are absent from outbound requests,
  analytics, logs and persisted application state in the exercised flows.

### Tests and evidence

- Known SHA-256 vector, same bytes under another filename, one-byte mutation.
- Controlled async completion: select A then B, complete B then A; also failure,
  clear, unmount and attempted submission while hashing.
- File-size boundary and Unicode reference byte-length boundaries (140/141).
- Browser network/storage inspection with a distinctive synthetic marker;
  acknowledge that this verifies exercised paths, not every future integration.
- Keyboard and screen-reader status/error check; ESLint, typecheck and build.

## Phase 2 — Transaction, configuration and contract boundary correctness

Dependencies: Phase 1. Primary files: contract.ts, transaction forms/notices,
ExactDraft.sol and ExactDraft.t.sol.

### Work

- Validate contract address syntax, reject zero address and check deployed code
  on the configured chain. Fail closed with an actionable configuration error.
- Pin contract reads, submissions and receipt tracking to the intended chain.
  Simulate writes before requesting wallet submission; retain contract checks.
- Require a successful receipt before success copy. Filter decoded creation
  events by emitting contract address. Handle reverted/replaced/cancelled
  transactions and prevent duplicate submissions while pending.
- Preserve enough pending transaction context to recover after refresh without
  storing files, filenames or private keys. Namespace it by chain and contract.
- Bound route IDs to uint256; distinguish missing record, invalid ID, RPC failure
  and deployment misconfiguration. Refresh expiry state and show transaction
  errors in user language without exposing sensitive diagnostic payloads.
- Decide and document whether expired pending records may be cancelled: current
  reads report Expired but cancellation can still change stored state. Align
  contract/UI behavior and test the chosen policy before any new deployment.
  This phase chooses expiry as terminal: future deployments reject late
  cancellation; the already deployed Monad testnet bytecode remains unchanged.
- Keep the non-upgradeable contract unless review identifies a concrete need.

### Acceptance criteria

- Wrong-chain/account changes cannot submit against or confirm the wrong record.
- Failed, cancelled or replaced transactions never appear as a successful
  original operation. Refresh permits receipt recovery without duplicate writes.
- Only the configured contract's event can supply the created agreement ID.
- Invalid configuration, absent bytecode and out-of-range IDs cannot reach a
  write. A missing ID and an unavailable RPC produce distinguishable states.
- Expiry boundary and cancellation semantics are explicit and consistent.
  Expiry is terminal at block.timestamp >= expiresAt; the old immutable Monad
  testnet deployment retains its prior cancellation behavior until separately
  redeployed.

### Tests and evidence

- Unit tests verify missing/malformed/zero address rejection, uint256 route
  bounds, missing-record versus RPC error classification, simulation-before-
  write behavior, matching success-event filtering, and chain/contract/operation
  scoped pending-receipt keys.
- Contract tests for zero/self counterparty, empty/oversized reference, zero
  hash, past/equal expiry, missing IDs, both role restrictions and terminal-state
  replay; test expiry immediately before/at/after deadline and chosen cancellation
  policy. Add focused fuzz checks for permissions and terminal transitions.
- Browser smoke checks confirmed a valid missing ID is distinguished from
  invalid IDs (404), RPC/code-check failure exposes Retry, and a connected
  chain-1 wallet displays the wrong-network warning while creation remains
  disabled. `npm run test:phase2`, `npm run test:phase1`, `npm run lint`,
  `npx tsc --noEmit`, `npm run build`, and `npm run test:contract` passed.

## Phase 3 — BOT Chain testnet support alongside Monad

Dependencies: Phases 1–2; verified network settings and agreed assessment scope.
Primary files: monad.ts/network configuration, providers.tsx, contract.ts,
network notices, routes, deployment script, package scripts and .env.example.

### Work

- Verify official chain IDs, RPCs, explorers, token metadata, EVM/compiler support,
  finality expectations, RPC limits and contract verification instructions with
  current documentation and technical contacts. Published settings at assessment:
  BOT testnet 968; mainnet 677. Treat these as values to verify, not assumptions.
  Official BOT docs list BOT testnet as 968, Test BOT, `https://rpc.bohr.life`,
  and `https://scan.bohr.life/`; they describe Geth-compatible JSON-RPC and list
  Foundry. The live RPC returned `0x3c8` for `eth_chainId`. BOTScan exposes a
  “Verify & publish contract” form. BOT docs describe fast finality within two
  blocks when the validator threshold is met; ExactDraft reports receipt
  inclusion as confirmed, not finalized. Compiler/source verification remains
  pending an actual deployment.
- Use a small shared configuration for chain, RPC, explorer, contract address and
  deployment block. Retain Monad configuration; do not build a generic plugin system.
- Namespace records, caches and shared URLs by chain and contract. Preserve old
  Monad links with an explicit legacy mapping; never reinterpret them as BOT IDs.
- Generalise deployer configuration without placing keys in public environment
  variables. Keep secrets out of repository, logs, client bundle and reports.
- Make active network and testnet status clear throughout the UI. Handle wallet
  add/switch rejection and keep public verification available without a wallet.
- Deploy only to BOT testnet when implementation authorization covers it and
  disposable wallet/faucet access is available. Verify source or record a blocked
  explorer gate; publish address, transaction, block and compiler settings.

### Acceptance criteria

- Existing Monad records still resolve correctly. Identical IDs on two networks
  remain distinct, including caches, receipts, exports and links.
- Two test wallets complete create → independent comparison → acknowledgement
  on BOT testnet. Mismatch, wrong signer, cancellation and expiry behave correctly.
- Explorer links use the selected network; wallet rejection permits recovery.
- Deployment artifacts establish exactly which source/compiler produced the
  testnet contract. No mainnet transaction or migration occurs in this phase.

### Tests and evidence

- Configuration and route tests for both networks, legacy links, unknown networks,
  invalid addresses and chain/contract cache separation.
- Foundry tests under the confirmed target EVM settings; clean frontend build.
- Two-profile testnet walkthrough using synthetic files, with transaction hashes,
  receipt statuses, contract address and source-verification outcome recorded.
- RPC outage/wrong-chain/reload checks. Testnet failure blocks deployment claims,
  not unrelated local fixes. Record funding/access blockers precisely.

## Phase 4 — Complete the two-party user workflow

Dependencies: Phase 3 validated. Retain two-party scope.

### Work

- Add concise onboarding, counterparty address confirmation and gas explanation.
  Make clear that users share the actual file separately through their own channel.
- Add copy/share review links, proposer cancellation and created/awaiting history.
- Query indexed events from the deployment block in bounded pages, deduplicate
  and retry within RPC limits. Do not scan every agreement on every page load.
  Add a backend indexer only if observed limits require one.
- Export versioned JSON evidence with chain/contract/ID, digest algorithm,
  participants, timestamps, transaction/block references and observed finality.
  Include verification instructions and limitations; offer a printable record.
- Add a supported mobile wallet path after checking current connector support.
  Preserve read-only use and actionable no-wallet/insufficient-gas states.

### Acceptance criteria and tests

- New users can complete the workflow from instructions without developer help;
  run an observed pilot walkthrough with both participants.
- Only the proposer sees an enabled valid cancellation action; acceptance and
  cancellation races resolve to actual on-chain state. Test both orderings.
- History is role-correct, paginated and duplicate-free; test overlapping event
  pages, retries, empty results and deployment-block boundaries.
- Shared links survive reload/copy/paste and resolve to the same deployment.
- Evidence exports reproduce on-chain values, contain no local filenames/file
  bytes and clearly identify pending versus finalized evidence. Test round-trip
  parsing, large integer serialization and independent record verification.
- Complete keyboard, screen-reader, mobile-wallet and timezone/expiry checks;
  run automated regression checks, ESLint, typecheck, build and Foundry tests.

## Phase 5 — Security, privacy and operational release preparation

Dependencies: working testnet pilot; before real sensitive documents or mainnet.

### Work

- Review contract permissions, public-data exposure, frontend dependencies and
  transaction boundaries independently. Fix material findings and retest.
- Decide the sensitive-document privacy model explicitly. Public SHA-256 enables
  known-document matching. Assess a domain-separated salted commitment only if
  pilot needs require it; define cryptographic salt generation, secure exchange,
  recovery/export and independent verification before changing the protocol.
  Never silently change existing hash semantics. A new scheme needs a versioned
  deployment, compatibility plan and focused security review.
- Add CI for reproducible dependency installation, lint, typecheck, build,
  regression and contract tests. Review dependency findings for actual exposure.
- Configure appropriate security headers/CSP without breaking wallet operation.
  Add bounded RPC retry/fallback, timeouts and privacy-conscious operational
  monitoring. Publish supported browsers, file limit, support and incident process.
- Document public-chain persistence, hosting/RPC data handling and retention,
  external file sharing, wallet-loss implications and service limitations.
  Obtain appropriate jurisdiction-specific review for intended customer markets.
- Name hosting, RPC, maintenance and optional sponsorship owners and budgets;
  document rollback of frontend releases and handling immutable contract defects.

### Acceptance criteria and tests

- No unresolved critical/high security finding; document other accepted risks,
  owner and remedy. Independent review scope and limitations are recorded.
- Any commitment redesign passes deterministic vectors, distinct-salt isolation,
  salt-loss handling, domain/version separation and cross-deployment verification
  tests before use; otherwise record the public-hash limitation and approved scope.
- CI passes on a fresh checkout without private deployment credentials.
- CSP/header browser checks, RPC failover and incident/rollback drill pass.
- Monitoring and logs exclude files, filenames, sensitive references and secrets;
  verify using synthetic markers and retention configuration inspection.
- Accessibility and supported desktop/mobile browser checks pass. Published
  service/privacy material matches actual infrastructure and reviewed scope.

## Phase 6 — Controlled mainnet pilot and broader release decision

Dependencies: Phases 1–5; explicit mainnet authorization; written partner scope.

### Work

- Confirm BOT responsibilities, gas allocation, development support, maintenance,
  IP/licensing, publicity, exclusivity and programme terms in writing. Keep
  participation rewards separate from the operating budget.
- Use a limited deployment wallet, verified network settings and reproducible
  deployment steps. Verify mainnet bytecode/source and configuration before
  enabling writes. Start with synthetic smoke tests and a small invited cohort.
- Assess sponsorship only if pilot onboarding demonstrates the need. Require
  supported infrastructure, quotas, cost caps and abuse controls before enabling.
- Track workflow completion, failed transactions, time to acknowledgement,
  support demand and repeat use without collecting document content. Define
  numeric go/no-go targets with the pilot owner before collecting results.

### Acceptance criteria and tests

- Written commercial/operational scope, budget, incident owner and pilot success
  targets are recorded; uncommitted support is labelled as such.
- Mainnet address, deployment transaction/block, source verification and successful
  synthetic two-wallet receipts are recorded separately from testnet evidence.
- Invited users complete the intended workflows; no unresolved data-integrity or
  privacy defect remains. Pilot results satisfy the pre-agreed go/no-go targets.
- Repeat production smoke, wallet/network recovery, evidence verification and
  monitoring checks. If sponsorship is added, test exhaustion, abuse limits and
  outage behavior without unexpected user charges.
- Broader availability requires an explicit decision based on evidence; deployment
  alone does not complete this phase or establish adoption/legal enforceability.

## Deferred scope

Multi-party signing, organisational identity/authority verification, encrypted
file hosting, email delivery, enterprise integrations, token issuance and upgradeable
contracts are outside the initial pilot. Reconsider only for a demonstrated user
need and a separately scoped implementation. Do not manufacture transactions to
meet ecosystem reward thresholds.

## Phase status and evidence log

| Phase | Status | Completion evidence |
| --- | --- | --- |
| Plan | Written | Commit `6d1363a` pushed to `origin/main`; working tree was clean. |
| 1 Correctness/privacy | Complete | Commit/push recorded in Git history; `npm run test:phase1`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `npm run test:contract` passed. Browser checks exercised out-of-order hash completion, clear, 25 MB rejection, disabled submit during hashing, pending-hash unmount, accessible file label/error, and no file marker in resource URLs. |
| 2 Transaction/configuration | Complete | `npm run test:phase2` (6 tests), `npm run test:phase1` (3 tests), `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `npm run test:contract` (8 tests, including 256-run fuzz checks) passed. Browser smoke checks verified invalid-ID 404, missing-record classification, RPC retry, and chain-1 wallet warning with submit disabled. Future contract source rejects cancellation at/after expiry; existing immutable Monad testnet code is unchanged. |
| 3 BOT testnet | Implementation present; deployment blocked | Added BOT chain/provider, per-network RPC/explorer/address configuration, chain-scoped review routes and receipt/explorer links, and deploy chain-ID guards (only 968/10143). Prior verification recorded official settings and live RPC identity. The local environment has no BOT contract address or verified deployment block. A read-only request to the official RPC returned chain ID `0x3c8` and current block `0x1a2adc6`. Three isolated test wallets were generated with private keys outside the repository under mode 0600, but they are not funded. The official faucet requires human CAPTCHA verification before it will send test BOT. Phase 3 acceptance still requires faucet funding, an actual deployment, bytecode/source verification, two independent wallet transactions, and receipts. |
| 4 User workflow | Implementation present; pilot acceptance blocked | Added proposer-only cancellation with simulated writes and receipt/event checks, copy/share review links, participant-filtered bounded history, deployment-block safeguards, address confirmation, and allowlisted JSON evidence export. Local history/evidence/transaction unit tests, all frontend tests, lint, typecheck, production build, and all 9 Foundry tests pass. The Phase 3 dependency is unmet; no BOT address/block is configured, and the observed two-participant walkthrough, mobile-device/wallet, timezone/expiry, and assistive-technology checks remain outstanding. The hosted Monad page was inspected with a synthetic marker file: the browser produced the local digest; the request log contained the app loads and an `eth_getCode` RPC read, not the filename or file bytes; the marker was absent from local/session storage. At a 390 px viewport there was no horizontal overflow and the file input had an accessible label. No wallet was connected or transaction sent. The hosted history panel reports that its deployment block is not configured. |
| 5 Release preparation | Local preparation present; release gates open | Added read-only GitHub Actions for frontend/contract checks, initial browser security headers, selected-RPC timeouts/retries, and `OPERATIONS.md`; prepared partner-facing material in `partner-kit/`. Hosted CI passed on `83636ac` and `d14d57d`; the latter pins Ubuntu 24.04 and Actions Node 24-compatible releases. This follow-up updates the app to Next.js 16.4.2, its native compiler, and the supported flat ESLint config; removes effect-driven state resets flagged by the current React lint rules; and fixes transaction restoration to subscribe to session storage changes. Lint, typecheck, 18 frontend tests, 9 Foundry tests, and `npx next build --webpack` pass. After a scoped override pins WalletConnect’s nested `viem@2.23.2` WebSocket dependency to patched `ws@8.22.0`, `npm audit` reports 26 findings (5 high, 21 moderate, 0 critical). `npm audit --omit=dev` reports 21 moderate, 0 high or critical. All remaining highs are in the development-only Next ESLint dependency chain (`braces`/`fast-glob`/`micromatch`); npm offers no safe compatible patch. The override passes lint, typecheck, all 18 frontend tests, all 9 Foundry tests and the webpack production build; hosted CI for this lockfile update is pending. The default Turbopack local build and runtime header/browser checks are blocked by sandbox process/socket permissions; hosted CI passed for this update as run `39310156111` on commit `2554b05`. No independent security/privacy review, provider/legal review, monitoring/rollback drill, named operations owner or approved budget is recorded. |
| 6 Mainnet pilot | Authorized for pursuit; blocked by prerequisites | Tarun requested all phases, including Phase 6. No mainnet deployment was attempted. Written partner scope/terms, approved operating budget and success targets, security/privacy approvals, hosting/RPC/incident owners, mainnet RPC/deployer custody/funding, source verification and prior pilot evidence are absent. Do not onboard users or claim production readiness until these are supplied and validated. |

## Reference material

- Repository README.md: existing architecture and demonstration instructions;
  deployment claims must be independently refreshed before reuse.
- BOT developer guide: https://dev-docs.botchain.ai/docs/Developers/quick-guide/
- BOT programme: https://www.botchain.ai/en/ecosystem-support/
- Partner correspondence supplied by Tarun: limited feasibility assessment,
  synthetic documents, public metadata constraints and uncommitted funding.

Keep private correspondence and contact details out of public implementation artifacts.

## Current local verification (2026-10-19)

- `node --test tests/*.test.mjs`: 18 passed.
- `npm run lint`: passed with Next.js 16 flat config and current React rules.
- `npx tsc --noEmit --incremental false`: passed.
- `npm ci`: passed from the corrected lockfile. `npm audit --audit-level=moderate`: 26 findings (5 high, 21 moderate, 0 critical), confined at high severity to dev-only Next ESLint dependencies. `npm audit --omit=dev`: 21 moderate, 0 high, 0 critical. A scoped override removes the production `ws` high finding; no force-major upgrades were applied. The first override form failed hosted clean-install CI (`39311196831`) because npm treated the peer `viem` package as overridden. The override is now scoped beneath `@walletconnect/utils`; a clean `npm ci` and all local checks pass with that form, and hosted clean-install CI passed as run `39311647985` on commit `8e4a54b`.
- `npx next build --webpack`: passed; static and dynamic app routes compiled. `npm run build` uses Turbopack and remains unverified locally because the sandbox blocks its process/socket setup; hosted CI is the validation gate.
- `npm run test:contract`: 9 passed, including 256-run fuzz checks. Foundry emitted a harmless warning that its global signature cache could not be written in the sandbox.
- `git diff --check`: passed.
- Next 16 generated `/icon.svg` successfully after adding the app favicon; hosted redeployment was not yet observed.
- Official BOT testnet RPC read-only checks returned chain ID `0x3c8` (968) and block `0x1a2adc6`; no contract was deployed.
- Hosted synthetic-file check: local SHA-256 shown, no filename/marker in observed requests or browser storage; 390 px viewport has no horizontal overflow and file picker label is present. No wallet or transaction was used.
- Hosted response headers expose CSP, HSTS, frame/content-type protections, referrer and permissions policy.
- Hosted clean-install CI run `39311647985` passed on `8e4a54b` (frontend and contract jobs).
- `npm start`: blocked by sandbox socket permission (`listen EPERM` on `0.0.0.0:3000`), so local HTTP header/browser verification was not completed.
- BOT deployment/source verification/two-wallet pilot, faucet CAPTCHA, independent security and privacy review, operational drills, legal/partner approvals, and mainnet deployment remain external gates, not proven by these checks.
