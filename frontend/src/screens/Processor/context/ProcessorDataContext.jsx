import { useState, useCallback, useMemo } from 'react'
import { ProcessorDataContextInstance } from './ProcessorDataContextInstance'
import {
  getInitialProcessorState,
  computeProcessorStats,
  genId,
  formatTimestamp,
  formatDateLabel,
} from './processorDataUtils'

/**
 * Wraps all Processor routes, same as DistributorDataContext wraps all
 * Distributor routes in App.jsx. Holds in-memory state and exposes action
 * functions; every action that would eventually be a network call is
 * flagged with a comment marking the replacement point.
 */
export function ProcessorDataProvider({ children }) {
  const [state, setState] = useState(getInitialProcessorState)

  const logActivity = useCallback((text) => {
    setState((prev) => ({
      ...prev,
      activityLog: [
        { id: genId('ACT'), text, timestamp: formatTimestamp() },
        ...prev.activityLog,
      ],
    }))
  }, [])

  const addNotification = useCallback((message, type = 'info') => {
    setState((prev) => ({
      ...prev,
      notifications: [
        { id: genId('NOTIF'), message, type, createdAt: formatTimestamp() },
        ...prev.notifications,
      ],
    }))
  }, [])

  // ---- Carcasses / Incoming Processing Queue ----

  const receiveCarcass = useCallback(
    ({ animalId, grade, sourceSlaughterHouseId }) => {
      // TODO: replace with POST /api/processor/carcasses
      const carcass = {
        id: genId('CC'),
        animalId,
        grade,
        arrivalTime: formatTimestamp(),
        status: 'ready',
        sourceSlaughterHouseId,
      }
      setState((prev) => ({
        ...prev,
        carcasses: [carcass, ...prev.carcasses],
      }))
      logActivity(`Carcass ${carcass.id} received from ${sourceSlaughterHouseId}`)
      return carcass.id
    },
    [logActivity]
  )

  const updateCarcassStatus = useCallback(
    (carcassId, status) => {
      // TODO: replace with PATCH /api/processor/carcasses/:id
      setState((prev) => ({
        ...prev,
        carcasses: prev.carcasses.map((c) =>
          c.id === carcassId ? { ...c, status } : c
        ),
      }))
      logActivity(`Carcass ${carcassId} moved to ${status}`)
    },
    [logActivity]
  )

  // ---- Batches ----

  const createBatch = useCallback(
    ({ product, category, weightKg, packages }) => {
      // TODO: replace with POST /api/processor/batches
      const batch = {
        id: genId('LOT'),
        product,
        category,
        weightKg,
        packages,
        stage: 'packaging',
        createdAt: formatTimestamp(),
        createdDate: formatDateLabel(),
      }
      setState((prev) => ({
        ...prev,
        batches: [batch, ...prev.batches],
      }))
      logActivity(`Batch ${batch.id} created`)
      return batch.id
    },
    [logActivity]
  )

  const updateBatchStage = useCallback(
    (batchId, stage) => {
      // TODO: replace with PATCH /api/processor/batches/:id
      setState((prev) => ({
        ...prev,
        batches: prev.batches.map((b) =>
          b.id === batchId ? { ...b, stage } : b
        ),
      }))
      logActivity(`Batch ${batchId} updated to ${stage}`)
    },
    [logActivity]
  )

  // ---- Packaging Queue ----

  const addToPackagingQueue = useCallback(
    ({ batchId, packagingType, operator }) => {
      // TODO: replace with POST /api/processor/packaging
      setState((prev) => ({
        ...prev,
        packagingQueue: [
          {
            batchId,
            packagingType,
            operator,
            startedAt: formatTimestamp(),
            dateAdded: formatDateLabel(),
            progressPercent: 0,
            // Default status once a batch enters packaging — mirrors
            // carcasses' 'in-processing' state. Changed via
            // updatePackagingItemStatus() by the "In packaging" section's
            // Hold/Complete buttons on PackagingPageContent.
            status: 'in-packaging',
          },
          ...prev.packagingQueue,
        ],
      }))
      logActivity(`Packaging started for batch ${batchId}`)
    },
    [logActivity]
  )

  const updatePackagingProgress = useCallback((batchId, progressPercent) => {
    // TODO: replace with PATCH /api/processor/packaging/:batchId
    setState((prev) => ({
      ...prev,
      packagingQueue: prev.packagingQueue.map((p) =>
        p.batchId === batchId ? { ...p, progressPercent } : p
      ),
    }))
  }, [])

  // Sets a packaging queue item's Hold/Complete state, mirroring
  // updateCarcassStatus's role for the "In processing" section.
  const updatePackagingItemStatus = useCallback((batchId, status) => {
    // TODO: replace with PATCH /api/processor/packaging/:batchId/status
    setState((prev) => ({
      ...prev,
      packagingQueue: prev.packagingQueue.map((p) =>
        p.batchId === batchId ? { ...p, status } : p
      ),
    }))
    logActivity(`Packaging item ${batchId} moved to ${status}`)
  }, [logActivity])

  // ---- QR Generation ----

  const generateQR = useCallback(
    (batchId) => {
      // TODO: replace with POST /api/processor/qr
      setState((prev) => ({
        ...prev,
        qr: {
          ...prev.qr,
          generatedCount: prev.qr.generatedCount + 1,
          pendingCount: Math.max(0, prev.qr.pendingCount - 1),
        },
        batches: prev.batches.map((b) =>
          b.id === batchId ? { ...b, stage: 'ready' } : b
        ),
      }))
      logActivity(`QR code generated for batch ${batchId}`)
    },
    [logActivity]
  )

  // ---- Inventory ----

  const updateInventory = useCallback((patch) => {
    // TODO: replace with PATCH /api/processor/inventory
    setState((prev) => ({
      ...prev,
      inventory: { ...prev.inventory, ...patch },
    }))
  }, [])

  // ---- Quality Control ----

  const recordInspection = useCallback(
    (result) => {
      // TODO: replace with POST /api/processor/quality-checks
      // result: 'passed' | 'pending' | 'rejected'
      setState((prev) => ({
        ...prev,
        qualityControl: {
          ...prev.qualityControl,
          inspectionsToday: prev.qualityControl.inspectionsToday + 1,
          passed: prev.qualityControl.passed + (result === 'passed' ? 1 : 0),
          pending: prev.qualityControl.pending + (result === 'pending' ? 1 : 0),
          rejected:
            prev.qualityControl.rejected + (result === 'rejected' ? 1 : 0),
        },
      }))
      logActivity(`Quality inspection recorded: ${result}`)
    },
    [logActivity]
  )

  // ---- Cold Storage rooms (capacity) ----

  const updateColdStorageRoom = useCallback((roomId, percentFull) => {
    // TODO: replace with PATCH /api/processor/cold-storage/:roomId
    setState((prev) => {
      const exists = prev.coldStorageRooms.some((r) => r.id === roomId)
      const coldStorageRooms = exists
        ? prev.coldStorageRooms.map((r) =>
            r.id === roomId ? { ...r, percentFull } : r
          )
        : [...prev.coldStorageRooms, { id: roomId, percentFull }]
      return { ...prev, coldStorageRooms }
    })
  }, [])

  // ---- Cold Storage items ----

  // Adds a stored item record — called from ProceesingQueuePage.jsx when a
  // carcass is sent to "Cold storage" (itemType 'carcass') or "Completed"
  // from the In processing section (itemType 'cut'), and from
  // PackagingQueue.jsx when a package is "Completed" from the In packaging
  // section (itemType 'package').
  const addToColdStorage = useCallback(
    ({ itemType, sourceId, details, status }) => {
      // TODO: replace with POST /api/processor/cold-storage-items
      const item = {
        id: genId('CS'),
        itemType,
        sourceId,
        details,
        status,
        dateAdded: formatDateLabel(),
        addedAt: formatTimestamp(),
      }
      setState((prev) => ({
        ...prev,
        coldStorageItems: [item, ...prev.coldStorageItems],
      }))
      logActivity(`${itemType} ${sourceId} added to cold storage`)
      return item.id
    },
    [logActivity]
  )

  const updateColdStorageItemStatus = useCallback((itemId, status) => {
    // TODO: replace with PATCH /api/processor/cold-storage-items/:id
    setState((prev) => ({
      ...prev,
      coldStorageItems: prev.coldStorageItems.map((i) =>
        i.id === itemId ? { ...i, status } : i
      ),
    }))
  }, [])

  // ---- Profile ----

  const setProfile = useCallback((profile) => {
    // TODO: replace with data pulled from AuthContext / submitted profile
    setState((prev) => ({ ...prev, profile: { ...prev.profile, ...profile } }))
  }, [])

  const stats = useMemo(() => computeProcessorStats(state), [state])

  const value = useMemo(
    () => ({
      ...state,
      stats,
      receiveCarcass,
      updateCarcassStatus,
      createBatch,
      updateBatchStage,
      addToPackagingQueue,
      updatePackagingProgress,
      updatePackagingItemStatus,
      generateQR,
      updateInventory,
      recordInspection,
      updateColdStorageRoom,
      addToColdStorage,
      updateColdStorageItemStatus,
      addNotification,
      setProfile,
    }),
    [
      state,
      stats,
      receiveCarcass,
      updateCarcassStatus,
      createBatch,
      updateBatchStage,
      addToPackagingQueue,
      updatePackagingProgress,
      updatePackagingItemStatus,
      generateQR,
      updateInventory,
      recordInspection,
      updateColdStorageRoom,
      addToColdStorage,
      updateColdStorageItemStatus,
      addNotification,
      setProfile,
    ]
  )

  return (
    <ProcessorDataContextInstance.Provider value={value}>
      {children}
    </ProcessorDataContextInstance.Provider>
  )
}