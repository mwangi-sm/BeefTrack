import { useState } from 'react'
import { Panel, StatCard } from '../../components/DashboardBits'
import { Icon, IconPaths } from '../../components/icons'
import { DOCUMENT_REQUIREMENTS, getAllDocuments } from './documentRequirements'

// Document status badge
function DocumentStatusBadge({ status }) {
  const statusConfig = {
    pending: { label: 'Pending', color: 'var(--ink-600)', bg: 'rgba(100,100,100,0.1)' },
    uploaded: { label: 'Uploaded', color: 'var(--gold-600)', bg: 'rgba(184,135,58,0.16)' },
    verified: { label: 'Verified', color: 'var(--sage-600)', bg: 'rgba(92,122,92,0.14)' },
    rejected: { label: 'Needs Update', color: 'var(--maroon-800)', bg: 'rgba(90,15,23,0.12)' },
  }

  const config = statusConfig[status] || statusConfig.pending

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: 6,
        fontSize: 11.5,
        fontWeight: 600,
        color: config.color,
        background: config.bg,
      }}
    >
      {config.label}
    </span>
  )
}

// Individual document card
function DocumentCard({ doc, status, onUpload }) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div
      style={{
        border: '1.5px solid var(--border-soft)',
        borderRadius: 10,
        padding: 16,
        marginBottom: 12,
        background: status === 'rejected' ? 'rgba(90,15,23,0.04)' : 'var(--page-bg)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 12,
          cursor: 'pointer',
        }}
        onClick={() => setShowDetails((v) => !v)}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 4 }}>
            {doc.name}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-600)' }}>{doc.description}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 12 }}>
          <DocumentStatusBadge status={status} />
          <Icon size={16} style={{ color: 'var(--ink-400)' }}>
            {showDetails ? IconPaths.arrowLeft : IconPaths.arrowRight}
          </Icon>
        </div>
      </div>

      {showDetails && (
        <div style={{ paddingTop: 12, borderTop: '1px solid var(--border-soft)' }}>
          {/* Why Needed */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 6 }}>
              Why we need this:
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-600)', lineHeight: 1.5 }}>
              {doc.whyNeeded}
            </div>
          </div>

          {/* Accepted Formats */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 6 }}>
              Accepted formats:
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-600)' }}>
              {doc.acceptedFormats.join(', ')} (Max {doc.maxFileSize})
            </div>
          </div>

          {/* Validation Checks */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 8 }}>
              What we'll verify:
            </div>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
              }}
            >
              {doc.validationChecks.map((check, idx) => (
                <li
                  key={idx}
                  style={{
                    fontSize: 13,
                    color: 'var(--ink-600)',
                    marginBottom: 8,
                    paddingLeft: 24,
                    position: 'relative',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: 'var(--gold-600)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    ✓
                  </span>
                  <strong>{check.check}:</strong> {check.description}
                </li>
              ))}
            </ul>
          </div>

          {/* Upload Section */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-soft)' }}>
            {status === 'verified' ? (
              <button
                type="button"
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={() => onUpload(doc.id)}
              >
                <Icon size={14} style={{ marginRight: 6 }}>{IconPaths.reload}</Icon>
                Re-upload
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => onUpload(doc.id)}
              >
                <Icon size={14} style={{ marginRight: 6 }}>{IconPaths.upload}</Icon>
                {status === 'uploaded' ? 'Update file' : 'Upload document'}
              </button>
            )}
          </div>

          {/* Status Message */}
          {status === 'rejected' && (
            <div
              style={{
                marginTop: 12,
                padding: 10,
                background: 'rgba(90,15,23,0.08)',
                borderRadius: 6,
                borderLeft: '3px solid var(--maroon-800)',
                fontSize: 12.5,
                color: 'var(--maroon-800)',
              }}
            >
              This document was returned for updates. Please review the feedback and re-upload a corrected version.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Category section
function DocumentCategorySection({ categoryData, documentStatuses, onUpload }) {
  return (
    <Panel title={categoryData.title} action={
      <span style={{ fontSize: 12.5, color: 'var(--ink-600)' }}>
        {categoryData.documents.filter((d) => documentStatuses[d.id] === 'verified').length} of{' '}
        {categoryData.documents.length} completed
      </span>
    }>
      <p style={{ fontSize: 13, color: 'var(--ink-600)', marginBottom: 16 }}>
        {categoryData.description}
      </p>

      {categoryData.documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          doc={doc}
          status={documentStatuses[doc.id] || 'pending'}
          onUpload={onUpload}
        />
      ))}
    </Panel>
  )
}

export function SetupProfilePage() {
  const [documentStatuses, setDocumentStatuses] = useState({
    'business-registration': 'pending',
    'trading-license': 'pending',
    'ownership-proof': 'pending',
    'tax-id': 'pending',
    'bank-account': 'pending',
    'insurance': 'pending',
    'health-permit': 'pending',
    'food-handler-cert': 'pending',
    'inspection-record': 'pending',
    'cold-chain-cert': 'pending',
  })

  const allDocs = getAllDocuments()
  const completedCount = Object.values(documentStatuses).filter((status) => status === 'verified').length
  const completionPercentage = Math.round((completedCount / allDocs.length) * 100)

  const handleUpload = (docId) => {
    // Simulating file upload - in real implementation, this would handle file upload
    alert(`Opening file upload for: ${docId}`)
    // After successful upload, update status
    setDocumentStatuses((prev) => ({
      ...prev,
      [docId]: 'uploaded',
    }))
  }

  return (
    <>
      {/* Progress Overview */}
      <Panel title="Profile Setup Progress">
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-700)' }}>
              Documents Verified
            </span>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold-600)' }}>
              {completedCount} / {allDocs.length}
            </span>
          </div>

          {/* Progress Bar */}
          <div
            style={{
              width: '100%',
              height: 12,
              background: 'var(--border-soft)',
              borderRadius: 6,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${completionPercentage}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--gold-600), var(--sage-600))',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-600)' }}>
            {completionPercentage}% complete
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginTop: 20 }}>
          <StatCard
            icon={IconPaths.check}
            flagText="Verified"
            value={Object.values(documentStatuses).filter((s) => s === 'verified').length}
            label="Documents approved"
          />
          <StatCard
            icon={IconPaths.clock}
            flagText="Pending"
            value={Object.values(documentStatuses).filter((s) => s === 'pending').length}
            label="Awaiting upload"
          />
          <StatCard
            icon={IconPaths.alert}
            flagText="Review"
            value={Object.values(documentStatuses).filter((s) => s === 'rejected').length}
            label="Needs update"
          />
        </div>

        {completionPercentage === 100 && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: 'rgba(92,122,92,0.08)',
              borderRadius: 6,
              borderLeft: '3px solid var(--sage-600)',
              fontSize: 13.5,
              color: 'var(--sage-700)',
            }}
          >
            <strong>✓ All documents submitted!</strong> Our team will review and verify your documents shortly. You'll
            receive an email confirmation once your profile is fully verified.
          </div>
        )}
      </Panel>

      {/* Business Identity Documents */}
      <DocumentCategorySection
        categoryKey="businessIdentity"
        categoryData={DOCUMENT_REQUIREMENTS.businessIdentity}
        documentStatuses={documentStatuses}
        onUpload={handleUpload}
      />

      {/* Tax & Legal Documents */}
      <DocumentCategorySection
        categoryKey="taxLegal"
        categoryData={DOCUMENT_REQUIREMENTS.taxLegal}
        documentStatuses={documentStatuses}
        onUpload={handleUpload}
      />

      {/* Food Safety Compliance Documents */}
      <DocumentCategorySection
        categoryKey="foodSafety"
        categoryData={DOCUMENT_REQUIREMENTS.foodSafety}
        documentStatuses={documentStatuses}
        onUpload={handleUpload}
      />

      {/* Terms & Conditions */}
      <Panel title="Terms & Conditions">
        <div style={{ fontSize: 13, color: 'var(--ink-700)', lineHeight: 1.6 }}>
          <p>
            By submitting these documents, you confirm that:
          </p>
          <ul style={{ marginLeft: 20 }}>
            <li>All documents are authentic and unaltered</li>
            <li>Your business complies with all local food safety regulations</li>
            <li>You have the authority to represent this retail business</li>
            <li>All information provided is accurate and current</li>
          </ul>
          <p style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-600)' }}>
            We take document verification seriously to ensure the safety and quality of the beef supply chain. False or
            fraudulent documents may result in account suspension.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: 16 }}
          disabled={completionPercentage < 100}
        >
          Submit for Final Review
        </button>
      </Panel>
    </>
  )
}

export default SetupProfilePage
