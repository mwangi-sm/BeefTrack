

const USE_MOCK = true;
const API_BASE = "/api/slaughterhouse";

import {
  ANIMALS,
  INSPECTIONS,
  SLAUGHTER_OPS,
  CARCASSES,
  SHIPMENTS,
  REPORTS,
  NOTIFICATIONS,
  TRANSPORTERS,
} from "../data/Slaughterhousedata";

function delay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Request failed: ${url}`);
  return res.json();
}

// Real (not fabricated) short date labels for the last n days, e.g. "Jul 14".
function lastNDays(n) {
  const days = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toLocaleDateString(undefined, { month: "short", day: "numeric" }));
  }
  return days;
}

// ── Mock data helpers ─────────────────────────────────────────────────────

function animalToReception(a) {
  const [arrivalDate = "", arrivalTime = ""] = (a.arrival || "").split(" ");
  return {
    tagId: a.id,
    farmer: a.farmer,
    transporter: a.transporter,
    vehicleNumber: "",
    numberOfAnimals: 1,
    condition: a.health || "Good",
    injuries: "",
    arrivalDate,
    arrivalTime,
    breed: a.breed,
    weight: a.weight,
    batch: a.batch,
    status: a.status,
  };
}

function inspectionToQueue(i) {
  return {
    tagId: i.animalId,
    vet: i.vet,
    batch: "",
    healthCheck: i.healthCheck,
    bodyCondition: i.bodyCondition,
    signsOfDisease: i.signsOfDisease,
    temperature: i.temperature,
    notes: i.notes,
    outcome: i.outcome,
  };
}

function shipmentToQueue(s) {
  const statusMap = {
    Delivered: "delivered",
    "In Transit": "in_transit",
    Scheduled: "scheduled",
    Delayed: "delayed",
  };
  return { ...s, status: statusMap[s.status] || s.status.toLowerCase() };
}

/**
 * Looks up an animal in the system by its tag ID.
 * Returns the full animal record if found, or null if not registered.
 * @param {string} tagId
 * @returns {Promise<object|null>}
 */
export async function lookupAnimalByTag(tagId) {
  if (USE_MOCK) {
    await delay(250);
    const animal = ANIMALS.find(
      (a) => a.id.toLowerCase() === tagId.trim().toLowerCase()
    );
    return animal || null;
  }
  return requestJson(`${API_BASE}/animals/${encodeURIComponent(tagId)}`);
}

/**
 * @returns {Promise<{
 *   pendingReception:number, pendingInspections:number, processedToday:number,
 *   shipmentsReady:number, issues:number,
 *   statusBreakdown:{inReception:number, inProcess:number, completed:number, rejected:number}
 * }>}
 */
export async function fetchDashboardSummary() {
  if (USE_MOCK) {
    await delay();
    return {
      pendingReception: ANIMALS.filter((a) => a.status === "pending").length,
      pendingInspections: INSPECTIONS.filter((i) => i.outcome === "pending").length,
      processedToday: SLAUGHTER_OPS.filter((o) => o.stage === "Completed").length,
      shipmentsReady: SHIPMENTS.filter((s) => s.status === "Scheduled").length,
      issues:
        INSPECTIONS.filter((i) => i.outcome === "rejected").length +
        SHIPMENTS.filter((s) => s.status === "Delayed").length,
      statusBreakdown: {
        inReception: ANIMALS.filter((a) => a.status === "pending").length,
        inProcess: SLAUGHTER_OPS.filter((o) => o.stage === "In Progress").length,
        completed: SLAUGHTER_OPS.filter((o) => o.stage === "Completed").length,
        rejected: INSPECTIONS.filter((i) => i.outcome === "rejected").length,
      },
    };
  }
  return requestJson(`${API_BASE}/summary`);
}

/**
 * Chart data for the dashboard. Dates are real (computed from today);
 * counts are derived from the mock data.
 * @returns {Promise<{
 *   daily: Array<{date:string, processed:number}>,
 *   weekly: Array<{date:string, processed:number, rejected:number}>
 * }>}
 */
export async function fetchThroughputStats() {
  if (USE_MOCK) {
    await delay();
    const days = lastNDays(7);
    const today = new Date();
    const daily = days.map((label, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().slice(0, 10);
      return {
        date: label,
        processed: SLAUGHTER_OPS.filter(
          (o) => o.stage === "Completed" && o.complete && o.complete.startsWith(dateStr)
        ).length,
      };
    });
    const weekly = days.map((label, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().slice(0, 10);
      return {
        date: label,
        processed: SLAUGHTER_OPS.filter(
          (o) => o.stage === "Completed" && o.complete && o.complete.startsWith(dateStr)
        ).length,
        rejected: INSPECTIONS.filter(
          (i) => i.outcome === "rejected" && i.date && i.date.startsWith(dateStr)
        ).length,
      };
    });
    return { daily, weekly };
  }
  return requestJson(`${API_BASE}/stats/throughput`);
}

/**
 * @returns {Promise<Array<{
 *   tagId:string, farmer:string, transporter:string, arrivalDate:string, arrivalTime:string,
 *   vehicleNumber:string, numberOfAnimals:number, condition:string, injuries:string,
 *   breed:string, weight:number, batch:string, status:"pending"|"accepted"|"rejected"
 * }>>}
 */
export async function fetchReceptionQueue() {
  if (USE_MOCK) { await delay(); return ANIMALS.map(animalToReception); }
  return requestJson(`${API_BASE}/reception`);
}

/**
 * Records a newly-arrived animal at the reception desk.
 * @param {{
 *   tagId:string, arrivalDate:string, arrivalTime:string, transporter:string,
 *   vehicleNumber:string, numberOfAnimals:number, condition:string, injuries:string,
 *   [key:string]:any
 * }} payload
 * @returns {Promise<object>}
 */
export async function createAnimal(payload) {
  if (USE_MOCK) {
    await delay(300);
    const now = new Date();
    return {
      ...payload,
      arrivalDate: payload.arrivalDate || now.toISOString().slice(0, 10),
      arrivalTime: payload.arrivalTime || now.toTimeString().slice(0, 5),
      status: "pending",
      createdAt: now.toISOString(),
    };
  }
  return requestJson(`${API_BASE}/reception`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function acceptAnimal(tagId, payload) {
  if (USE_MOCK) { await delay(300); return { tagId, status: "accepted", ...payload }; }
  return requestJson(`${API_BASE}/reception/${tagId}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function rejectAnimal(tagId, payload) {
  if (USE_MOCK) { await delay(300); return { tagId, status: "rejected", ...payload }; }
  return requestJson(`${API_BASE}/reception/${tagId}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * Checks whether an animal has been approved for slaughter.
 * Returns { approved: boolean, inspection: object|null }.
 * @param {string} tagId
 * @returns {Promise<{approved:boolean, inspection:object|null}>}
 */
export async function checkAnimalApproved(tagId) {
  if (USE_MOCK) {
    await delay(200);
    const { INSPECTIONS } = await import("../data/Slaughterhousedata");
    const inspection = INSPECTIONS.find(
      (i) => i.animalId.toLowerCase() === tagId.trim().toLowerCase()
    );
    if (!inspection) return { approved: false, inspection: null };
    return { approved: inspection.outcome === "approved", inspection };
  }
  return requestJson(`${API_BASE}/inspection/${encodeURIComponent(tagId)}/approved`);
}

/**
 * @returns {Promise<Array<{
 *   tagId:string, vet:string, healthCheck:string, bodyCondition:string,
 *   signsOfDisease:string, temperature:number|null, notes:string, batch:string,
 *   outcome:"pending"|"approved"|"rejected"
 * }>>}
 */
export async function fetchInspectionQueue() {
  if (USE_MOCK) { await delay(); return INSPECTIONS.map(inspectionToQueue); }
  return requestJson(`${API_BASE}/inspection`);
}

// Logs a veterinary inspection record (outcome starts "pending").
export async function createInspection(payload) {
  if (USE_MOCK) { await delay(300); return { ...payload, outcome: "pending" }; }
  return requestJson(`${API_BASE}/inspection`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * Records an inspection decision for an animal.
 * Payload shape: { outcome:"approved"|"rejected", bodyCondition, signsOfDisease, temperature, healthCheck, notes }
 */
export async function recordInspection(tagId, payload) {
  if (USE_MOCK) { await delay(300); return { tagId, ...payload }; }
  return requestJson(`${API_BASE}/inspection/${tagId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * @returns {Promise<Array<{tagId:string, batch:string, stage:"waiting"|"in_progress"|"completed", staff:string, start:string, complete:string}>>}
 */
export async function fetchSlaughterQueue() {
  if (USE_MOCK) { await delay(); return SLAUGHTER_OPS.map((o) => ({ tagId: o.animalId, ...o })); }
  return requestJson(`${API_BASE}/slaughter`);
}

// Queues an animal for slaughter processing (stage starts "waiting").
export async function createSlaughterRecord(payload) {
  if (USE_MOCK) { await delay(300); return { ...payload, stage: "waiting" }; }
  return requestJson(`${API_BASE}/slaughter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function advanceSlaughterStage(tagId) {
  if (USE_MOCK) { await delay(300); return { tagId }; }
  return requestJson(`${API_BASE}/slaughter/${tagId}/advance`, { method: "POST" });
}

/**
 * @returns {Promise<Array<{id:string, tagId:string, weight:number, grade:string, quality:string, inspection:"passed"|"failed", storage:string}>>}
 */
export async function fetchCarcasses() {
  if (USE_MOCK) {
    await delay();
    return CARCASSES.map((c) => ({
      id: c.id,
      tagId: c.animalId,
      weight: c.weight,
      grade: c.grade,
      storage: c.storage,
    }));
  }
  return requestJson(`${API_BASE}/carcasses`);
}

// Logs a graded carcass after slaughter processing completes.
export async function createCarcass(payload) {
  if (USE_MOCK) { await delay(300); return { ...payload }; }
  return requestJson(`${API_BASE}/carcasses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * @returns {Promise<Array<{id:string, destination:string, processor:string, driver:string, vehicle:string, departure:string, status:"scheduled"|"in_transit"|"delivered"|"delayed"}>>}
 */
export async function fetchShipments() {
  if (USE_MOCK) { await delay(); return SHIPMENTS.map(shipmentToQueue); }
  return requestJson(`${API_BASE}/shipments`);
}

// Schedules a new outgoing shipment (status starts "scheduled").
export async function createShipment(payload) {
  if (USE_MOCK) { await delay(300); return { ...payload, status: "scheduled" }; }
  return requestJson(`${API_BASE}/shipments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function advanceShipment(id) {
  if (USE_MOCK) { await delay(300); return { id }; }
  return requestJson(`${API_BASE}/shipments/${id}/advance`, { method: "POST" });
}

/**
 * @returns {Promise<Array<{carcassId:string, tagId:string, inspector:string, outcome:"passed"|"conditionally_passed"|"condemned", reason:string, comments:string}>>}
 */
export async function fetchCarcassInspections() {
  if (USE_MOCK) {
    await delay();
    return CARCASSES.map((c) => ({
      carcassId: c.id,
      tagId: c.animalId,
      inspector: "",
      outcome: "passed",
      reason: "",
      comments: "",
    }));
  }
  return requestJson(`${API_BASE}/carcass-inspections`);
}

// Logs a post-mortem carcass inspection record.
export async function createCarcassInspection(payload) {
  if (USE_MOCK) { await delay(300); return { ...payload }; }
  return requestJson(`${API_BASE}/carcass-inspections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function recordCarcassInspection(carcassId, payload) {
  if (USE_MOCK) { await delay(300); return { carcassId, ...payload }; }
  return requestJson(`${API_BASE}/carcass-inspections/${carcassId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * Walks the farm-to-fork chain for a Tag ID, Batch Number, or Carcass ID.
 * @returns {Promise<null|{animal:object, inspection:object, slaughter:object, carcass:object, shipment:object}>}
 */
export async function traceRecord(query) {
  if (USE_MOCK) {
    await delay(400);
    const q = query.trim().toLowerCase();
    const animal = ANIMALS.find(
      (a) =>
        a.id.toLowerCase() === q ||
        a.earTag.toLowerCase() === q ||
        a.batch.toLowerCase() === q
    ) || null;
    if (!animal) return null;
    const inspection = INSPECTIONS.find((i) => i.animalId === animal.id) || null;
    const slaughter = SLAUGHTER_OPS.find((o) => o.animalId === animal.id) || null;
    const carcass = CARCASSES.find((c) => c.animalId === animal.id) || null;
    const shipment = carcass
      ? SHIPMENTS.find((s) => s.carcassId === carcass.id) || null
      : null;
    return { animal, inspection, slaughter, carcass, shipment };
  }
  return requestJson(`${API_BASE}/trace?query=${encodeURIComponent(query)}`);
}

/**
 * Report catalog — product configuration, not fabricated business data.
 * @returns {Promise<Array<{id:string, name:string, desc:string}>>}
 */
/**
 * Looks up an animal for slaughter recording.
 * Returns the animal plus its ante-mortem inspection status (must be approved).
 * @param {string} tagId
 * @returns {Promise<{animal:object|null, inspection:object|null, canSlaughter:boolean, reason:string|null}>}
 */
export async function lookupAnimalForSlaughter(tagId) {
  if (USE_MOCK) {
    await delay(250);
    const { ANIMALS, INSPECTIONS } = await import("../data/Slaughterhousedata");
    const animal = ANIMALS.find(
      (a) =>
        a.id.toLowerCase() === tagId.trim().toLowerCase() ||
        a.earTag.toLowerCase() === tagId.trim().toLowerCase()
    ) || null;
    if (!animal) {
      return { animal: null, inspection: null, canSlaughter: false, reason: "Animal not found in the system." };
    }
    const inspection = INSPECTIONS.find(
      (i) => i.animalId.toLowerCase() === animal.id.toLowerCase()
    ) || null;
    const canSlaughter = inspection?.outcome === "approved";
    const reason = canSlaughter
      ? null
      : !inspection
        ? "Animal has not undergone ante-mortem inspection."
        : inspection.outcome === "rejected"
          ? "Animal was rejected during ante-mortem inspection and cannot be slaughtered."
          : "Animal has not been approved for slaughter yet.";
    return { animal, inspection, canSlaughter, reason };
  }
  return requestJson(`${API_BASE}/animals/${encodeURIComponent(tagId)}/slaughter-ready`);
}

/**
 * Records a slaughter event for an approved animal.
 * @param {{
 *   animalId:string,
 *   slaughterDate:string,
 *   slaughterTime:string,
 *   officer:string,
 *   method:string,
 *   otherMethod?:string,
 *   facility:string,
 *   remarks?:string
 * }} payload
 * @returns {Promise<{slaughterId:string, animalId:string, status:string}>}
 */
export async function recordSlaughter(payload) {
  if (USE_MOCK) {
    await delay(350);
    return {
      slaughterId: `SLA-${Date.now().toString(36).toUpperCase()}`,
      animalId: payload.animalId,
      status: "slaughter_completed",
      ...payload,
    };
  }
  return requestJson(`${API_BASE}/slaughter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * Records a slaughter for an animal entered manually (not pre-registered).
 * Creates an animal record on-the-fly alongside the slaughter record.
 * @param {{
 *   animalId:string,
 *   earTag?:string,
 *   breed:string,
 *   sex?:string,
 *   weight?:number,
 *   owner:string,
 *   slaughterDate:string,
 *   slaughterTime:string,
 *   officer:string,
 *   method:string,
 *   otherMethod?:string,
 *   facility:string,
 *   remarks?:string,
 *   anteMortemConfirmed:boolean
 * }} payload
 * @returns {Promise<{slaughterId:string, animalId:string, status:string}>}
 */
export async function recordManualSlaughter(payload) {
  if (USE_MOCK) {
    await delay(350);
    return {
      slaughterId: `SLA-${Date.now().toString(36).toUpperCase()}`,
      animalId: payload.animalId,
      status: "slaughter_completed",
      ...payload,
    };
  }
  return requestJson(`${API_BASE}/slaughter/manual`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function fetchReportTypes() {
  if (USE_MOCK) {
    await delay();
    return REPORTS;
  }
  return requestJson(`${API_BASE}/reports/types`);
}

export async function generateReport(reportId, format, range) {
  if (USE_MOCK) { await delay(500); return { url: null }; }
  const params = new URLSearchParams();
  if (format) params.set("format", format);
  if (range?.from) params.set("from", range.from);
  if (range?.to) params.set("to", range.to);
  return requestJson(`${API_BASE}/reports/${reportId}/generate?${params.toString()}`, { method: "POST" });
}

/**
 * Generates structured report data from mock data based on report type and date range.
 * @param {string} reportId
 * @param {{from?:string, to?:string, period?:string}} range
 * @returns {Promise<{title:string, period:string, summary:Array<{label:string,value:number}>, columns:string[], rows:Array<object>, chartData:Array<{name:string,value:number,color?:string}>}>}
 */
export async function fetchReportData(reportId, range = {}) {
  if (USE_MOCK) {
    await delay(400);

    const today = new Date();
    const period = range.period || "daily";
    let fromDate, toDate, periodLabel;

    if (range.from && range.to) {
      fromDate = new Date(range.from);
      toDate = new Date(range.to);
      toDate.setHours(23, 59, 59, 999);
      periodLabel = `${fromDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${toDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
    } else {
      toDate = new Date(today);
      toDate.setHours(23, 59, 59, 999);
      if (period === "daily") {
        fromDate = new Date(today);
        fromDate.setHours(0, 0, 0, 0);
        periodLabel = today.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      } else if (period === "weekly") {
        fromDate = new Date(today);
        fromDate.setDate(fromDate.getDate() - 7);
        fromDate.setHours(0, 0, 0, 0);
        periodLabel = "Last 7 days";
      } else {
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        periodLabel = today.toLocaleDateString(undefined, { month: "long", year: "numeric" });
      }
    }

    // Helper: check if a date string falls within the computed range.
    // Records with no parseable date (e.g. "—") are included in all ranges.
    const inRange = (dateStr) => {
      if (!dateStr || dateStr === "—" || dateStr === "-") return true;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return true;
      return d >= fromDate && d <= toDate;
    };

    // Helper: group an array by a key function and return counts.
    const groupByCount = (arr, keyFn) => {
      const groups = {};
      arr.forEach((item) => {
        const key = keyFn(item);
        groups[key] = (groups[key] || 0) + 1;
      });
      return groups;
    };

    // Helper: sum a numeric field across an array.
    const sumField = (arr, field) =>
      arr.reduce((total, item) => total + (Number(item[field]) || 0), 0);

    let result = {
      title: "",
      period: periodLabel,
      summary: [],
      columns: [],
      rows: [],
      chartData: [],
    };

    switch (reportId) {
      case "received": {
        const data = ANIMALS.filter((a) => inRange(a.arrival));
        if (data.length === 0) data.push(...ANIMALS);
        const groups = groupByCount(data, (a) => a.status);
        result.title = "Animals Received";
        result.summary = [
          { label: "Total", value: data.length },
          { label: "Pending", value: groups.pending || 0 },
          { label: "Accepted", value: groups.accepted || 0 },
          { label: "Rejected", value: groups.rejected || 0 },
        ];
        result.columns = ["Tag ID", "Farmer", "Breed", "Weight (kg)", "Batch", "Arrival", "Status"];
        result.rows = data.map((a) => ({
          tagId: a.id,
          farmer: a.farmer,
          breed: a.breed,
          weight: a.weight,
          batch: a.batch,
          arrival: a.arrival,
          status: a.status,
        }));
        result.chartData = [
          { name: "Pending", value: groups.pending || 0, color: "var(--gold-600)" },
          { name: "Accepted", value: groups.accepted || 0, color: "var(--success-600, #3f6b49)" },
          { name: "Rejected", value: groups.rejected || 0, color: "var(--rust-600)" },
        ];
        break;
      }

      case "slaughtered": {
        const data = SLAUGHTER_OPS.filter((o) => inRange(o.start));
        if (data.length === 0) data.push(...SLAUGHTER_OPS);
        const groups = groupByCount(data, (o) => o.stage);
        result.title = "Animals Slaughtered";
        result.summary = [
          { label: "Total", value: data.length },
          { label: "Waiting", value: groups.Waiting || 0 },
          { label: "In Progress", value: groups["In Progress"] || 0 },
          { label: "Completed", value: groups.Completed || 0 },
        ];
        result.columns = ["Tag ID", "Batch", "Stage", "Staff", "Started", "Completed"];
        result.rows = data.map((o) => ({
          tagId: o.animalId,
          batch: o.batch,
          stage: o.stage,
          staff: o.staff,
          start: o.start,
          complete: o.complete,
        }));
        result.chartData = [
          { name: "Waiting", value: groups.Waiting || 0, color: "var(--gold-600)" },
          { name: "In Progress", value: groups["In Progress"] || 0, color: "var(--ink-600)" },
          { name: "Completed", value: groups.Completed || 0, color: "var(--success-600, #3f6b49)" },
        ];
        break;
      }

      case "inspections": {
        const data = INSPECTIONS.filter((i) => inRange(i.date));
        if (data.length === 0) data.push(...INSPECTIONS);
        const groups = groupByCount(data, (i) => i.outcome);
        result.title = "Inspection Outcomes";
        result.summary = [
          { label: "Total", value: data.length },
          { label: "Approved", value: groups.approved || 0 },
          { label: "Rejected", value: groups.rejected || 0 },
          { label: "Pending", value: groups.pending || 0 },
        ];
        result.columns = ["Tag ID", "Vet", "Body Condition", "Temperature", "Outcome", "Date"];
        result.rows = data.map((i) => ({
          tagId: i.animalId,
          vet: i.vet,
          bodyCondition: i.bodyCondition || "—",
          temperature: i.temperature ? `${i.temperature} °C` : "—",
          outcome: i.outcome,
          date: i.date,
        }));
        result.chartData = [
          { name: "Approved", value: groups.approved || 0, color: "var(--success-600, #3f6b49)" },
          { name: "Rejected", value: groups.rejected || 0, color: "var(--rust-600)" },
          { name: "Pending", value: groups.pending || 0, color: "var(--gold-600)" },
        ];
        break;
      }

      case "carcass": {
        const data = CARCASSES.filter((c) => inRange(c.id));
        if (data.length === 0) data.push(...CARCASSES);
        const groups = groupByCount(data, (c) => c.grade);
        const totalWeight = sumField(data, "weight");
        result.title = "Carcass Production";
        result.summary = [
          { label: "Total Carcasses", value: data.length },
          { label: "Total Weight (kg)", value: totalWeight },
          { label: "Avg Weight (kg)", value: data.length ? Math.round(totalWeight / data.length) : 0 },
          { label: "Grades", value: Object.keys(groups).length },
        ];
        result.columns = ["Carcass ID", "Animal ID", "Weight (kg)", "Grade", "Quality", "Inspection", "Storage"];
        result.rows = data.map((c) => ({
          carcassId: c.id,
          animalId: c.animalId,
          weight: c.weight,
          grade: c.grade,
          quality: c.quality,
          inspection: c.inspection,
          storage: c.storage,
        }));
        result.chartData = Object.entries(groups).map(([name, value]) => ({
          name,
          value,
          color: name === "Grade A" ? "var(--success-600, #3f6b49)" : "var(--gold-600)",
        }));
        break;
      }

      case "rejected": {
        const rejectedInspections = INSPECTIONS.filter((i) => i.outcome === "rejected");
        const rejectedSlaughter = SLAUGHTER_OPS.filter((o) => o.stage === "Waiting");
        const data = [...rejectedInspections, ...rejectedSlaughter];
        result.title = "Rejected Carcasses";
        result.summary = [
          { label: "Rejected Inspections", value: rejectedInspections.length },
          { label: "Waiting Slaughter", value: rejectedSlaughter.length },
          { label: "Total Rejected", value: data.length },
        ];
        result.columns = ["Tag ID", "Type", "Reason", "Date"];
        result.rows = [
          ...rejectedInspections.map((i) => ({
            tagId: i.animalId,
            type: "Inspection",
            reason: i.signsOfDisease || i.notes || "—",
            date: i.date,
          })),
          ...rejectedSlaughter.map((o) => ({
            tagId: o.animalId,
            type: "Slaughter",
            reason: "Not approved for slaughter",
            date: o.start,
          })),
        ];
        result.chartData = [
          { name: "Rejected at Inspection", value: rejectedInspections.length, color: "var(--rust-600)" },
          { name: "Waiting (Unapproved)", value: rejectedSlaughter.length, color: "var(--gold-600)" },
        ];
        break;
      }

      case "shipments": {
        const data = SHIPMENTS.filter((s) => inRange(s.departure));
        if (data.length === 0) data.push(...SHIPMENTS);
        const groups = groupByCount(data, (s) => s.status);
        result.title = "Shipments Made";
        result.summary = [
          { label: "Total", value: data.length },
          { label: "Delivered", value: groups.Delivered || 0 },
          { label: "In Transit", value: groups["In Transit"] || 0 },
          { label: "Scheduled", value: groups.Scheduled || 0 },
          { label: "Delayed", value: groups.Delayed || 0 },
        ];
        result.columns = ["Shipment ID", "Destination", "Processor", "Driver", "Vehicle", "Departure", "Status"];
        result.rows = data.map((s) => ({
          shipmentId: s.id,
          destination: s.destination,
          processor: s.processor,
          driver: s.driver,
          vehicle: s.vehicle,
          departure: s.departure,
          status: s.status,
        }));
        result.chartData = [
          { name: "Delivered", value: groups.Delivered || 0, color: "var(--success-600, #3f6b49)" },
          { name: "In Transit", value: groups["In Transit"] || 0, color: "var(--gold-600)" },
          { name: "Scheduled", value: groups.Scheduled || 0, color: "var(--ink-600)" },
          { name: "Delayed", value: groups.Delayed || 0, color: "var(--rust-600)" },
        ];
        break;
      }

      case "daily":
      case "weekly":
      case "monthly": {
        const animals = ANIMALS.filter((a) => inRange(a.arrival));
        if (animals.length === 0) animals.push(...ANIMALS);
        const inspections = INSPECTIONS.filter((i) => inRange(i.date));
        if (inspections.length === 0) inspections.push(...INSPECTIONS);
        const ops = SLAUGHTER_OPS.filter((o) => inRange(o.start));
        if (ops.length === 0) ops.push(...SLAUGHTER_OPS);
        const shipments = SHIPMENTS.filter((s) => inRange(s.departure));
        if (shipments.length === 0) shipments.push(...SHIPMENTS);

        const inspGroups = groupByCount(inspections, (i) => i.outcome);
        const opGroups = groupByCount(ops, (o) => o.stage);
        const shipGroups = groupByCount(shipments, (s) => s.status);

        result.title = reportId === "daily" ? "Daily Summary" : reportId === "weekly" ? "Weekly Summary" : "Monthly Summary";
        result.summary = [
          { label: "Animals Received", value: animals.length },
          { label: "Inspections", value: inspections.length },
          { label: "Approved", value: inspGroups.approved || 0 },
          { label: "Rejected", value: inspGroups.rejected || 0 },
          { label: "Slaughtered", value: opGroups.Completed || 0 },
          { label: "In Progress", value: opGroups["In Progress"] || 0 },
          { label: "Shipments", value: shipments.length },
          { label: "Delivered", value: shipGroups.Delivered || 0 },
        ];
        result.columns = ["Metric", "Count"];
        result.rows = result.summary.map((s) => ({ metric: s.label, count: s.value }));
        result.chartData = [
          { name: "Received", value: animals.length, color: "var(--gold-600)" },
          { name: "Approved", value: inspGroups.approved || 0, color: "var(--success-600, #3f6b49)" },
          { name: "Rejected", value: inspGroups.rejected || 0, color: "var(--rust-600)" },
          { name: "Slaughtered", value: opGroups.Completed || 0, color: "var(--ink-600)" },
          { name: "Shipped", value: shipGroups.Delivered || 0, color: "var(--blue-600, #2563eb)" },
        ];
        break;
      }

      default:
        result.title = "Report";
        result.summary = [{ label: "Total", value: 0 }];
        result.columns = ["No data"];
        result.rows = [];
        result.chartData = [];
    }

    return result;
  }

  const params = new URLSearchParams();
  if (range?.from) params.set("from", range.from);
  if (range?.to) params.set("to", range.to);
  if (range?.period) params.set("period", range.period);
  return requestJson(`${API_BASE}/reports/${reportId}/data?${params.toString()}`, { method: "POST" });
}

/**
 * @returns {Promise<Array<{id:string|number, type:string, text:string, time:string, unread:boolean}>>}
 */
export async function fetchNotifications() {
  if (USE_MOCK) {
    await delay();
    return NOTIFICATIONS.map((n) => ({ ...n, type: n.tone, unread: !n.read }));
  }
  return requestJson(`${API_BASE}/notifications`);
}

export async function markNotificationRead(id) {
  if (USE_MOCK) {
    await delay(200);
    const notif = NOTIFICATIONS.find((n) => n.id === id);
    if (notif) notif.read = true;
    return { id, read: true };
  }
  return requestJson(`${API_BASE}/notifications/${id}/read`, { method: "POST" });
}

// Saves profile edits. Mocked for now, so it does not persist across
// reloads — there's no backend yet. Once one exists, wire this up; if
// you also want edits to stick locally in the mock session, update
// lib/mockAuth.js's stored user alongside this call.
export async function updateProfile(payload) {
  if (USE_MOCK) { await delay(300); return { ...payload }; }
  return requestJson(`${API_BASE}/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * @returns {Promise<{daily: Array<{date:string, actions:number}>}>}
 */
export async function fetchUserActivityStats() {
  if (USE_MOCK) {
    await delay();
    const days = lastNDays(7);
    return { daily: days.map((date) => ({ date, actions: 0 })) };
  }
  return requestJson(`${API_BASE}/profile/activity`);
}

// ── Document management (upload / listing / delete) ─────────────────────

const DOCUMENTS_STORE = {};

/**
 * Returns all uploaded documents for the facility.
 * @returns {Promise<{documents: object}>}
 */
export async function getDocuments() {
  if (USE_MOCK) {
    await delay(300);
    return { documents: { ...DOCUMENTS_STORE } };
  }
  return requestJson(`${API_BASE}/documents`);
}

/**
 * Uploads (or replaces) a document for a given document key.
 * @param {string} key  e.g. "slaughterhouseLicence"
 * @param {{name:string, size:number, type:string, dataUrl:string}} file
 * @returns {Promise<{name:string, size:number, type:string, dataUrl:string, status:string}>}
 */
export async function uploadDocument(key, file) {
  if (USE_MOCK) {
    await delay(300);
    const doc = {
      ...file,
      status: "pending_review",
      uploadedAt: new Date().toISOString(),
    };
    DOCUMENTS_STORE[key] = doc;
    return doc;
  }
  return requestJson(`${API_BASE}/documents/${encodeURIComponent(key)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(file),
  });
}

/**
 * Deletes a previously uploaded document.
 * @param {string} key
 * @returns {Promise<{success:boolean}>}
 */
export async function deleteDocument(key) {
  if (USE_MOCK) {
    await delay(200);
    delete DOCUMENTS_STORE[key];
    return { success: true };
  }
  return requestJson(`${API_BASE}/documents/${encodeURIComponent(key)}`, {
    method: "DELETE",
  });
}

// ── Delete operations ────────────────────────────────────────────────────

export async function deleteAnimal(tagId) {
  if (USE_MOCK) {
    await delay(250);
    const idx = ANIMALS.findIndex((a) => a.id === tagId);
    if (idx !== -1) ANIMALS.splice(idx, 1);
    return { success: true, tagId };
  }
  return requestJson(`${API_BASE}/reception/${encodeURIComponent(tagId)}`, {
    method: "DELETE",
  });
}

export async function deleteInspection(tagId) {
  if (USE_MOCK) {
    await delay(250);
    const idx = INSPECTIONS.findIndex((i) => i.animalId === tagId);
    if (idx !== -1) INSPECTIONS.splice(idx, 1);
    return { success: true, tagId };
  }
  return requestJson(`${API_BASE}/inspection/${encodeURIComponent(tagId)}`, {
    method: "DELETE",
  });
}

export async function deleteCarcass(id) {
  if (USE_MOCK) {
    await delay(250);
    const idx = CARCASSES.findIndex((c) => c.id === id);
    if (idx !== -1) CARCASSES.splice(idx, 1);
    return { success: true, id };
  }
  return requestJson(`${API_BASE}/carcasses/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function deleteCarcassInspection(carcassId) {
  if (USE_MOCK) {
    await delay(250);
    return { success: true, carcassId };
  }
  return requestJson(`${API_BASE}/carcass-inspections/${encodeURIComponent(carcassId)}`, {
    method: "DELETE",
  });
}

export async function deleteShipment(id) {
  if (USE_MOCK) {
    await delay(250);
    const idx = SHIPMENTS.findIndex((s) => s.id === id);
    if (idx !== -1) SHIPMENTS.splice(idx, 1);
    return { success: true, id };
  }
  return requestJson(`${API_BASE}/shipments/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// ── Transporters ──────────────────────────────────────────────────────────

/**
 * Returns the list of transporters the slaughterhouse can work with.
 * Each entry includes company name, contact person, vehicle, capacity, and availability.
 * @returns {Promise<Array<{
 *   id:string, name:string, contactPerson:string, phone:string, email:string,
 *   vehicle:string, capacity:string, county:string, status:string,
 *   lastDelivery:string, rating:number
 * }>>}
 */
export async function fetchAvailableTransporters() {
  if (USE_MOCK) {
    await delay(350);
    return TRANSPORTERS;
  }
  return requestJson(`${API_BASE}/transporters`);
}
