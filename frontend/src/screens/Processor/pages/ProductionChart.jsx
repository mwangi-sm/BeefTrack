import { Panel } from '../../../components/DashboardBits'
import { useProcessorData } from '../context/useProcessorData'

/**
 * Production Analytics. Today's figure is real (derived from batches
 * created today). Weekly/monthly output need historical, day-by-day
 * production data that the context doesn't track yet — those two bars
 * are placeholders (0) until that history exists.
 *
 * TODO: once there's a backend, replace weeklyKg/monthlyKg with real
 * aggregates (e.g. GET /api/processor/production?range=week|month).
 * Built as simple CSS bars rather than pulling in a charting library,
 * to keep this dependency-free — swap for recharts/chart.js later if
 * richer visuals are wanted.
 */
export function ProductionChart() {
  const { stats } = useProcessorData()

  const todayKg = stats.todaysProductionKg
  const weeklyKg = 0 // placeholder — no historical tracking yet
  const monthlyKg = 0 // placeholder — no historical tracking yet

  const maxKg = Math.max(todayKg, weeklyKg, monthlyKg, 1)

  const bars = [
    { label: "Today's production", value: todayKg },
    { label: 'Weekly output', value: weeklyKg },
    { label: 'Monthly output', value: monthlyKg },
  ]

  return (
    <Panel title="Production analytics">
      <div className="pq-chart">
        {bars.map((bar) => (
          <div className="pq-chart-row" key={bar.label}>
            <span className="pq-chart-label">{bar.label}</span>
            <div className="pq-chart-track">
              <div
                className="pq-chart-bar"
                style={{ width: `${Math.round((bar.value / maxKg) * 100)}%` }}
              />
            </div>
            <span className="pq-chart-value">{bar.value.toLocaleString()} kg</span>
          </div>
        ))}
      </div>
    </Panel>
  )
}