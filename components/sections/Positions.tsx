'use client';

import { useState } from 'react';

interface PositionsProps {
  isActive: boolean;
}

const positionsData = [
  {
    id: 1,
    name: 'מוקד תקשורת',
    roles: ['מפעיל ראשי', 'מפעיל משני'],
    requiredSkills: [
      { name: 'תקשורת', mandatory: true },
      { name: 'נהיגה', mandatory: false }
    ]
  },
  {
    id: 2,
    name: 'חמ״ל מבצעים',
    roles: ['קצין מבצעים', 'רפואי'],
    requiredSkills: [
      { name: 'מבצעים', mandatory: true },
      { name: 'רפואה', mandatory: true }
    ]
  },
  {
    id: 3,
    name: 'אבטחת מידע',
    roles: ['אנליסט סייבר'],
    requiredSkills: [
      { name: 'סייבר', mandatory: true },
      { name: 'מחשבים', mandatory: false }
    ]
  }
];

export default function Positions({ isActive }: PositionsProps) {
  const [positions] = useState(positionsData);

  if (!isActive) return null;

  return (
    <section className="page-section active">
      <div className="action-row">
        <button className="btn btn-primary">
          <span>➕</span>
          <span>הוסף עמדה</span>
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">עמדות ותפקידנים</h2>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>שם עמדה</th>
              <th>תפקידנים</th>
              <th>כשירויות נדרשות</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => (
              <tr key={position.id}>
                <td>{position.name}</td>
                <td>{position.roles.join(', ')}</td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                    {position.requiredSkills.map((skill, index) => (
                      <span
                        key={index}
                        style={{
                          padding: '6px 12px',
                          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                          borderRadius: '20px',
                          fontSize: '12px',
                          color: '#667eea',
                          border: '1px solid rgba(102, 126, 234, 0.3)',
                        }}
                      >
                        {skill.name}{skill.mandatory ? ' *' : ''}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <button className="btn-icon">✏️</button>
                  <button className="btn-icon">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}