import { DashHead } from '../../../components/DashHead'
import { Panel, DetailRow, LoadingState, ErrorState, EmptyState } from '../../../components/DashboardBits'
import { Icon, IconPaths } from '../../../components/icons'
import { useAsync } from '../services/useTransporter'
import { getProfile } from '../services/transporterApi'

const vehicleFields = [
  { key: 'vehicleRegistration', label: 'Vehicle Registration' },
  { key: 'vehicleMake', label: 'Make' },
  { key: 'vehicleModel', label: 'Model' },
  { key: 'vehicleCapacity', label: 'Capacity' },
  { key: 'transporterType', label: 'Transporter Type' },
  { key: 'companyName', label: 'Company Name', showIf: (f) => f.transporterType === 'Company' },
]

const insuranceMock = {
  provider: 'Jubilee Insurance',
  policyNumber: 'MV-2026-004781',
  expiry: '2026-12-15',
  status: 'active',
}

const serviceMock = [
  { date: '2026-07-10', type: 'Oil change & filter', mileage: '45,200 km', provider: 'AutoXpress Ngong Rd' },
  { date: '2026-05-22', type: 'Brake pad replacement', mileage: '42,800 km', provider: 'AutoXpress Ngong Rd' },
  { date: '2026-02-14', type: 'Annual inspection', mileage: '38,100 km', provider: 'NTSA Inspection Centre' },
]

export function VehicleInfo() {
  const { data: profile, loading, error, reload } = useAsync(getProfile, [])

  const insuranceStatusMeta = insuranceMock.status === 'active'
    ? { label: 'Active', className: 'status-ok' }
    : insuranceMock.status === 'expiring'
      ? { label: 'Expiring soon', className: 'status-soon' }
      : { label: 'Expired', className: 'status-overdue' }

  return (
    <>
      <DashHead
        title="Vehicle Information"
        subtitle="Your registered transport vehicle and maintenance records."
      />

      {loading && <Panel><LoadingState label="Loading vehicle details…" /></Panel>}
      {!loading && error && <Panel><ErrorState message="Couldn't load vehicle details." onRetry={reload} /></Panel>}
      {!loading && !error && !profile && (
        <Panel>
          <EmptyState icon={IconPaths.truck} title="No vehicle registered" subtitle="Complete your profile to link a vehicle." />
        </Panel>
      )}

      {!loading && !error && profile && (
        <div className="grid-2col">
          <div>
            <Panel title="Vehicle details">
              {vehicleFields
                .filter((f) => !f.showIf || f.showIf(profile))
                .map((f) => (
                  <DetailRow key={f.key} label={f.label} value={profile[f.key]} />
                ))}
              <DetailRow label="License Number" value={profile.licenseNumber} />
              <DetailRow label="County" value={profile.county} />
            </Panel>

            <Panel title="Insurance">
              <DetailRow label="Provider" value={insuranceMock.provider} />
              <DetailRow label="Policy Number" value={insuranceMock.policyNumber} />
              <DetailRow label="Expiry" value={insuranceMock.expiry} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-soft)' }}>
                <span style={{ fontSize: 12.5, color: 'var(--ink-600)' }}>Status</span>
                <span className={`status-pill ${insuranceStatusMeta.className}`} style={{ fontSize: 11.5 }}>
                  {insuranceStatusMeta.label}
                </span>
              </div>
            </Panel>
          </div>

          <div>
            <Panel
              title="Service history"
              action={
                <button className="btn btn-outline" style={{ padding: '5px 12px', fontSize: 12 }}>
                  <Icon size={13}>{IconPaths.plus}</Icon> Log service
                </button>
              }
            >
              {serviceMock.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--ink-600)', margin: 0 }}>No service records yet.</p>
              ) : (
                serviceMock.map((s, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    gap: 12,
                    padding: '12px 0',
                    borderBottom: i < serviceMock.length - 1 ? '1px solid var(--border-soft)' : 'none',
                  }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'var(--sage-100)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={16}>{IconPaths.tool}</Icon>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>{s.type}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-600)', marginTop: 2 }}>
                        {s.date} · {s.mileage} · {s.provider}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </Panel>

            <Panel title="Vehicle documents">
              <p style={{ fontSize: 13, color: 'var(--ink-600)', margin: '0 0 14px' }}>
                Keep your vehicle logbook and insurance certificate up to date.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1.5px solid var(--border-soft)',
                  background: 'var(--cream-50)',
                }}>
                  <Icon size={15}>{IconPaths.document}</Icon>
                  <span style={{ fontSize: 13, flex: 1 }}>Vehicle logbook</span>
                  <span className="status-pill status-ok" style={{ fontSize: 10.5 }}>Uploaded</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1.5px solid var(--border-soft)',
                  background: 'var(--cream-50)',
                }}>
                  <Icon size={15}>{IconPaths.document}</Icon>
                  <span style={{ fontSize: 13, flex: 1 }}>Insurance certificate</span>
                  <span className="status-pill status-ok" style={{ fontSize: 10.5 }}>Uploaded</span>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      )}
    </>
  )
}
