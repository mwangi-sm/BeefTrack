/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react'

const RetailerDataContext = createContext(null)

let idCounter = 1000
function nextId(prefix) {
  idCounter += 1
  return `${prefix}-${idCounter}`
}

function normalizeCutType(cutType) {
  return cutType?.trim() || 'Beef cuts'
}

const initialIncomingBatches = []

const initialInventory = []

const initialSales = []

const initialNotifications = []

// Delivery tracking — mirrors the "where is my order" experience you see on
// apps like Kilimall / Jumia Kenya. Each delivery has a timeline of events
// that the retailer can advance as goods move from distributor → store.
const initialDeliveries = []

import { useEffect } from 'react'

import { onCustomerScan } from '../../../lib/eventBus'

export function RetailerDataProvider({ children, retailerId }) {
  const [incomingBatches, setIncomingBatches] = useState(initialIncomingBatches)
  const [inventory, setInventory] = useState(initialInventory)
  const [sales, setSales] = useState(initialSales)
  const [notifications, setNotifications] = useState(initialNotifications)
  const [deliveries, setDeliveries] = useState(initialDeliveries)

  function receiveBatch({ id, packs, from, cutType = 'Beef cuts', counter = 'Display counter A' }) {
    const normalizedCut = normalizeCutType(cutType)
    setIncomingBatches((prev) => [
      { id: id || nextId('LOT'), packs, from, cutType: normalizedCut, counter, status: 'pending' },
      ...prev,
    ])
  }

  function verifyBatch(batchId) {
    setIncomingBatches((prev) => {
      const target = prev.find((batch) => batch.id === batchId && batch.status !== 'verified')
      if (!target) return prev

      setInventory((currentInventory) => [
        {
          id: nextId('inv'),
          name: normalizeCutType(target.cutType),
          lotId: target.id,
          counter: target.counter || 'Display counter A',
          packs: target.packs,
        },
        ...currentInventory,
      ])

      setNotifications((currentNotifications) => [
        {
          id: nextId('note'),
          type: 'verified',
          text: `Batch ${target.id} was verified and added to shelf as ${normalizeCutType(target.cutType)}.`,
          lot: target.id,
          time: 'Just now',
        },
        ...currentNotifications,
      ])

      return prev.map((batch) => (batch.id === batchId ? { ...batch, status: 'verified' } : batch))
    })
  }

  function shelveBatch(batchId, counter = 'Display counter A') {
    setIncomingBatches((prev) => {
      const batch = prev.find((item) => item.id === batchId && item.status === 'verified')
      if (!batch) return prev

      setInventory((currentInventory) => [
        {
          id: nextId('inv'),
          name: normalizeCutType(batch.cutType),
          lotId: batch.id,
          counter,
          packs: batch.packs,
        },
        ...currentInventory,
      ])

      return prev.filter((item) => item.id !== batchId)
    })
  }

  function sellItem(itemId, qty) {
    const item = inventory.find((entry) => entry.id === itemId)
    if (!item || qty <= 0) return
    setInventory((prev) => prev.map((entry) => (entry.id === itemId ? { ...entry, packs: Math.max(0, entry.packs - qty) } : entry)))
    setSales((prev) => [
      { id: nextId('sale'), item: item.name, packs: qty, time: 'Just now' },
      ...prev,
    ])
  }

  function addScanNotification(lot, packNumber) {
    setNotifications((prev) => [
      { id: nextId('note'), type: 'scan', text: `Customer scanned ${lot}, pack #${packNumber}`, lot, time: 'Just now' },
      ...prev,
    ])
  }

  // ---- Delivery tracking helpers -----------------------------------------
  // Each helper advances a delivery's timeline and pushes a new event so the
  // retailer can see a full audit trail — just like Kilimall / Jumia Kenya.

  function markArrived(deliveryId) {
    const now = new Date()
    const timeString = `Today, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    setDeliveries((prev) =>
      prev.map((delivery) => {
        if (delivery.id !== deliveryId) return delivery
        const newEvent = {
          id: nextId('evt'),
          status: 'arrived',
          label: 'Arrived at your store',
          time: timeString,
          location: delivery.destination,
        }
        return {
          ...delivery,
          status: 'arrived',
          arrivalTime: timeString,
          events: [...delivery.events, newEvent],
        }
      })
    )
    setNotifications((prev) => [
      { id: nextId('note'), type: 'delivery', text: `Delivery ${deliveryId} has arrived at your store.`, lot: deliveryId, time: 'Just now' },
      ...prev,
    ])
  }

  function markDeparted(deliveryId) {
    const now = new Date()
    const timeString = `Today, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    setDeliveries((prev) =>
      prev.map((delivery) => {
        if (delivery.id !== deliveryId) return delivery
        const newEvent = {
          id: nextId('evt'),
          status: 'departed',
          label: 'Batch departed from your store to customer',
          time: timeString,
          location: delivery.destination,
        }
        return {
          ...delivery,
          status: 'departed',
          departureFromRetailer: timeString,
          events: [...delivery.events, newEvent],
        }
      })
    )
    setNotifications((prev) => [
      { id: nextId('note'), type: 'delivery', text: `Delivery ${deliveryId} has departed from your store.`, lot: deliveryId, time: 'Just now' },
      ...prev,
    ])
  }

  function markDelivered(deliveryId) {
    const now = new Date()
    const timeString = `Today, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    setDeliveries((prev) =>
      prev.map((delivery) => {
        if (delivery.id !== deliveryId) return delivery
        const newEvent = {
          id: nextId('evt'),
          status: 'delivered',
          label: 'Delivery completed — received by customer',
          time: timeString,
          location: delivery.destination,
        }
        return {
          ...delivery,
          status: 'delivered',
          deliveredTime: timeString,
          events: [...delivery.events, newEvent],
        }
      })
    )
    setNotifications((prev) => [
      { id: nextId('note'), type: 'delivery', text: `Delivery ${deliveryId} has been completed.`, lot: deliveryId, time: 'Just now' },
      ...prev,
    ])
  }

  const stats = useMemo(() => {
    const pendingVerification = incomingBatches.filter((batch) => batch.status === 'pending').length
    const itemsOnShelf = inventory.reduce((sum, item) => sum + item.packs, 0)
    const unitsSoldToday = sales.reduce((sum, sale) => sum + sale.packs, 0)
    const deliveriesInTransit = deliveries.filter((d) => d.status === 'in_transit').length
    const deliveriesArrived = deliveries.filter((d) => d.status === 'arrived').length
    const deliveriesDeparted = deliveries.filter((d) => d.status === 'departed' || d.status === 'delivered').length
    return {
      batchesReceivedToday: incomingBatches.length,
      itemsOnShelf,
      pendingVerification,
      unitsSoldToday,
      deliveriesInTransit,
      deliveriesArrived,
      deliveriesDeparted,
    }
  }, [incomingBatches, inventory, sales, deliveries])

  const value = {
    incomingBatches,
    inventory,
    sales,
    notifications,
    deliveries,
    stats,
    receiveBatch,
    verifyBatch,
    shelveBatch,
    sellItem,
    addScanNotification,
    markArrived,
    markDeparted,
    markDelivered,
  }

  // Subscribe to customer scans emitted elsewhere in the app. If a
  // `retailerId` is provided only apply scans targeted to this retailer;
  // otherwise accept all for demo purposes.
  useEffect(() => {
    const unsubscribe = onCustomerScan((payload) => {
      try {
        const { lot, packNumber, retailerId: targetRetailerId, customer } = payload || {}
        if (targetRetailerId && retailerId && targetRetailerId !== retailerId) return
        setNotifications((prev) => [
          { id: nextId('note'), type: 'scan', text: `${customer || 'A customer'} scanned ${lot}${packNumber ? `, pack #${packNumber}` : ''}`, lot, time: 'Just now' },
          ...prev,
        ])
      } catch (err) {
        // ignore
      }
    })
    return unsubscribe
  }, [retailerId])

  return <RetailerDataContext.Provider value={value}>{children}</RetailerDataContext.Provider>
}

export function useRetailerData() {
  const ctx = useContext(RetailerDataContext)
  if (!ctx) {
    throw new Error('useRetailerData must be used within a RetailerDataProvider')
  }
  return ctx
}
