import './FarmerDashboardSkeleton.css'

function SkeletonBlock({ className = '' }) {
  return <span className={`farmer-skeleton-block ${className}`} aria-hidden="true" />
}

export function FarmerDashboardSkeleton() {
  return (
    <div className="farmer-dashboard-skeleton" aria-label="Loading dashboard data">
      <div className="stat-grid">
        {[1, 2, 3, 4].map((item) => (
          <div className="stat-card farmer-skeleton-stat" key={item}>
            <div className="farmer-skeleton-stat-head">
              <SkeletonBlock className="farmer-skeleton-icon" />
              <SkeletonBlock className="farmer-skeleton-flag" />
            </div>
            <SkeletonBlock className="farmer-skeleton-value" />
            <SkeletonBlock className="farmer-skeleton-label" />
          </div>
        ))}
      </div>

      <div className="grid-2col">
        <div>
          <div className="panel farmer-skeleton-panel">
            <div className="farmer-skeleton-panel-head"><SkeletonBlock className="farmer-skeleton-title" /><SkeletonBlock className="farmer-skeleton-link" /></div>
            <SkeletonBlock className="farmer-skeleton-line" />
            <SkeletonBlock className="farmer-skeleton-line short" />
          </div>
          <div className="panel farmer-skeleton-panel">
            <div className="farmer-skeleton-panel-head"><SkeletonBlock className="farmer-skeleton-title" /><SkeletonBlock className="farmer-skeleton-link" /></div>
            <SkeletonBlock className="farmer-skeleton-line" />
            <SkeletonBlock className="farmer-skeleton-line short" />
          </div>
        </div>

        <div>
          <div className="panel farmer-skeleton-panel farm-list">
            <div className="farmer-skeleton-panel-head"><SkeletonBlock className="farmer-skeleton-title" /><SkeletonBlock className="farmer-skeleton-link" /></div>
            {[1, 2].map((item) => (
              <div className="farmer-skeleton-farm" key={item}>
                <SkeletonBlock className="farmer-skeleton-farm-icon" />
                <span className="farmer-skeleton-farm-copy"><SkeletonBlock /><SkeletonBlock className="short" /></span>
              </div>
            ))}
          </div>
          <div className="panel farmer-skeleton-panel">
            <div className="farmer-skeleton-panel-head"><SkeletonBlock className="farmer-skeleton-title" /><SkeletonBlock className="farmer-skeleton-link" /></div>
            <SkeletonBlock className="farmer-skeleton-line" />
          </div>
        </div>
      </div>
    </div>
  )
}
