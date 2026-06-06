/**
 * @param {{
 *   user: { name?: string, email: string },
 *   onOpenAiDoctor?: () => void,
 * }} props
 */
export default function DoctorDashboard({ user, onOpenAiDoctor }) {
  return (
    <section className="section portal-section light-background">
      <div className="container">
        <div className="section-title">
          <h2 className="text-dark">Doctor Dashboard</h2>
          <p>Review patient scan activity and access AI-assisted consultation tools.</p>
        </div>

        <div className="row g-4">
          <div className="col-md-4">
            <div className="portal-card h-100">
              <div className="mb-3">
                <i className="bi bi-person-badge text-accent" style={{ fontSize: '2rem' }} aria-hidden="true"></i>
              </div>
              <h5 className="text-dark">Welcome, Dr. {user.name || user.email}</h5>
              <p className="text-muted small mb-0">
                Your doctor account provides access to clinical workflows and AI-assisted triage support.
              </p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="portal-card h-100">
              <h5 className="text-dark">Patient Scans</h5>
              <p className="text-muted small">
                Patient scan review queues will appear here as the platform expands clinical integrations.
              </p>
              <span className="badge bg-secondary">Coming soon</span>
            </div>
          </div>
          <div className="col-md-4">
            <div className="portal-card h-100">
              <h5 className="text-dark">AI Consultation</h5>
              <p className="text-muted small mb-3">
                Launch the AI Doctor voice assistant for guided patient consultation support.
              </p>
              {onOpenAiDoctor && (
                <button type="button" className="btn btn-accent btn-sm" onClick={onOpenAiDoctor}>
                  <i className="bi bi-mic me-1" aria-hidden="true"></i>
                  Open AI Doctor
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
