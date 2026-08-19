import { apiRequest, ApiError } from "../../../services/apiClient";

const base = "/slaughterhouse";
const get = (path) => apiRequest(`${base}${path}`);
const post = (path, body) => apiRequest(`${base}${path}`, { method: "POST", body: JSON.stringify(body) });
const unavailable = (feature) => Promise.reject(new ApiError(501, `${feature} is not available because no verified backend contract exists.`));
const camel = (value) => Array.isArray(value) ? value.map(camel) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).map(([key, item]) => [key.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), camel(item)]));
const items = (value) => (Array.isArray(value?.items || value) ? (value?.items || value).map(camel) : []);

export const lookupAnimalByTag = (tagId) => get("/reception").then(items).then((rows) => rows.find((row) => row.tagId === tagId) || null);
export const fetchReceptionQueue = () => get("/reception").then(items);
export const createAnimal = (p) => post("/reception", { tag_id: p.tagId, farmer: p.farmer || "", transporter: p.transporter, vehicle_number: p.vehicleNumber, arrival_date: p.arrivalDate, arrival_time: p.arrivalTime, breed: p.breed || "", weight: p.weight, batch: p.batch || "", status: p.status || "pending" }).then(camel);
export const acceptAnimal = () => unavailable("Reception decision");
export const rejectAnimal = () => unavailable("Reception decision");
export const deleteAnimal = () => unavailable("Reception deletion");

export const fetchInspectionQueue = () => get("/inspection").then(items);
export const createInspection = (p) => post("/inspection", { animal_id: p.tagId, vet: p.vet, batch: p.batch || "", health_check: p.healthCheck || "", body_condition: p.bodyCondition || "", signs_of_disease: p.signsOfDisease || "", temperature: p.temperature, notes: p.notes || "", outcome: "pending" }).then(camel);
export const recordInspection = () => unavailable("Inspection decision");
export const deleteInspection = () => unavailable("Inspection deletion");
export const checkAnimalApproved = (tagId) => fetchInspectionQueue().then((rows) => { const inspection = rows.find((row) => row.animalId === tagId) || null; return { approved: inspection?.outcome === "approved", inspection }; });

export const fetchSlaughterQueue = () => get("/slaughter").then(items);
export const createSlaughterRecord = (p) => post("/slaughter", { animal_id: p.tagId }).then(camel);
export const advanceSlaughterStage = () => unavailable("Slaughter stage update");
export const lookupAnimalForSlaughter = async (tagId) => { const animal = await lookupAnimalByTag(tagId); const { approved, inspection } = await checkAnimalApproved(tagId); return { animal, inspection, canSlaughter: Boolean(animal && approved), reason: animal && approved ? null : "The animal must be received and approved by ante-mortem inspection." }; };
export const recordSlaughter = (p) => post("/slaughter", { animal_id: p.animalId, batch: p.batch || "", stage: "completed", staff: p.officer || "", method: p.otherMethod || p.method || "", facility: p.facility || "", remarks: p.remarks || "", started_at: `${p.slaughterDate}T${p.slaughterTime || "00:00"}:00Z`, completed_at: `${p.slaughterDate}T${p.slaughterTime || "00:00"}:00Z` }).then(camel);
export const recordManualSlaughter = () => unavailable("Manual slaughter");

export const fetchCarcasses = () => get("/carcasses").then(items);
export const createCarcass = (p) => post("/carcasses", { id: p.id, animal_id: p.tagId, weight: p.weight, grade: p.grade, quality: p.quality || "", inspection_result: p.inspectionResult || "", storage: p.storage || "" }).then(camel);
export const deleteCarcass = () => unavailable("Carcass deletion");
export const fetchCarcassInspections = () => get("/carcass-inspections").then(items);
export const createCarcassInspection = (p) => post("/carcass-inspections", { carcass_id: p.carcassId, tag_id: p.tagId, inspector: p.inspector, outcome: p.outcome, reason: p.reason || "", comments: p.comments || "" }).then(camel);
export const recordCarcassInspection = () => unavailable("Carcass inspection update");
export const deleteCarcassInspection = () => unavailable("Carcass inspection deletion");
export const fetchShipments = () => get("/shipments").then(items);
export const createShipment = (p) => post("/shipments", { id: p.id, carcass_id: p.carcassId, destination: p.destination, processor: p.processor || "", driver: p.driver || "", vehicle: p.vehicle || "", departure: p.departure || "", status: p.status || "pending" }).then(camel);
export const advanceShipment = () => unavailable("Shipment status update");
export const deleteShipment = () => unavailable("Shipment deletion");
export const traceRecord = (query) => get(`/traceability?tag=${encodeURIComponent(query)}`).then(camel);
export const fetchNotifications = () => get("/notifications").then(items);
export const markNotificationRead = () => unavailable("Notification update");
export const updateProfile = (p) => {
  const unsupported = Object.keys(p).filter((key) => !["fullName", "fullname", "email", "phone"].includes(key));
  if (unsupported.length) return unavailable("Facility setup");
  return apiRequest(`${base}/profile`, { method: "PATCH", body: JSON.stringify({ full_name: p.fullName || p.fullname, email: p.email, phone: p.phone }) }).then(camel);
};
export async function fetchDashboardSummary() { const [receptions, inspections, operations, shipments] = await Promise.all([fetchReceptionQueue(), fetchInspectionQueue(), fetchSlaughterQueue(), fetchShipments()]); return { pendingReception: receptions.filter((r) => r.status === "pending").length, pendingInspections: inspections.filter((r) => !r.outcome || r.outcome === "pending").length, processedToday: operations.filter((r) => String(r.completedAt || r.startedAt || "").slice(0, 10) === new Date().toISOString().slice(0, 10)).length, shipmentsReady: shipments.filter((r) => r.status === "ready").length, statusBreakdown: { inReception: receptions.filter((r) => r.status === "pending").length, inProcess: operations.filter((r) => r.stage !== "completed").length, completed: operations.filter((r) => r.stage === "completed").length, rejected: inspections.filter((r) => r.outcome === "rejected").length } }; }
export async function fetchThroughputStats() { const operations = await fetchSlaughterQueue(); const daily = Array.from({ length: 7 }, (_, i) => { const date = new Date(); date.setUTCDate(date.getUTCDate() - (6 - i)); const key = date.toISOString().slice(0, 10); return { date: key, processed: operations.filter((r) => String(r.completedAt || r.startedAt || "").slice(0, 10) === key).length, rejected: 0 }; }); return { daily, weekly: daily }; }
export const fetchUserActivityStats = () => unavailable("Activity statistics");
export const fetchReportTypes = () => unavailable("Reports"); export const fetchReportData = () => unavailable("Reports"); export const generateReport = () => unavailable("Reports"); export const getDocuments = () => unavailable("Document management"); export const uploadDocument = () => unavailable("Document management"); export const deleteDocument = () => unavailable("Document management"); export const fetchAvailableTransporters = () => unavailable("Transporter selection");
