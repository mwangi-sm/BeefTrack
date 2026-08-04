import { useState } from 'react'
import { Panel, CareRow, ActivityItem } from '../components/DashboardBits'
import { useCustomerFeedback } from './Retailer/components/CustomerFeedbackContext'

function Stars({ rating }) {
  return <span style={{ letterSpacing: 1 }}>{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>
}

// ---------- Retailer side (read + resolve) ----------

export function RetailerReviewsPage() {
  const { reviews, stats } = useCustomerFeedback()

  return (
    <Panel title={`Customer reviews — ${stats.averageRating.toFixed(1)}★ average (${reviews.length})`}>
      {reviews.length === 0 && (
        <p style={{ fontSize: 13.5, color: 'var(--ink-600)' }}>No reviews yet.</p>
      )}
      {reviews.map((r) => (
        <div key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-soft)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <b style={{ fontSize: 13.5 }}>{r.customerName}</b>
            <Stars rating={r.rating} />
          </div>
          <p style={{ fontSize: 13, margin: '4px 0', color: 'var(--ink-900)' }}>{r.comment}</p>
          <div style={{ fontSize: 12, color: 'var(--ink-600)' }}>
            {r.lot ? `Re: ${r.lot} · ` : ''}{r.time}
          </div>
        </div>
      ))}
    </Panel>
  )
}

export function RetailerReportsPage() {
  const { reports, resolveReport } = useCustomerFeedback()
  const open = reports.filter((r) => r.status === 'open')
  const resolved = reports.filter((r) => r.status === 'resolved')

  return (
    <>
      <Panel title={`Open concerns (${open.length})`}>
        {open.length === 0 && (
          <p style={{ fontSize: 13.5, color: 'var(--ink-600)' }}>No open concerns — all clear.</p>
        )}
        {open.map((r) => (
          <CareRow
            key={r.id}
            id={r.lot || r.id}
            type={`${r.subject} · ${r.customerName} — ${r.description}`}
            due={r.time}
            status="overdue"
            label="Mark resolved"
            onClick={() => resolveReport(r.id)}
          />
        ))}
      </Panel>
      <Panel title="Resolved concerns">
        {resolved.length === 0 && (
          <p style={{ fontSize: 13.5, color: 'var(--ink-600)' }}>Nothing resolved yet.</p>
        )}
        {resolved.map((r) => (
          <ActivityItem key={r.id} text={`${r.subject} — ${r.customerName} (resolved)`} time={r.time} />
        ))}
      </Panel>
    </>
  )
}

// ---------- Consumer side (submit) ----------

// NOTE: customerName is hardcoded to match ConsumerDashboard's current
// hardcoded "Amina Yusuf" — once real auth/accounts exist, pass the actual
// logged-in user's name in as a prop instead.
const CURRENT_CUSTOMER_NAME = 'Amina Yusuf'

export function ConsumerReviewsPage() {
  const { reviews, addReview } = useCustomerFeedback()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [lot, setLot] = useState('')

  const myReviews = reviews.filter((r) => r.customerName === CURRENT_CUSTOMER_NAME)

  function submit() {
    if (!comment.trim()) return
    addReview({ customerName: CURRENT_CUSTOMER_NAME, rating, comment: comment.trim(), lot: lot.trim() || undefined })
    setComment('')
    setLot('')
    setRating(5)
  }

  return (
    <>
      <Panel title="Leave a review">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 460 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, color: 'var(--ink-600)' }}>
            Rating
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border-soft)', background: 'var(--page-bg)', color: 'var(--ink-900)' }}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{'★'.repeat(n)}{'☆'.repeat(5 - n)} ({n})</option>
              ))}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, color: 'var(--ink-600)' }}>
            Which product? (optional lot ID)
            <input
              type="text"
              placeholder="e.g. LOT-000078"
              value={lot}
              onChange={(e) => setLot(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border-soft)', background: 'var(--page-bg)', color: 'var(--ink-900)' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, color: 'var(--ink-600)' }}>
            Your review
            <textarea
              rows={3}
              placeholder="What did you think?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border-soft)', background: 'var(--page-bg)', color: 'var(--ink-900)', fontFamily: 'inherit', resize: 'vertical' }}
            />
          </label>
          <button className="btn btn-primary" onClick={submit} style={{ alignSelf: 'flex-start' }}>
            Submit review
          </button>
        </div>
      </Panel>

      <Panel title="Your reviews">
        {myReviews.length === 0 && (
          <p style={{ fontSize: 13.5, color: 'var(--ink-600)' }}>You haven't left any reviews yet.</p>
        )}
        {myReviews.map((r) => (
          <div key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-soft)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Stars rating={r.rating} />
              <span style={{ fontSize: 12, color: 'var(--ink-600)' }}>{r.time}</span>
            </div>
            <p style={{ fontSize: 13, margin: '4px 0 0' }}>{r.comment}</p>
          </div>
        ))}
      </Panel>
    </>
  )
}

const REPORT_SUBJECTS = ['Bad meat quality', 'Packaging issue', 'Suspected counterfeit', 'Other']

export function ConsumerReportsPage() {
  const { reports, addReport } = useCustomerFeedback()
  const [subject, setSubject] = useState(REPORT_SUBJECTS[0])
  const [description, setDescription] = useState('')
  const [lot, setLot] = useState('')

  const myReports = reports.filter((r) => r.customerName === CURRENT_CUSTOMER_NAME)

  function submit() {
    if (!description.trim()) return
    addReport({ customerName: CURRENT_CUSTOMER_NAME, subject, description: description.trim(), lot: lot.trim() || undefined })
    setDescription('')
    setLot('')
    setSubject(REPORT_SUBJECTS[0])
  }

  return (
    <>
      <Panel title="Report a concern">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 460 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, color: 'var(--ink-600)' }}>
            What's the issue?
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border-soft)', background: 'var(--page-bg)', color: 'var(--ink-900)' }}
            >
              {REPORT_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, color: 'var(--ink-600)' }}>
            Which product? (optional lot ID)
            <input
              type="text"
              placeholder="e.g. LOT-000067"
              value={lot}
              onChange={(e) => setLot(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border-soft)', background: 'var(--page-bg)', color: 'var(--ink-900)' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, color: 'var(--ink-600)' }}>
            Tell us what happened
            <textarea
              rows={3}
              placeholder="Describe the issue"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border-soft)', background: 'var(--page-bg)', color: 'var(--ink-900)', fontFamily: 'inherit', resize: 'vertical' }}
            />
          </label>
          <button className="btn btn-primary" onClick={submit} style={{ alignSelf: 'flex-start' }}>
            Submit report
          </button>
        </div>
      </Panel>

      <Panel title="Your reports">
        {myReports.length === 0 && (
          <p style={{ fontSize: 13.5, color: 'var(--ink-600)' }}>You haven't reported anything.</p>
        )}
        {myReports.map((r) => (
          <ActivityItem
            key={r.id}
            text={`${r.subject}${r.lot ? ` (${r.lot})` : ''} — ${r.status === 'resolved' ? 'Resolved' : 'Open'}`}
            time={r.time}
          />
        ))}
      </Panel>
    </>
  )
}
