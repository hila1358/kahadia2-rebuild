'use client';

interface DashboardProps {
  onSectionChange: (section: string) => void;
}

export default function Dashboard({ onSectionChange }: DashboardProps) {
  return (
    <section id="dashboard" className="page-section active">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">247</div>
          <div className="stat-label">סה״כ אנשי צוות</div>
          <span className="stat-change positive">↑ 12% מהחודש שעבר</span>
        </div>
        <div className="stat-card">
          <div className="stat-value">18</div>
          <div className="stat-label">עמדות פעילות</div>
          <span className="stat-change positive">↑ 2 עמדות חדשות</span>
        </div>
        <div className="stat-card">
          <div className="stat-value">94%</div>
          <div className="stat-label">שיעור איוש</div>
          <span className="stat-change positive">↑ 3% השבוע</span>
        </div>
        <div className="stat-card">
          <div className="stat-value">7</div>
          <div className="stat-label">אילוצים השבוע</div>
          <span className="stat-change negative">↓ 2 מהשבוע שעבר</span>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">שיבוצים קרובים</h2>
          <button className="btn btn-primary" onClick={() => onSectionChange('schedule')}>
            <span>➕</span>
            <span>שיבוץ חדש</span>
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>עמדה</th>
              <th>תאריך</th>
              <th>משמרת</th>
              <th>משובץ</th>
              <th>סטטוס</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>מוקד תקשורת</td>
              <td>13.08.2025</td>
              <td>08:00 - 14:00</td>
              <td>דוד ישראלי</td>
              <td><span className="status-badge status-active">מאושר</span></td>
              <td>
                <button className="btn-icon">✏️</button>
                <button className="btn-icon">🗑️</button>
              </td>
            </tr>
            <tr>
              <td>חמ״ל מבצעים</td>
              <td>13.08.2025</td>
              <td>14:00 - 20:00</td>
              <td>שרה כהן</td>
              <td><span className="status-badge status-pending">ממתין</span></td>
              <td>
                <button className="btn-icon">✏️</button>
                <button className="btn-icon">🗑️</button>
              </td>
            </tr>
            <tr>
              <td>אבטחת מידע</td>
              <td>14.08.2025</td>
              <td>20:00 - 08:00</td>
              <td>-</td>
              <td><span className="status-badge status-inactive">לא משובץ</span></td>
              <td>
                <button className="btn-icon">➕</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">אילוצים השבוע</h2>
          <button className="btn btn-secondary" onClick={() => onSectionChange('constraints')}>
            <span>👁️</span>
            <span>צפה בכל האילוצים</span>
          </button>
        </div>
        <div id="weeklyConstraintsPreview">
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            טוען נתוני אילוצים...
          </div>
        </div>
      </div>
    </section>
  );
}