// Transporter API — mock layer.
// Swap to real fetch calls when the backend endpoints are ready.
// Toggle: set USE_MOCK = false and uncomment the real fetch stubs.

import {
  DELIVERIES,
  ACTIVE_TRIP,
  DELIVERY_HISTORY,
  NOTIFICATIONS as MOCK_NOTIFICATIONS,
  PROFILE as MOCK_PROFILE,
  DOCUMENTS as MOCK_DOCUMENTS,
  ANIMALS,
} from '../data/Transporterdata'
import { authorizedFetch } from '../../../lib/apiClient'

const USE_MOCK = true

// ----- small helpers -----

function delay(ms = 280) {
  return new Promise((r) => setTimeout(r, ms))
}

// ----- deliveries -----

export async function getAssignedDeliveries() {
  if (USE_MOCK) {
    await delay()
    return DELIVERIES
  }
  const res = await authorizedFetch('/api/transporter/deliveries')
  if (!res.ok) throw new Error('Failed to load assigned deliveries')
  return res.json()
}

export async function getDeliveryById(id) {
  if (USE_MOCK) {
    await delay(150)
    const d = DELIVERIES.find((d) => d.id === id)
    if (!d) throw new Error('Delivery not found')
    return d
  }
  const res = await authorizedFetch(`/api/transporter/deliveries/${id}`)
  if (!res.ok) throw new Error('Failed to load delivery')
  return res.json()
}

export async function acceptDelivery(id) {
  if (USE_MOCK) {
    await delay(200)
    const d = DELIVERIES.find((d) => d.id === id)
    if (d) d.status = 'accepted'
    return d
  }
  const res = await authorizedFetch(`/api/transporter/deliveries/${id}/accept`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to accept delivery')
  return res.json()
}

export async function reportIssue(id, note) {
  if (USE_MOCK) {
    await delay(200)
    const d = DELIVERIES.find((d) => d.id === id)
    if (d) {
      d.status = 'issue'
      d.notes = note || d.notes
    }
    return d
  }
  const res = await authorizedFetch(`/api/transporter/deliveries/${id}/issue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note }),
  })
  if (!res.ok) throw new Error('Failed to report issue')
  return res.json()
}

// ----- animal lookup / traceability -----

export async function traceAnimal(tagId) {
  if (USE_MOCK) {
    await delay(250)
    const animal = ANIMALS.find(
      (a) => a.tagId.toLowerCase() === tagId.trim().toLowerCase()
    )
    return animal || null
  }
  const res = await authorizedFetch(`/api/transporter/animals/${encodeURIComponent(tagId)}`)
  if (!res.ok) throw new Error('Failed to look up animal')
  return res.json()
}

// ----- active trip -----

export async function getActiveTrip() {
  if (USE_MOCK) {
    await delay(200)
    return ACTIVE_TRIP
  }
  const res = await authorizedFetch('/api/transporter/trip/active')
  if (!res.ok) throw new Error('Failed to load active trip')
  return res.json()
}

export async function startTrip(id) {
  if (USE_MOCK) {
    await delay(220)
    const d = DELIVERIES.find((d) => d.id === id)
    if (d) d.status = 'in_transit'
    return d
  }
  const res = await authorizedFetch(`/api/transporter/deliveries/${id}/start`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to start trip')
  return res.json()
}

export async function updateTripStatus(status) {
  if (USE_MOCK) {
    await delay(180)
    ACTIVE_TRIP.status = status
    return ACTIVE_TRIP
  }
  const res = await authorizedFetch('/api/transporter/trip/status', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error('Failed to update trip status')
  return res.json()
}

// ----- history -----

export async function getDeliveryHistory() {
  if (USE_MOCK) {
    await delay(250)
    return DELIVERY_HISTORY
  }
  const res = await authorizedFetch('/api/transporter/deliveries/history')
  if (!res.ok) throw new Error('Failed to load delivery history')
  return res.json()
}

// ----- notifications -----

export async function getNotifications() {
  if (USE_MOCK) {
    await delay(200)
    return MOCK_NOTIFICATIONS
  }
  const res = await authorizedFetch('/api/transporter/notifications')
  if (!res.ok) throw new Error('Failed to load notifications')
  return res.json()
}

export async function markNotificationRead(id) {
  if (USE_MOCK) {
    await delay(100)
    const n = MOCK_NOTIFICATIONS.find((n) => n.id === id)
    if (n) n.unread = false
    return n
  }
  const res = await authorizedFetch(`/api/transporter/notifications/${id}/read`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to update notification')
  return res.json()
}

// ----- profile -----

export async function getProfile() {
  if (USE_MOCK) {
    await delay(300)
    return { ...MOCK_PROFILE }
  }
  const res = await authorizedFetch('/api/transporter/profile')
  if (!res.ok) throw new Error('Failed to load profile')
  return res.json()
}

export async function updateProfile(updates) {
  if (USE_MOCK) {
    await delay(400)
    Object.assign(MOCK_PROFILE, updates)
    return { ...MOCK_PROFILE }
  }
  const res = await authorizedFetch('/api/transporter/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error('Failed to update profile')
  return res.json()
}

// ----- documents -----

export async function getDocuments() {
  if (USE_MOCK) {
    await delay(300)
    return { ...MOCK_DOCUMENTS }
  }
  const res = await authorizedFetch('/api/transporter/documents')
  if (!res.ok) throw new Error('Failed to load documents')
  return res.json()
}

export async function uploadDocument(docKey, fileData) {
  if (USE_MOCK) {
    await delay(500)
    MOCK_DOCUMENTS.documents[docKey] = {
      name: fileData.name,
      size: fileData.size,
      type: fileData.type,
      dataUrl: fileData.dataUrl,
      status: 'pending_review',
    }
    return MOCK_DOCUMENTS.documents[docKey]
  }
  const res = await authorizedFetch(`/api/transporter/documents/${docKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fileData),
  })
  if (!res.ok) throw new Error('Failed to upload document')
  return res.json()
}

export async function deleteDocument(docKey) {
  if (USE_MOCK) {
    await delay(300)
    delete MOCK_DOCUMENTS.documents[docKey]
    return true
  }
  const res = await authorizedFetch(`/api/transporter/documents/${docKey}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete document')
  return res.json()
}
