import { decodeEventLog } from "viem";

export async function submitSimulatedTransaction(publicClient, writeContract, request) {
  await publicClient.simulateContract(request);
  return writeContract(request);
}

export function findContractEvent(receipt, abi, address, eventName, expectedAgreementId) {
  if (!receipt || receipt.status !== "success" || !address) return undefined;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== address.toLowerCase()) continue;
    try {
      const event = decodeEventLog({ abi, data: log.data, topics: log.topics });
      if (event.eventName !== eventName) continue;
      if (
        expectedAgreementId !== undefined &&
        (event.args.agreementId === undefined || BigInt(event.args.agreementId) !== expectedAgreementId)
      ) continue;
      return event;
    } catch {
      // Ignore logs that do not match the expected event.
    }
  }
  return undefined;
}
