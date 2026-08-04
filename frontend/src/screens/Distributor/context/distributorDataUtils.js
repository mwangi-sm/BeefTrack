export function toISODate(d) {
  return d.toISOString().slice(0, 10)
}

function addDays(base, days) {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

const now = new Date()
export const TODAY_ISO = toISODate(now)
export const TOMORROW_ISO = toISODate(addDays(now, 1))
export const YESTERDAY_ISO = toISODate(addDays(now, -1))

export function formatTime12h(time24) {
  if (!time24) return ''
  const [hStr, mStr] = time24.split(':')
  let h = parseInt(hStr, 10)
  const period = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  if (h === 0) h = 12
  return `${h}:${mStr} ${period}`
}

export function formatDueLabel(dateISO, time24, verb = 'Expected') {
  const time = formatTime12h(time24)
  if (dateISO === TODAY_ISO) return `${verb} today, ${time}`
  if (dateISO === TOMORROW_ISO) return `${verb} tomorrow, ${time}`
  return `${verb} ${dateISO}, ${time}`
}

// Renders an activity-log entry's timestamp the same way across DistributorDashboard.jsx
// (latest 3) and Recent.jsx (full history), so the two screens never show mismatched labels
// for the same event.
export function formatActivityTime(timestamp) {
  const d = new Date(timestamp)
  const dateISO = toISODate(d)
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (dateISO === TODAY_ISO) return `Today, ${time}`
  if (dateISO === YESTERDAY_ISO) return `Yesterday, ${time}`
  return `${dateISO}, ${time}`
}