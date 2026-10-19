"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import type { Address } from "viem";
import { agreementPath } from "@/src/lib/network-core.mjs";
import { readAgreementHistory, type AgreementCreatedLog, type AgreementHistoryRole } from "@/src/lib/agreement-history-core.mjs";
import { contractAddressErrorFor, contractAddressFor, exactDraftAbi } from "@/src/lib/contract";
import { getNetworkConfig, monadTestnet, type NetworkConfig, type SupportedChainId } from "@/src/lib/networks";

const BLOCK_WINDOW = 20_000n;
const LOG_PAGE_SIZE = 2_000;
const ROW_PAGE_SIZE = 10;

const createdEvent = exactDraftAbi.find(
  (item): item is Extract<(typeof exactDraftAbi)[number], { type: "event"; name: "AgreementCreated" }> =>
    item.type === "event" && item.name === "AgreementCreated",
);

type DeploymentBlockNetwork = NetworkConfig & { deploymentBlock?: bigint | number | string };

function parseDeploymentBlock(value: bigint | number | string | undefined): bigint | undefined {
  if (value === undefined) return undefined;
  try {
    const parsed = BigInt(value);
    return parsed >= 0n ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function mergeLogs(current: AgreementCreatedLog[], incoming: AgreementCreatedLog[]): AgreementCreatedLog[] {
  const merged = new Map<string, AgreementCreatedLog>();
  for (const log of [...current, ...incoming]) {
    const logIndex = log.logIndex;
    const key = `${log.transactionHash.toLowerCase()}:${String(logIndex)}`;
    merged.set(key, log);
  }
  return [...merged.values()].sort((a, b) => {
    const blockDelta = a.blockNumber - b.blockNumber;
    if (blockDelta !== 0n) return blockDelta < 0n ? -1 : 1;
    const indexDelta = BigInt(a.logIndex) - BigInt(b.logIndex);
    return indexDelta < 0n ? -1 : indexDelta > 0n ? 1 : 0;
  });
}

function participantLabel(role: AgreementHistoryRole, account: Address, proposer?: string) {
  if (role === "proposer") return "You proposed this agreement";
  if (role === "counterparty") return "You are the counterparty";
  return proposer?.toLowerCase() === account.toLowerCase() ? "You proposed this agreement" : "You are the counterparty";
}

export function AgreementHistoryPanel({ deploymentBlock: deploymentBlockOverride }: { deploymentBlock?: bigint | number | string }) {
  const { address: account, chainId } = useAccount();
  const activeChainId = chainId ?? monadTestnet.id;
  const network = getNetworkConfig(activeChainId);
  const client = usePublicClient({ chainId: (network?.chain.id ?? monadTestnet.id) as SupportedChainId });
  const configuredDeploymentBlock = (network as DeploymentBlockNetwork | undefined)?.deploymentBlock;
  const deploymentBlock = parseDeploymentBlock(deploymentBlockOverride ?? configuredDeploymentBlock);
  const [role, setRole] = useState<AgreementHistoryRole>("participant");
  const [entries, setEntries] = useState<AgreementCreatedLog[]>([]);
  const [oldestScannedBlock, setOldestScannedBlock] = useState<bigint>();
  const [visibleCount, setVisibleCount] = useState(ROW_PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const requestId = useRef(0);

  const contractAddress = network ? contractAddressFor(activeChainId) : undefined;
  const contractAddressError = network ? contractAddressErrorFor(activeChainId) : undefined;
  const setupIssue = !network
    ? "This wallet network is not supported. Switch to Monad or BOT Chain testnet to view agreement history."
    : contractAddressError
      ? `${contractAddressError} Set ${network.contractEnvName} to a valid deployed address before loading history.`
    : !contractAddress
      ? `Configure ${network.contractEnvName} with the deployed contract address before loading history.`
      : deploymentBlock === undefined
        ? `Set a verified deploymentBlock on the ${network.label} network configuration before loading history. The panel will not scan from block zero.`
        : !account
          ? "Connect the wallet whose agreements you want to view. History is limited to agreements where that address is a participant."
          : !client
            ? `The ${network.label} public RPC client is unavailable. Retry after the network connection is restored.`
            : undefined;

  useEffect(() => {
    requestId.current += 1;
    setEntries([]);
    setOldestScannedBlock(undefined);
    setVisibleCount(ROW_PAGE_SIZE);
    setError(undefined);
    setIsLoading(false);
  }, [account, activeChainId, contractAddress, role]);

  const loadRange = useCallback(async (fromBlock: bigint, toBlock: bigint) => {
    if (!client || !contractAddress || !account || !network || !createdEvent) return [];
    const getLogs = async ({ address, fromBlock: start, toBlock: end }: { address: Address; fromBlock: bigint; toBlock: bigint }) => {
      const query = (field: "proposer" | "counterparty") => client.getLogs({
        address,
        fromBlock: start,
        toBlock: end,
        event: createdEvent,
        args: { [field]: account },
      });
      if (role === "participant") {
        const [proposed, received] = await Promise.all([query("proposer"), query("counterparty")]);
        return [...proposed, ...received] as unknown as AgreementCreatedLog[];
      }
      return await query(role) as unknown as AgreementCreatedLog[];
    };
    return readAgreementHistory({
      getLogs,
      address: contractAddress,
      deploymentBlock: deploymentBlock!,
      fromBlock,
      toBlock,
      pageSize: LOG_PAGE_SIZE,
      maxRetries: 2,
      retryDelayMs: 250,
      account,
      role,
    });
  }, [account, client, contractAddress, deploymentBlock, network, role]);

  const refresh = useCallback(async () => {
    if (setupIssue || !deploymentBlock) return;
    const id = ++requestId.current;
    setIsLoading(true);
    setError(undefined);
    setEntries([]);
    setVisibleCount(ROW_PAGE_SIZE);
    try {
      const head = await client!.getBlockNumber();
      const firstBlock = head - deploymentBlock + 1n > BLOCK_WINDOW ? head - BLOCK_WINDOW + 1n : deploymentBlock;
      const logs = await loadRange(firstBlock, head);
      if (requestId.current !== id) return;
      setEntries(logs);
      setOldestScannedBlock(firstBlock);
    } catch {
      if (requestId.current === id) setError(`Could not load ${network?.label ?? "network"} history. Check the selected network and RPC, then retry.`);
    } finally {
      if (requestId.current === id) setIsLoading(false);
    }
  }, [client, deploymentBlock, loadRange, network?.label, setupIssue]);

  const loadMore = useCallback(async () => {
    if (visibleCount < entries.length) {
      setVisibleCount((count) => count + ROW_PAGE_SIZE);
      return;
    }
    if (!deploymentBlock || oldestScannedBlock === undefined || oldestScannedBlock <= deploymentBlock || isLoading) return;
    const id = ++requestId.current;
    const end = oldestScannedBlock - 1n;
    const start = end - BLOCK_WINDOW + 1n > deploymentBlock ? end - BLOCK_WINDOW + 1n : deploymentBlock;
    setIsLoading(true);
    setError(undefined);
    try {
      const older = await loadRange(start, end);
      if (requestId.current !== id) return;
      setEntries((current) => mergeLogs(current, older));
      setOldestScannedBlock(start);
      setVisibleCount((count) => count + ROW_PAGE_SIZE);
    } catch {
      if (requestId.current === id) setError(`Could not load older ${network?.label ?? "network"} history. Retry when the RPC is available.`);
    } finally {
      if (requestId.current === id) setIsLoading(false);
    }
  }, [deploymentBlock, entries.length, isLoading, loadRange, network?.label, oldestScannedBlock, visibleCount]);

  const visibleEntries = useMemo(() => entries.slice(0, visibleCount), [entries, visibleCount]);
  const hasOlderRange = deploymentBlock !== undefined && oldestScannedBlock !== undefined && oldestScannedBlock > deploymentBlock;

  return (
    <section aria-labelledby="agreement-history-heading" className="rounded-3xl border border-[#d7dfd7] bg-[#fffefa] p-5 shadow-[0_12px_38px_rgba(24,45,37,0.06)] sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mono-label text-[10px] font-bold text-[#75817a]">Onchain records</p>
          <h2 id="agreement-history-heading" className="mt-2 text-2xl font-black tracking-tight text-[#173d35]">Your agreements</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#66736c]">History is read from the active testnet and limited to agreements involving your connected wallet.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="history-role" className="sr-only">Filter agreement role</label>
          <select id="history-role" value={role} onChange={(event) => { setRole(event.target.value as AgreementHistoryRole); setEntries([]); setOldestScannedBlock(undefined); setError(undefined); }} disabled={isLoading} className="rounded-full border border-[#cbd5cc] bg-white px-3 py-2 text-xs font-semibold text-[#173d35]">
            <option value="participant">All my agreements</option>
            <option value="proposer">I proposed</option>
            <option value="counterparty">I received</option>
          </select>
          <button type="button" onClick={() => void refresh()} disabled={isLoading || Boolean(setupIssue)} className="rounded-full bg-[#173d35] px-4 py-2 text-xs font-bold text-white hover:bg-[#28594d] disabled:cursor-not-allowed disabled:opacity-50">
            {isLoading && !entries.length ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {setupIssue ? <p role="status" className="mt-5 rounded-xl border border-[#eadbb9] bg-[#fff7e6] p-4 text-sm leading-6 text-[#6d541d]">{setupIssue}</p> : null}
      {error ? <div role="alert" className="mt-5 rounded-xl border border-[#edc4bd] bg-[#fff1ee] p-4 text-sm text-[#853c31]">{error} <button type="button" onClick={() => void refresh()} className="ml-2 font-bold underline underline-offset-2">Retry</button></div> : null}

      {!setupIssue && !error && !isLoading && entries.length === 0 && oldestScannedBlock !== undefined ? <p role="status" className="mt-6 rounded-xl bg-[#f1f4ef] p-4 text-sm text-[#66736c]">No agreements found for this wallet in the scanned range.</p> : null}
      {visibleEntries.length ? <ol className="mt-6 space-y-3" aria-label="Agreement history">
        {visibleEntries.map((entry) => {
          const agreementId = entry.args.agreementId;
          const agreementHref = agreementPath(network!.slug, String(agreementId));
          const proposer = entry.args.proposer;
          const counterparty = entry.args.counterparty;
          const reference = entry.args.referenceText;
          const txHref = `${network!.explorerUrl}/tx/${entry.transactionHash}`;
          return <li key={`${entry.transactionHash}:${String(entry.logIndex)}`} className="flex flex-col gap-3 rounded-2xl border border-[#e1e7e0] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#173d35]">Agreement #{String(agreementId)}</p>
              <p className="mt-1 break-all text-xs text-[#66736c]">{participantLabel(role, account!, proposer)} · block {entry.blockNumber.toString()}</p>
              {typeof reference === "string" ? <p className="mt-1 break-all font-mono text-xs text-[#7b8780]">Public reference: {reference}</p> : null}
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-bold">
              {agreementHref ? <Link href={agreementHref} className="text-[#28594d] underline underline-offset-4">Review</Link> : null}
              <a href={txHref} target="_blank" rel="noreferrer" className="text-[#28594d] underline underline-offset-4">Creation transaction ↗</a>
              {proposer ? <a href={`${network!.explorerUrl}/address/${proposer}`} target="_blank" rel="noreferrer" className="text-[#66736c] underline underline-offset-4">Proposer ↗</a> : null}
              {counterparty ? <a href={`${network!.explorerUrl}/address/${counterparty}`} target="_blank" rel="noreferrer" className="text-[#66736c] underline underline-offset-4">Counterparty ↗</a> : null}
            </div>
          </li>;
        })}
      </ol> : null}

      {!setupIssue && (visibleCount < entries.length || hasOlderRange) ? <button type="button" onClick={() => void loadMore()} disabled={isLoading} className="mt-5 w-full rounded-xl border border-[#cbd5cc] px-4 py-3 text-sm font-bold text-[#173d35] hover:bg-[#f1f4ef] disabled:opacity-50">
        {isLoading ? "Loading history…" : visibleCount < entries.length ? "Show more agreements" : "Load older agreements"}
      </button> : null}
      {network && entries.length ? <p className="mt-4 text-xs text-[#7b8780]">Showing {visibleEntries.length} of {entries.length} agreements on {network.label}. Reads are limited to 20,000 blocks per request window.</p> : null}
    </section>
  );
}
