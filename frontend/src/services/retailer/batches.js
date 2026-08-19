import { apiRequest } from "../apiClient";

export async function fetchRetailerBatches(retailerId) {
  const batches = await apiRequest("/retailer-batches");
  return (Array.isArray(batches) ? batches : [])
    .filter((batch) => !retailerId || batch.retailer_id === retailerId)
    .map((batch) => ({
      id: batch.unique_no || batch.id,
      recordId: batch.id,
      packs: batch.amount_of_packs ?? 0,
      from: batch.distributor_no || "Distributor",
      status: batch.verification_status || "pending",
      receivedDate: batch.received_date,
    }));
}

export function createRetailerBatch({ retailerId, id, packs, from }) {
  return apiRequest("/retailer-batches", {
    method: "POST",
    body: JSON.stringify({ retailer_id: retailerId, unique_no: id, amount_of_packs: packs, distributor_no: from, verification_status: "pending", received_date: new Date().toISOString() }),
  });
}
