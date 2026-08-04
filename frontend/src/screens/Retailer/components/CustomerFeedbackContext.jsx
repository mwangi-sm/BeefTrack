/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react'

const CustomerFeedbackContext = createContext(null)

let idCounter = 2000
function nextId(prefix) {
  idCounter += 1
  return `${prefix}-${idCounter}`
}

const initialReviews = [
  {
    id: 'rev-1',
    customerName: 'Amina Yusuf',
    rating: 5,
    comment: 'Loved being able to see exactly which farm this came from. Great quality sirloin too.',
    lot: 'LOT-000078',
    time: 'Today, 12:25 PM',
  },
]

const initialReports = [
  {
    id: 'rep-1',
    customerName: 'David Otieno',
    subject: 'Bad meat quality',
    description: 'The ground beef from pack #12 had an off smell when I opened it at home.',
    lot: 'LOT-000067',
    status: 'open',
    time: 'Today, 11:10 AM',
  },
]

export function CustomerFeedbackProvider({ children }) {
  const [reviews, setReviews] = useState(initialReviews)
  const [reports, setReports] = useState(initialReports)

  function addReview({ customerName, rating, comment, lot }) {
    setReviews((prev) => [
      { id: nextId('rev'), customerName, rating, comment, lot, time: 'Just now' },
      ...prev,
    ])
  }

  function addReport({ customerName, subject, description, lot }) {
    setReports((prev) => [
      { id: nextId('rep'), customerName, subject, description, lot, status: 'open', time: 'Just now' },
      ...prev,
    ])
  }

  function resolveReport(reportId) {
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: 'resolved' } : r))
    )
  }

  const stats = useMemo(() => {
    const averageRating = reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0
    const openReports = reports.filter((r) => r.status === 'open').length
    return { averageRating, openReports }
  }, [reviews, reports])

  const value = { reviews, reports, stats, addReview, addReport, resolveReport }

  return (
    <CustomerFeedbackContext.Provider value={value}>
      {children}
    </CustomerFeedbackContext.Provider>
  )
}

export function useCustomerFeedback() {
  const ctx = useContext(CustomerFeedbackContext)
  if (!ctx) {
    throw new Error('useCustomerFeedback must be used within a CustomerFeedbackProvider')
  }
  return ctx
}

