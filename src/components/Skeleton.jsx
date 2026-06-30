// Initial-load skeleton screen (shown for ~500ms simulated delay).
export default function Skeleton() {
  return (
    <div className="page-wrap" aria-hidden="true">
      <div className="skel skel-box" style={{ height: 300, marginBottom: 20 }} />
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skel skel-box" style={{ height: 110 }} />
        ))}
      </div>
      <div className="dash-cols">
        <div>
          <div className="skel skel-line" style={{ width: '40%', height: 22 }} />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skel skel-box" style={{ height: 120, marginBottom: 14 }} />
          ))}
        </div>
        <div>
          <div className="skel skel-line" style={{ width: '50%', height: 22 }} />
          <div className="skel skel-box" style={{ height: 360 }} />
        </div>
      </div>
    </div>
  )
}
