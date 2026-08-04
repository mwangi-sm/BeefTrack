import { useState, useCallback } from 'react'
import { TODAY_ISO, toISODate } from './distributorDataUtils'
import { DistributorDataContext } from './DistributorDataContextInstance'

export { DistributorDataContext } from './DistributorDataContextInstance'

// Storage bays shown across Warehouse Inventory / Add shipment until the distributor
// completes Profile Setup and defines their own — at which point storageBays below
// switches over to whatever they configured in Step 2 (Warehouse Information).
const DEFAULT_STORAGE_BAYS = ['Bay 1', 'Bay 2']

// Cut types shown as filter buttons on Warehouse Inventory and as the Cut dropdown
// in the Add shipment modal, until the distributor customizes them via "Manage cuts".
const DEFAULT_CUT_TYPES = ['Sirloin', 'Ground beef', 'Ribeye']

export function DistributorDataProvider({ children }) {
  // Everything below starts empty — no seeded shipments, deliveries, warehouse stock,
  // or activity history. The dashboard should only ever show what this distributor
  // has actually entered through Receive Shipment, Schedule Delivery, the Add
  // shipment modal, or Profile Setup.
  const [warehouseItems, setWarehouseItems] = useState([])
  const [shipmentRequests, setShipmentRequests] = useState([])
  const [deliveries, setDeliveries] = useState([])
  const [activityLog, setActivityLog] = useState([])
  const [profile, setProfile] = useState(null)
  const [profileComplete, setProfileComplete] = useState(false)
  const [storageBays, setStorageBays] = useState(DEFAULT_STORAGE_BAYS)
  const [cutTypes, setCutTypes] = useState(DEFAULT_CUT_TYPES)

  // Every meaningful action (shipment added/canceled, delivery scheduled/delivered)
  // goes through here so DistributorDashboard.jsx (latest 3) and Recent.jsx (full
  // history) are always reading the exact same feed instead of keeping their own copies.
  const addActivity = useCallback((entry) => {
    setActivityLog((prev) => [
      {
        ...entry,
        id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
      },
      ...prev,
    ])
  }, [])

  const acceptShipment = useCallback((id) => {
    setShipmentRequests((prev) => {
      const shipment = prev.find((r) => r.id === id)
      if (shipment && shipment.status === 'pending') {
        setWarehouseItems((items) => [
          ...items,
          {
            id: `shipment-${shipment.id}-${Date.now()}`,
            name: `Received: ${shipment.id}`,
            sub: `From ${shipment.from}`,
            count: Number(shipment.packs) || 0,
          },
        ])
        addActivity({ type: 'shipment-received', batchId: shipment.id, detail: shipment.from })
      }
      // resolvedAt records when the decision was made, so screens like the dashboard
      // can sort by "most recently added" instead of relying on original array order.
      return prev.map((r) => (r.id === id ? { ...r, status: 'accepted', resolvedAt: Date.now() } : r))
    })
  }, [addActivity])

  const declineShipment = useCallback((id) => {
    setShipmentRequests((prev) => {
      const shipment = prev.find((r) => r.id === id)
      if (shipment && shipment.status === 'pending') {
        addActivity({ type: 'shipment-canceled', batchId: shipment.id, detail: shipment.from })
      }
      return prev.map((r) => (r.id === id ? { ...r, status: 'declined', resolvedAt: Date.now() } : r))
    })
  }, [addActivity])

  // Used by the "Receive Shipment" / "Add shipment" modal on WarehouseInventory.jsx —
  // logs a batch straight into the warehouse without requiring a pre-existing pending
  // request (unlike acceptShipment, which resolves one of the seeded/incoming requests
  // above). `name` is the cut type (e.g. "Sirloin") and `date` is the received date
  // typed into the modal; both are stored on the item so WarehouseInventory.jsx can
  // display them exactly as entered instead of falling back to a generic label.
  const receiveManualShipment = useCallback(({ id, name, bay, packs, date }) => {
    if (!id) return
    setWarehouseItems((items) => [
      ...items,
      {
        id: `manual-${id}-${Date.now()}`,
        name: name || `Received: ${id}`,
        sub: bay || 'Unassigned bay',
        count: Number(packs) || 0,
        date: date || undefined,
      },
    ])
    addActivity({ type: 'shipment-received', batchId: id, detail: bay || 'Manual entry' })
  }, [addActivity])

  const scheduleDelivery = useCallback((delivery) => {
    setDeliveries((prev) => [...prev, { ...delivery, status: 'in-transit' }])
    addActivity({ type: 'delivery-scheduled', deliveryId: delivery.id, detail: delivery.to })
  }, [addActivity])

  const completeDelivery = useCallback((id) => {
    setDeliveries((prev) => {
      const delivery = prev.find((d) => d.id === id)
      if (delivery && delivery.status === 'in-transit') {
        let remaining = Number(delivery.packs) || 0
        setWarehouseItems((items) => {
          const next = []
          for (const item of items) {
            if (remaining <= 0) {
              next.push(item)
              continue
            }
            if (item.count <= remaining) {
              remaining -= item.count
            } else {
              next.push({ ...item, count: item.count - remaining })
              remaining = 0
            }
          }
          return next
        })
        addActivity({ type: 'delivery-completed', deliveryId: delivery.id, detail: delivery.to })
      }
      // completedAt stamps exactly when delivery finished, so "Deliveries completed
      // today" on the dashboard can be a real same-day count instead of a fixed number.
      return prev.map((d) => (d.id === id ? { ...d, status: 'completed', completedAt: Date.now() } : d))
    })
  }, [addActivity])

  // Called by ProfileSetupWizard.jsx's final "Submit Profile" step. storageBays is
  // derived from Step 2's Storage Bays list — WarehouseInventory.jsx's bay filters
  // and the Add shipment modal's Bay dropdown both read storageBays from context, so
  // this is the one place that switch flips from the defaults to whatever the
  // distributor actually configured.
  const completeProfileSetup = useCallback((profileData) => {
    setProfile(profileData)
    setProfileComplete(true)
    const bays = (profileData?.warehouse?.storageBays || []).map((b) => b.trim()).filter(Boolean)
    setStorageBays(bays.length > 0 ? bays : DEFAULT_STORAGE_BAYS)
    addActivity({
      type: 'profile-completed',
      detail: profileData?.company?.distributorName || 'your company',
    })
  }, [addActivity])

  // Called by ProfileSetupWizard.jsx when editing an already-completed profile
  // (opened via the DashboardShell profile icon → ProfileView → Edit). If both
  // password fields were left blank, that means "don't change it" — so the existing
  // password is preserved rather than being wiped out by an empty string.
  const updateProfile = useCallback((profileData) => {
    setProfile((prev) => ({
      ...profileData,
      security: {
        ...profileData.security,
        password: profileData.security.password || prev?.security?.password || '',
        confirmPassword: profileData.security.password || prev?.security?.password || '',
      },
    }))
    const bays = (profileData?.warehouse?.storageBays || []).map((b) => b.trim()).filter(Boolean)
    setStorageBays(bays.length > 0 ? bays : DEFAULT_STORAGE_BAYS)
    addActivity({
      type: 'profile-updated',
      detail: profileData?.company?.distributorName || 'your company',
    })
  }, [addActivity])

  // Called by WarehouseInventory.jsx's "Manage cuts" modal. Falls back to the
  // defaults if the distributor removes every cut, so the filter buttons and Add
  // shipment dropdown are never left with an empty list.
  const updateCutTypes = useCallback((newCuts) => {
    const cleaned = (newCuts || []).map((c) => c.trim()).filter(Boolean)
    setCutTypes(cleaned.length > 0 ? cleaned : DEFAULT_CUT_TYPES)
  }, [])

  const totalWarehouseCount = warehouseItems.reduce((sum, item) => sum + item.count, 0)
  const pendingShipmentRequests = shipmentRequests.filter((r) => r.status === 'pending')
  const shipmentsToday = pendingShipmentRequests.filter((r) => r.date === TODAY_ISO)
  const inTransitDeliveries = deliveries.filter((d) => d.status === 'in-transit')
  const deliveriesCompletedToday = deliveries.filter(
    (d) => d.status === 'completed' && d.completedAt && toISODate(new Date(d.completedAt)) === TODAY_ISO
  ).length

  // Newest first. DistributorDashboard.jsx takes the top 3; Recent.jsx renders the
  // whole thing.
  const sortedActivityLog = [...activityLog].sort((a, b) => b.timestamp - a.timestamp)
  const recentActivity = sortedActivityLog.slice(0, 3)

  const value = {
    warehouseItems,
    totalWarehouseCount,
    shipmentRequests,
    pendingShipmentRequests,
    shipmentsToday,
    deliveries,
    inTransitDeliveries,
    deliveriesCompletedToday,
    activityLog: sortedActivityLog,
    recentActivity,
    profile,
    profileComplete,
    storageBays,
    cutTypes,
    acceptShipment,
    declineShipment,
    receiveManualShipment,
    scheduleDelivery,
    completeDelivery,
    completeProfileSetup,
    updateProfile,
    updateCutTypes,
  }

  return (
    <DistributorDataContext.Provider value={value}>
      {children}
    </DistributorDataContext.Provider>
  )
}