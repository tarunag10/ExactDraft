const MAX_PAGE_SIZE = 5_000;
const MAX_RETRIES = 5;

function asBlock(value, name) {
  try {
    const block = BigInt(value);
    if (block < 0n) throw new Error();
    return block;
  } catch {
    throw new TypeError(`${name} must be a non-negative block number.`);
  }
}

function logKey(log) {
  const index = log.logIndex;
  if (log.transactionHash && index !== undefined && index !== null) {
    return `${log.transactionHash.toLowerCase()}:${String(index)}`;
  }
  if (log.blockHash && index !== undefined && index !== null) {
    return `${log.blockHash.toLowerCase()}:${String(index)}`;
  }
  throw new TypeError("Each event log must include a transactionHash or blockHash and logIndex.");
}

function roleMatches(log, account, role) {
  if (!role) return true;
  if (typeof account !== "string" || !/^0x[\da-fA-F]{40}$/.test(account)) {
    throw new TypeError("A valid account is required when filtering event history by role.");
  }
  const args = log.args ?? {};
  const proposer = typeof args.proposer === "string" ? args.proposer.toLowerCase() : "";
  const counterparty = typeof args.counterparty === "string" ? args.counterparty.toLowerCase() : "";
  const normalizedAccount = account.toLowerCase();
  if (role === "proposer") return proposer === normalizedAccount;
  if (role === "counterparty") return counterparty === normalizedAccount;
  return proposer === normalizedAccount || counterparty === normalizedAccount;
}

function compareLogs(a, b) {
  const blockOrder = BigInt(a.blockNumber ?? 0) - BigInt(b.blockNumber ?? 0);
  if (blockOrder !== 0n) return blockOrder < 0n ? -1 : 1;
  const indexOrder = BigInt(a.logIndex ?? 0) - BigInt(b.logIndex ?? 0);
  return indexOrder < 0n ? -1 : indexOrder > 0n ? 1 : 0;
}

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

/**
 * Read AgreementCreated logs in bounded, inclusive block ranges. Deployment
 * block is a hard lower bound; retries are finite and duplicate provider logs
 * are removed by transaction hash/log index.
 */
export async function readAgreementHistory({
  getLogs,
  address,
  deploymentBlock,
  fromBlock = deploymentBlock,
  toBlock,
  pageSize = 2_000,
  maxRetries = 2,
  retryDelayMs = 100,
  wait = sleep,
  account,
  role,
}) {
  if (typeof getLogs !== "function") throw new TypeError("getLogs must be a function.");
  if (typeof address !== "string" || !/^0x[\da-fA-F]{40}$/.test(address)) throw new TypeError("address must be a contract address.");
  const deployedAt = asBlock(deploymentBlock, "deploymentBlock");
  const start = fromBlock === undefined ? deployedAt : asBlock(fromBlock, "fromBlock");
  const end = asBlock(toBlock, "toBlock");
  if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    throw new RangeError(`pageSize must be between 1 and ${MAX_PAGE_SIZE}.`);
  }
  if (!Number.isSafeInteger(maxRetries) || maxRetries < 0 || maxRetries > MAX_RETRIES) {
    throw new RangeError(`maxRetries must be between 0 and ${MAX_RETRIES}.`);
  }
  if (!Number.isSafeInteger(retryDelayMs) || retryDelayMs < 0) throw new RangeError("retryDelayMs must be a non-negative safe integer.");
  if (role !== undefined && !["proposer", "counterparty", "participant"].includes(role)) {
    throw new TypeError("role must be proposer, counterparty, or participant.");
  }
  if (role !== undefined && (typeof account !== "string" || !/^0x[\da-fA-F]{40}$/.test(account))) {
    throw new TypeError("A valid account is required when filtering event history by role.");
  }

  const boundedStart = start < deployedAt ? deployedAt : start;
  if (end < boundedStart) return [];

  const unique = new Map();
  const pageBlocks = BigInt(pageSize);
  for (let pageStart = boundedStart; pageStart <= end; pageStart += pageBlocks) {
    const pageEnd = pageStart + pageBlocks - 1n < end ? pageStart + pageBlocks - 1n : end;
    let logs;
    for (let attempt = 0; ; attempt += 1) {
      try {
        logs = await getLogs({ address, fromBlock: pageStart, toBlock: pageEnd });
        break;
      } catch (error) {
        if (attempt >= maxRetries) throw error;
        await wait(retryDelayMs * (attempt + 1));
      }
    }
    if (!Array.isArray(logs)) throw new TypeError("getLogs must return an array of event logs.");
    for (const log of logs) {
      if (!roleMatches(log, account, role === "participant" ? "participant" : role)) continue;
      unique.set(logKey(log), log);
    }
  }
  return [...unique.values()].sort(compareLogs);
}
