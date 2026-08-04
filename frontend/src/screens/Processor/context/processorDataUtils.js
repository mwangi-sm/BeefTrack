// Shared helpers + initial state shape for the Processor module.
// Mirrors distributorDataUtils.js conventions: pure functions, no React
// imports here, everything derivable from state lives in this file.

let idCounter = 0

/**
 * Generates a simple sequential ID with a prefix, e.g. genId('CC') -> 'CC-000001'
 * Replace with server-issued IDs once the backend is wired up.
 */
export function genId(prefix) {
  idCounter += 1
  return `${prefix}-${String(idCounter).padStart(6, '0')}`
}

/**
 * The dashboard starts genuinely empty — no seed/mock data — matching the
 * cleanup pass already done on the Distributor module. Every screen reads
 * from this shape via context.
 */
export function getInitialProcessorState() {
  return {
    // Incoming Processing Queue — carcasses awaiting inspection/cutting
    carcasses: [],
    // carcass shape: { id, animalId, grade, arrivalTime, status: 'ready' | 'inspection' | 'packaging', sourceSlaughterHouseId }

    // Active Production Batches
    batches: [],
    // batch shape: { id, product, category, weightKg, packages, stage: 'packaging' | 'needs-qr' | 'ready', createdAt }

    // Packaging Queue
    packagingQueue: [],
    // item shape: { batchId, packagingType, operator, startedAt, progressPercent: number | 'complete' }

    // QR Generation summary
    qr: {
      readyCount: 0,
      generatedCount: 0,
      printLabelsCount: 0,
      pendingCount: 0,
    },

    // Inventory Overview
    inventory: {
      finishedProductsPacks: 0,
      rawMaterialsKg: 0,
      packagingMaterialsUnits: 0,
      coldStoragePercent: 0,
    },

    // Quality Control
    qualityControl: {
      inspectionsToday: 0,
      passed: 0,
      pending: 0,
      rejected: 0,
      temperatureC: null,
      foodSafetyStatus: null, // 'compliant' | 'flagged' | null
    },

    // Cold Storage rooms
    coldStorageRooms: [],
    // room shape: { id: 'A' | 'B' | 'C' ..., percentFull }

    notifications: [],
    // notification shape: { id, message, type: 'warning' | 'success' | 'info', createdAt }

    activityLog: [],
    // activity shape: { id, text, timestamp }

    // Profile fields — populated from the user's submitted profile, same
    // pattern as the Distributor module (no hardcoded company name/actor ID).
    profile: {
      companyName: '',
      actorId: '',
    },
  }
}

/**
 * Derives the 8 dashboard stat cards from raw state, so components never
 * compute these inline and every screen stays in sync.
 */
export function computeProcessorStats(state) {
  const carcassesInProcessing = state.carcasses.filter(
    (c) => c.status === 'ready' || c.status === 'inspection'
  ).length

  const batchesCreatedToday = state.batches.length

  const productsPackaged = state.batches.reduce(
    (sum, b) => sum + (b.packages || 0),
    0
  )

  const pendingQR = state.qr.pendingCount

  const todaysProductionKg = state.batches.reduce(
    (sum, b) => sum + (b.weightKg || 0),
    0
  )

  const coldStoragePercent = state.inventory.coldStoragePercent

  const readyForDistribution = state.batches.filter(
    (b) => b.stage === 'ready'
  ).length

  const totalInspections = state.qualityControl.inspectionsToday
  const qualityChecksPercent =
    totalInspections > 0
      ? Math.round((state.qualityControl.passed / totalInspections) * 100)
      : 0

  return {
    carcassesInProcessing,
    batchesCreatedToday,
    productsPackaged,
    pendingQR,
    todaysProductionKg,
    coldStoragePercent,
    readyForDistribution,
    qualityChecksPercent,
  }
}

/**
 * Formats a Date (or now) into the "1:40 PM" style used across activity
 * items and notifications.
 */
export function formatTimestamp(date = new Date()) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}