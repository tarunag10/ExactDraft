# Feasibility and pilot framework

## Scope options

| Option | Outcome | Includes | Decision gate |
| --- | --- | --- | --- |
| A. Technical assessment | A written BOT testnet deployment checklist and risk/effort estimate | Confirm network parameters, faucet/gas, RPC/explorer, compiler/verifier, finality, ownership, test plan | Partner identifies technical contact and answers access/support questions |
| B. BOT testnet demonstration | A source-verifiable (where supported) testnet deployment plus synthetic two-wallet evidence | Option A, deploy/configure, run test matrix, publish evidence and known limitations | Disposable testnet wallet and gas process are available; chain details confirmed |
| C. Invited testnet pilot | Small cohort tests usability and operational support | Option B plus onboarding, support owner, privacy text, success metrics, incident process | Written scope, support responsibilities, and cohort criteria agreed |
| D. Mainnet pilot | Controlled production deployment decision | Separate security/legal/operational review, cost and support plan, explicit deployment authorization | Written partner terms, approved risk owner, go/no-go metrics, explicit authorization |

Recommended immediate scope: Option A, then decide whether Option B is justified. Do not treat the opportunity or a testnet configuration as authorization for mainnet.

## Work breakdown and exit evidence

| Workstream | Tasks | Exit evidence |
| --- | --- | --- |
| Network validation | Confirm chain ID/RPC/explorer/faucet, gas token, RPC limits, EVM/compiler support, finality semantics | Dated settings checklist with source/contact and unresolved items |
| Deployment reproducibility | Review source commit, compiler and optimizer, deploy using isolated test wallet, capture metadata | Address, tx hash, block, receipt, source revision, compiler settings; no key disclosure |
| Explorer verification | Submit source/metadata to explorer or record reason verification cannot complete | Verified contract page or blocker and reproducible follow-up |
| User flow | Run the synthetic test matrix with two separate wallets and reload/network recovery | Evidence sheet with test results and public transaction references |
| Privacy and UX | Check copy, public fields, local file handling, opaque reference guidance, failure behavior | Reviewed user-facing wording and no unresolved privacy-critical issue |
| Operations | Identify RPC, gas, wallet, incident, release/configuration, and user-support owners | Named owner per responsibility and escalation route |
| Pilot decision | Agree cohort, duration, metrics, and success thresholds before collecting results | Written go/no-go decision and metrics owner |

## Acceptance criteria for a testnet demonstration

- Correct BOT chain is selected and verified; the configured address has expected contract code.
- A create → independent local comparison → designated-wallet acknowledgement succeeds with synthetic files.
- Mismatch and wrong signer cannot result in acceptance; cancellation and expiry match contract rules.
- BOT-specific review URLs and explorer links resolve correctly; Monad legacy links continue to resolve to Monad.
- Reload, wrong-chain, wallet rejection, and RPC outage produce recoverable or clearly blocked states without false success.
- Deployment/source/compiler evidence is reproducible and source verification is recorded as complete or blocked.
- No mainnet action, confidential data use, or unconfirmed reward activity occurs.

## Metrics for an invited pilot

Agree numeric targets before inviting users. Suggested measures that avoid collecting document contents:

- Completion rate for create and acknowledgement flows.
- Median time from invitation to acknowledgement, excluding chain outage windows.
- Transaction failure and retry rate, categorized by user/network/RPC causes.
- Number of support requests and time to resolution.
- Number of wrong-network or mismatch recoveries.
- Repeat use and qualitative clarity feedback.

Do not infer demand from raw transactions. Do not generate transactions to meet ecosystem criteria. Do not collect files, file names, or sensitive references for analytics.

## Responsibilities to settle in writing

| Topic | Question |
| --- | --- |
| Gas | Is testnet gas provided, by whom, in what amount, how is wallet funding handled, and what happens when funds run out? |
| Development | Is any engineering support or funding approved, or is this self-funded integration work? Define deliverables and acceptance authority. |
| Infrastructure | Who operates RPC/explorer/faucet, stated quotas/SLA, outage notice, and escalation? |
| Security | Who reviews contract source/configuration; is an independent audit expected; who owns incident response? |
| Maintenance | Who maintains the frontend, contract configuration, dependency upgrades, and support after the demo? |
| Programme | What eligibility, usage, reward, reporting, customer, publicity, IP/licence, or exclusivity terms apply? Who approves? |
| Data/legal | What intended use and jurisdictions are in scope; what privacy/legal language and retention expectations apply? |
| Exit | How are the pilot and test wallets closed out, and how are users told that public chain records remain permanent? |

Treat any maximum programme pool or conditional reward as unapproved until a written award with specific terms exists. Separate gas assistance from development budget, maintenance, customer access, and rewards.
