# ExactDraft partner showcase kit

A review pack for a feasibility conversation about an optional BOT Chain testnet deployment. It is based on the current repository and the opportunity correspondence. It is safe to share publicly: it contains no private correspondence, contact details, client data, deployment keys, or confidential documents.

## Start here

- [Showcase deck](./leon-showcase.html) — browser-presentable, printable overview.
- [Executive brief](./EXECUTIVE_BRIEF.md) — product, proposed pilot, current status, and decisions to resolve.
- [Technical and privacy framework](./TECHNICAL_PRIVACY.md) — architecture, data flow, permissions, risks, and readiness gaps.
- [Demo runbook](./DEMO_RUNBOOK.md) — synthetic two-wallet walkthrough and fallback.
- [Feasibility and pilot framework](./FEASIBILITY_FRAMEWORK.md) — scope options, gates, ownership questions, and measurable acceptance criteria.
- [Meeting guide](./MEETING_GUIDE.md) — short talk track and questions for Leon.

## Evidence and status

The source repository contains BOT testnet configuration for chain ID `968`, RPC `https://rpc.bohr.life`, and explorer `https://scan.bohr.life`. Monad testnet support remains alongside it. The app requires a separately configured contract address for each chain. The BOT address is not configured in this checkout; the testnet contract has not been deployed, source-verified, or exercised with two wallets. Those are open gates, not completed work. The existing public demo is described in the root README, but its current availability and configuration have not been independently verified for this kit.

The BOT settings and program details can change. Reconfirm them with BOT Chain before using them for a deployment or an external commitment. Official references: [BOT Chain developer quick guide](https://dev-docs.botchain.ai/docs/Developers/quick-guide/), [BOT Chain ecosystem support](https://www.botchain.ai/en/ecosystem-support/), and [fast finality](https://dev-docs.botchain.ai/docs/introduction/fast-finality/).

## Sharing guidance

Use synthetic files and opaque references in any live walkthrough. Do not submit confidential or client documents. Describe the output as a public hash attestation and wallet acknowledgement, not identity verification, proof of possession, contract enforceability, or legal advice. Any funding, gas allocation, support, reward, or customer access requires separate written confirmation.
