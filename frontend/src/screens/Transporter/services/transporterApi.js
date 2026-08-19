// Token-aware Transporter client. There is intentionally no mock fallback.
import { apiRequest, ApiError } from '../../../services/apiClient'

const items = (result) => result?.items || []
export const getAssignedDeliveries = async () => items(await apiRequest('/transporter/deliveries'))
export const getDeliveryById = (id) => apiRequest(`/transporter/deliveries/${encodeURIComponent(id)}`)
export const acceptDelivery = (id) => apiRequest(`/transporter/deliveries/${encodeURIComponent(id)}/accept`, { method: 'POST' })
export const reportIssue = (id, note) => apiRequest(`/transporter/deliveries/${encodeURIComponent(id)}/issue`, { method: 'POST', body: JSON.stringify({ note }) })
export const getActiveTrip = () => apiRequest('/transporter/trip/active')
export const startTrip = (id) => apiRequest(`/transporter/deliveries/${encodeURIComponent(id)}/start`, { method: 'POST' })
export const updateTripStatus = (status) => apiRequest('/transporter/trip/status', { method: 'PATCH', body: JSON.stringify({ status }) })
export const getDeliveryHistory = async () => items(await apiRequest('/transporter/deliveries/history'))
export const getNotifications = async () => items(await apiRequest('/transporter/notifications'))
export const markNotificationRead = (id) => apiRequest(`/transporter/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' })
export const getProfile = () => apiRequest('/transporter/profile')
export const updateProfile = (updates) => apiRequest('/transporter/profile', { method: 'PATCH', body: JSON.stringify(updates) })

// transport_documents has metadata only; no verified storage/status API exists.
export const getDocuments = async () => ({ available: false, documents: {} })
export const uploadDocument = async () => { throw new ApiError(501, 'Document uploads are not available until storage and document-status contracts are implemented.') }
export const deleteDocument = async () => { throw new ApiError(501, 'Document deletion is not available until storage and document-status contracts are implemented.') }
// The canonical traceability API is Admin-only and has no transporter assignment rule.
export const traceAnimal = async () => { throw new ApiError(501, 'Transporter traceability lookup is not available until an authorized assignment rule is defined.') }
