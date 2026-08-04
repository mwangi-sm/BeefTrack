import { useState, useCallback, useMemo } from 'react'
import { ProcessorDataContextInstance } from './ProcessorDataContextInstance'
import {
  getInitialProcessorState,
  computeProcessorStats,
  genId,
  formatTimestamp,
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
            progressPercent: 0,
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

  // ---- Cold Storage ----

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
      generateQR,
      updateInventory,
      recordInspection,
      updateColdStorageRoom,
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
      generateQR,
      updateInventory,
      recordInspection,
      updateColdStorageRoom,
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