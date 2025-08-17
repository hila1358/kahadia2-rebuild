'use client';

import { useState } from 'react';

interface SkillsProps {
  isActive: boolean;
}

const skillsData = [
  { id: 1, name: 'תקשורת', certifiedCount: 25, notes: 'הפעלת מערכות תקשורת' },
  { id: 2, name: 'סייבר', certifiedCount: 8, notes: 'אבטחת מידע וסייבר' },
  { id: 3, name: 'מבצעים', certifiedCount: 15, notes: 'תכנון וביצוע מבצעים' },
  { id: 4, name: 'לוגיסטיקה', certifiedCount: 12, notes: 'ניהול אספקה ותחזוקה' },
  { id: 5, name: 'מודיעין', certifiedCount: 6, notes: 'איסוף וניתוח מודיעין' },
  { id: 6, name: 'רפואה', certifiedCount: 4, notes: 'עזרה ראשונה ורפואה' }
];

export default function Skills({ isActive }: SkillsProps) {
  const [skills] = useState(skillsData);

  if (!isActive) return null;

  return (
    <section className="page-section active">
      <div className="action-row">
        <button className="btn btn-primary">
          <span>➕</span>
          <span>הוסף כשירות</span>
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">כשירויות</h2>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>שם כשירות</th>
              <th>מספר מוסמכים</th>
              <th>הערות</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {skills.map((skill) => (
              <tr key={skill.id}>
                <td>{skill.name}</td>
                <td>{skill.certifiedCount}</td>
                <td>{skill.notes}</td>
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