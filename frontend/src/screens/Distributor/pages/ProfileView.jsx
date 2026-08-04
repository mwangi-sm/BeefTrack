import { Icon, IconPaths } from '../../../components/icons'

function Field({ label, value }) {
  return (
    <div className="pv-field">
      <span className="pv-field-label">{label}</span>
      <span className="pv-field-value">{value || value === 0 ? value : '—'}</span>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="pv-section">
      <h3>{title}</h3>
      <div className="pv-grid">{children}</div>
    </div>
  )
}

const DOCUMENT_FIELDS = [
  ['businessRegistration', 'Business registration'],
  ['businessPermit', 'Business permit'],
  ['kraCertificate', 'KRA certificate'],
  ['foodHandlingCertificate', 'Food handling certificate'],
  ['warehouseLicense', 'Warehouse license'],
  ['insuranceCertificate', 'Insurance certificate'],
]

export function ProfileView({ profile, onClose = () => {}, onEdit = () => {} }) {
  if (!profile) return null

  const { company, warehouse, contact, configuration, delivery, documents, security } = profile

  return (
    <div className="pv-backdrop" onClick={onClose}>
      <div className="pv-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pv-header">
          <div>
            <h2>{company?.distributorName || 'Your profile'}</h2>
            <p className="pv-subtitle">{warehouse?.name}{warehouse?.code ? ` · ${warehouse.code}` : ''}</p>
          </div>
          <button className="pv-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="pv-body">
          <Section title="Company Information">
            <Field label="Distributor name" value={company?.distributorName} />
            <Field label="Industry" value={company?.industry} />
            <Field label="Business registration number" value={company?.businessRegNumber} />
            <Field label="KRA PIN" value={company?.kraPin} />
            <Field label="License number" value={company?.licenseNumber} />
            <Field label="Years in operation" value={company?.yearsInOperation} />
            <Field label="Website" value={company?.website} />
            <Field label="Email" value={company?.email} />
            <Field label="Phone" value={company?.phone} />
            <Field label="Alternative phone" value={company?.altPhone} />
            {company?.description && (
              <div className="pv-field pv-field-wide">
                <span className="pv-field-label">Description</span>
                <span className="pv-field-value">{company.description}</span>
              </div>
            )}
          </Section>

          <Section title="Warehouse Information">
            <Field label="Warehouse name" value={warehouse?.name} />
            <Field label="Warehouse code" value={warehouse?.code} />
            <Field label="Type" value={warehouse?.type} />
            <Field label="Capacity" value={warehouse?.capacityTons ? `${warehouse.capacityTons} tons` : ''} />
            <Field label="Current storage" value={warehouse?.currentCapacityPercent ? `${warehouse.currentCapacityPercent}%` : ''} />
            <Field label="Address" value={warehouse?.address} />
            <Field label="County" value={warehouse?.county} />
            <Field label="Sub county" value={warehouse?.subCounty} />
            <Field label="Town" value={warehouse?.town} />
            <Field label="Postal address" value={warehouse?.postalAddress} />
            <Field label="Coordinates" value={warehouse?.latitude && warehouse?.longitude ? `${warehouse.latitude}, ${warehouse.longitude}` : ''} />
            <div className="pv-field pv-field-wide">
              <span className="pv-field-label">Storage bays</span>
              <span className="pv-field-value">
                {warehouse?.storageBays?.length > 0 ? warehouse.storageBays.join(', ') : 'Using default bays'}
              </span>
            </div>
          </Section>

          <Section title="Primary Contact">
            <Field label="Full name" value={contact?.fullName} />
            <Field label="Job title" value={contact?.jobTitle} />
            <Field label="Email" value={contact?.email} />
            <Field label="Phone" value={contact?.phone} />
            <Field label="National ID" value={contact?.nationalId} />
            <Field label="Employee number" value={contact?.employeeNumber} />
          </Section>

          <Section title="Warehouse Configuration">
            <Field label="Temperature monitoring" value={configuration?.temperatureMonitoring ? 'Enabled' : 'Disabled'} />
            {configuration?.temperatureMonitoring && (
              <Field label="Temperature range" value={`${configuration.minTemp}°C to ${configuration.maxTemp}°C`} />
            )}
            <Field label="Barcode scanner" value={configuration?.barcodeScanner ? 'Enabled' : 'Disabled'} />
            <Field label="QR code scanner" value={configuration?.qrCodeScanner ? 'Enabled' : 'Disabled'} />
            <Field
              label="Inventory tracking"
              value={[
                configuration?.batchTracking && 'Batch tracking',
                configuration?.fifo && 'FIFO',
                configuration?.fefo && 'FEFO',
              ].filter(Boolean).join(', ')}
            />
            <Field
              label="Notifications"
              value={[
                configuration?.notifyLowStock && 'Low stock',
                configuration?.notifyExpiring && 'Expiring products',
                configuration?.notifyDispatch && 'Dispatch alerts',
                configuration?.notifyCapacity && 'Capacity alerts',
              ].filter(Boolean).join(', ')}
            />
          </Section>

          <Section title="Delivery Information">
            <Field label="Delivery radius" value={delivery?.radiusKm ? `${delivery.radiusKm} km` : ''} />
            <Field label="Vehicles managed" value={delivery?.vehiclesManaged} />
            <Field label="Average daily dispatches" value={delivery?.avgDailyDispatches} />
            <Field label="Preferred delivery time" value={delivery?.preferredTimes?.join(', ')} />
          </Section>

          <Section title="Verification Documents">
            {DOCUMENT_FIELDS.map(([field, label]) => (
              <Field key={field} label={label} value={documents?.[field] ? '✓ Uploaded' : 'Not uploaded'} />
            ))}
          </Section>

          <Section title="Security">
            <Field label="Password" value={security?.password ? '••••••••' : 'Not set'} />
            <Field label="Two-factor authentication" value={security?.twoFactorEnabled ? 'Enabled' : 'Disabled'} />
            <Field label="Security question" value={security?.securityQuestion} />
          </Section>
        </div>

        <div className="pv-footer">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={onEdit}>
            <Icon size={15} style={{ marginRight: 6 }}>{IconPaths.gear}</Icon>Edit profile
          </button>
        </div>
      </div>

      <style>{`
        .pv-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 20, 25, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 60;
          padding: 16px;
        }

        .pv-modal {
          --pv-border: var(--border-color, #dfe4ea);
          --pv-surface: var(--surface-color, #ffffff);
          --pv-surface-muted: var(--surface-muted, #f6f8fa);
          --pv-text: var(--text-color, #1f2933);
          --pv-text-muted: var(--text-muted, #5a6570);
          background: var(--pv-surface);
          color: var(--pv-text);
          border-radius: 14px;
          width: 100%;
          max-width: 640px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .pv-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--pv-border);
        }

        .pv-header h2 {
          margin: 0 0 4px;
          font-size: 1.15rem;
        }

        .pv-subtitle {
          margin: 0;
          font-size: 0.85rem;
          color: var(--pv-text-muted);
        }

        .pv-close {
          background: none;
          border: none;
          font-size: 1.1rem;
          cursor: pointer;
          color: var(--pv-text-muted);
          line-height: 1;
          padding: 4px;
        }

        .pv-body {
          padding: 20px 24px;
          overflow-y: auto;
          flex: 1;
        }

        .pv-section {
          margin-bottom: 24px;
        }

        .pv-section h3 {
          margin: 0 0 12px;
          font-size: 0.95rem;
        }

        .pv-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(160px, 1fr));
          gap: 12px 18px;
          padding: 16px;
          background: var(--pv-surface-muted);
          border: 1px solid var(--pv-border);
          border-radius: 10px;
        }

        .pv-field {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .pv-field-wide {
          grid-column: 1 / -1;
        }

        .pv-field-label {
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--pv-text-muted);
        }

        .pv-field-value {
          font-size: 0.92rem;
          word-break: break-word;
        }

        .pv-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 16px 24px;
          border-top: 1px solid var(--pv-border);
        }

        [data-theme='dark'] .pv-modal {
          --pv-border: #333d47;
          --pv-surface: #1b222b;
          --pv-surface-muted: #222a34;
          --pv-text: #e7ebef;
          --pv-text-muted: #99a4b0;
        }

        @media (max-width: 560px) {
          .pv-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}