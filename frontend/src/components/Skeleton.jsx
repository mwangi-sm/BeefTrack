import './Skeleton.css';

export function SkeletonText({ lines = 1, width }) {
  return (
    <div className="skeleton-text-container" style={width ? { width } : undefined}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className="skeleton skeleton-text"
          style={i === lines - 1 && lines > 1 ? { width: '70%' } : undefined}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-circle" style={{ marginBottom: 12 }} />
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text" style={{ width: '80%' }} />
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="skeleton-stat-card">
      <div className="skeleton-top-row">
        <div className="skeleton skeleton-circle" />
        <div className="skeleton skeleton-text" style={{ width: 60, height: 20 }} />
      </div>
      <div className="skeleton skeleton-text" style={{ height: 32, width: '60%', marginTop: 16 }} />
      <div className="skeleton skeleton-text" style={{ height: 14, width: '80%' }} />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="skeleton-table">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton skeleton-row">
          <div className="skeleton skeleton-circle" />
          <div className="skeleton skeleton-text" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="skeleton-dashboard">
      <div className="skeleton-stat-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStat key={i} />
        ))}
      </div>
      <div className="skeleton-panel-grid">
        <div className="skeleton-panel">
          <div className="skeleton skeleton-title" />
          <SkeletonTable rows={4} />
        </div>
        <div className="skeleton-panel">
          <div className="skeleton skeleton-title" />
          <SkeletonTable rows={4} />
        </div>
      </div>
    </div>
  );
}
