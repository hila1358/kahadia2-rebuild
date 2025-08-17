'use client';

import { useState } from 'react';

interface DepartmentsProps {
  isActive: boolean;
}

const departmentData = [
  {
    id: 1,
    name: 'מוקד תקשורת',
    commander: 'דוד ישראלי',
    personnelCount: 15,
    notes: 'מוקד תקשורת ראשי 24/7'
  },
  {
    id: 2,
    name: 'חמ״ל מבצעים',
    commander: 'שרה כהן',
    personnelCount: 8,
    notes: 'חדר מצב מבצעי'
  },
  {
    id: 3,
    name: 'אבטחת מידע',
    commander: 'יוסי לוי',
    personnelCount: 12,
    notes: 'יחידת סייבר ואבטחת מידע'
  },
  {
    id: 4,
    name: 'מודיעין',
    commander: 'לא מוגדר',
    personnelCount: 6,
    notes: 'איסוף וניתוח מודיעין'
  }
];

export default function Departments({ isActive }: DepartmentsProps) {
  const [departments] = useState(departmentData);

  if (!isActive) return null;

  return (
    <section className="page-section active">
      <div className="action-row">
        <button className="btn btn-primary">
          <span>➕</span>
          <span>הוסף מחלקה</span>
        </button>
      </div>

      <div>
        {departments.map((dept) => (
          <div key={dept.id} className="department-card">
            <div className="department-header">
              <div className="department-name">{dept.name}</div>
              <div className="department-count">{dept.personnelCount} אנשים</div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <p><strong>מפקד מחלקה:</strong> {dept.commander}</p>
              {dept.notes && <p><strong>הערות:</strong> {dept.notes}</p>}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary">עריכה</button>
              <button className="btn btn-danger">מחיקה</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Add department card styles to globals.css if not already present
const departmentCardStyles = `
.department-card {
  background: var(--bg-primary);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow);
  margin-bottom: 16px;
  transition: all 0.3s ease;
  border-right: 4px solid transparent;
}

.department-card:hover {
  transform: translateX(-4px);
  border-right-color: #667eea;
  box-shadow: var(--shadow-lg);
}

.department-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.department-name {
  font-size: 18px;
  font-weight: 600;
}

.department-count {
  background: var(--bg-tertiary);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  color: var(--text-secondary);
}
`;