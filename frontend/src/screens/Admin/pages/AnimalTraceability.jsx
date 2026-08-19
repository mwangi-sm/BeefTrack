import { useState } from "react";
import { DashHead } from "../../../components/DashHead";
import { Panel, LoadingState, ErrorState, EmptyState, DetailRow } from "../../../components/DashboardBits";
import { Icon, IconPaths } from "../../../components/icons";
import { fetchAnimalTraceability } from "../services/adminApi";

function fmt(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? dateStr : d.toLocaleString();
}

function StageCard({ icon, title, empty, children }) {
  return (
    <Panel title={title}>
      {children || <EmptyState icon={icon} title={empty} />}
    </Panel>
  );
}

export function AnimalTraceability() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function runSearch(q) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setSubmittedQuery(trimmed);
    setStatus("loading");
    setErrorMessage("");
    setResult(null);
    try {
      const data = await fetchAnimalTraceability(trimmed);
      setResult(data);
      setStatus("ready");
    } catch (err) {
      setErrorMessage(err.message || "Couldn't load traceability for that ID.");
      setStatus("error");
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    runSearch(query);
  }

  return (
    <>
      <DashHead
        greeting="Admin control panel"
        title="Animal Traceability"
        subtitle="Look up any animal's full farm-to-consumer chain of custody."
      />

      <Panel title="Search">
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. BT-000245 or RFID-000245"
            style={{
              flex: 1,
              padding: "11px 14px",
              borderRadius: 10,
              border: "1.5px solid var(--border-soft)",
              background: "var(--page-bg)",
              color: "var(--ink-900)",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 13.5,
            }}
          />
          <button type="submit" className="btn btn-primary" disabled={status === "loading" || !query.trim()}>
            <Icon size={16}>{IconPaths.search}</Icon>
            {status === "loading" ? "Searching…" : "Search"}
          </button>
        </form>
      </Panel>

      {status === "loading" && <LoadingState label={`Looking up ${submittedQuery}…`} />}

      {status === "error" && (
        <ErrorState message={errorMessage} onRetry={() => runSearch(submittedQuery)} />
      )}

      {status === "idle" && (
        <EmptyState
          icon={IconPaths.search}
          title="Enter a BeefTrace ID or RFID tag to begin"
          subtitle="Results will show the animal's complete history across every stage of the supply chain."
        />
      )}

      {status === "ready" && result && (
        <>
          <Panel title={`Animal — ${result.animal?.tagId || submittedQuery}`}>
            <DetailRow label="BeefTrace ID" value={result.animal?.tagId} />
            <DetailRow label="RFID tag" value={result.animal?.rfid} />
            <DetailRow label="Breed" value={result.animal?.breed} />
            <DetailRow label="Gender" value={result.animal?.gender} />
            <DetailRow label="Date of birth" value={fmt(result.animal?.dob)} />
            <DetailRow label="Current status" value={result.animal?.status} />
          </Panel>

          <div className="grid-2col">
            <StageCard icon={IconPaths.farm} title="Farm of origin" empty="No farm record on file">
              {result.farm && (
                <>
                  <DetailRow label="Farm" value={result.farm.name} />
                  <DetailRow label="Owner" value={result.farm.owner} />
                  <DetailRow label="County" value={result.farm.county} />
                  <DetailRow label="Sub-county" value={result.farm.subCounty} />
                </>
              )}
            </StageCard>

            <StageCard icon={IconPaths.abattoir} title="Slaughter" empty="Not yet slaughtered">
              {result.slaughter && (
                <>
                  <DetailRow label="Slaughterhouse" value={result.slaughter.slaughterhouse} />
                  <DetailRow label="Carcass ID" value={result.slaughter.carcassId} />
                  <DetailRow label="Date" value={fmt(result.slaughter.date)} />
                  <DetailRow label="Grade" value={result.slaughter.grade} />
                </>
              )}
            </StageCard>
          </div>

          <Panel title="Health records">
            {result.healthRecords?.length ? (
              result.healthRecords.map((rec) => (
                <div key={rec.id} className="activity-item">
                  <span className="activity-dot"></span>
                  <div>
                    <div className="activity-text">
                      {rec.weightKg ? `${rec.weightKg} kg — ` : ""}
                      {rec.healthStatus || "No status recorded"}
                    </div>
                    <div className="activity-time">{fmt(rec.date)}</div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState icon={IconPaths.health} title="No health records on file" />
            )}
          </Panel>

          <Panel title="Veterinary visits">
            {result.vetVisits?.length ? (
              result.vetVisits.map((visit) => (
                <div key={visit.id} className="activity-item">
                  <span className="activity-dot"></span>
                  <div>
                    <div className="activity-text">
                      <b>{visit.vetName || "Unknown vet"}</b>
                      {visit.disease ? ` — ${visit.disease}` : ""}
                      {visit.treatment ? ` (${visit.treatment})` : ""}
                    </div>
                    <div className="activity-time">{fmt(visit.date)}</div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState icon={IconPaths.syringe} title="No veterinary visits on file" />
            )}
          </Panel>

          <Panel title="Transport history">
            {result.transport?.length ? (
              result.transport.map((trip) => (
                <div key={trip.id} className="activity-item">
                  <span className="activity-dot"></span>
                  <div>
                    <div className="activity-text">
                      <b className="mono">{trip.tripCode}</b> — {trip.transporter || "Unknown transporter"}
                      <br />
                      {trip.origin || "?"} → {trip.destination || "?"}
                    </div>
                    <div className="activity-time">
                      Departed {fmt(trip.departedAt)} · Arrived {fmt(trip.arrivedAt)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState icon={IconPaths.truck} title="No transport trips on file" />
            )}
          </Panel>

          <div className="grid-2col">
            <StageCard icon={IconPaths.cut} title="Processing" empty="Not yet processed">
              {result.processing && (
                <>
                  <DetailRow label="Processor" value={result.processing.processor} />
                  <DetailRow label="Cut type" value={result.processing.cutType} />
                  <DetailRow label="Weight" value={result.processing.weightKg ? `${result.processing.weightKg} kg` : "—"} />
                  <DetailRow label="Batch code" value={result.processing.batchCode} />
                  <DetailRow label="Packaged" value={fmt(result.processing.packagedAt)} />
                </>
              )}
            </StageCard>

            <StageCard icon={IconPaths.warehouse} title="Distribution" empty="Not yet distributed">
              {result.distribution && (
                <>
                  <DetailRow label="Distributor" value={result.distribution.distributor} />
                  <DetailRow label="Shipment ID" value={result.distribution.shipmentId} />
                  <DetailRow label="Shipped" value={fmt(result.distribution.shippedAt)} />
                  <DetailRow label="Status" value={result.distribution.status} />
                </>
              )}
            </StageCard>
          </div>

          <div className="grid-2col">
            <StageCard icon={IconPaths.storefront} title="Retail" empty="Not yet received by a retailer">
              {result.retail && (
                <>
                  <DetailRow label="Retailer" value={result.retail.retailer} />
                  <DetailRow label="Received" value={fmt(result.retail.receivedAt)} />
                  <DetailRow label="Verification" value={result.retail.verificationStatus} />
                </>
              )}
            </StageCard>

            <StageCard icon={IconPaths.qr} title="Consumer scans" empty="No consumer scans yet">
              {result.consumerScans?.length ? (
                result.consumerScans.map((scan) => (
                  <div key={scan.id} className="activity-item">
                    <span className="activity-dot"></span>
                    <div>
                      <div className="activity-text">QR code scanned</div>
                      <div className="activity-time">{fmt(scan.scannedAt)}</div>
                    </div>
                  </div>
                ))
              ) : null}
            </StageCard>
          </div>
        </>
      )}

      {status === "ready" && !result && (
        <EmptyState
          icon={IconPaths.search}
          title="No animal found"
          subtitle={`Nothing matched "${submittedQuery}". Check the ID and try again.`}
        />
      )}
    </>
  );
}

export default AnimalTraceability;