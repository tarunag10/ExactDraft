import type { Abi, Address, TransactionReceipt } from "viem";

export function submitSimulatedTransaction<Request extends object, Result>(
  publicClient: { simulateContract(request: Request): Promise<unknown> },
  writeContract: (request: Request) => Promise<Result>,
  request: Request,
): Promise<Result>;

export function findContractEvent(
  receipt: TransactionReceipt | undefined,
  abi: Abi | readonly unknown[],
  address: Address | undefined,
  eventName: string,
  expectedAgreementId?: bigint,
): { eventName: string; args: Record<string, unknown> } | undefined;
