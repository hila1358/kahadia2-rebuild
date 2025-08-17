'use client';

import { useState } from 'react';
import Modal from '../Modal';

interface PersonnelProps {
  isActive: boolean;
}

const personnelData = [
  {
    id: 1,
    fullName: 'דוד ישראלי',
    personalNumber: '1234567',
    rank: 'רב״ט',
    department: 'מוקד תקשורת',
    population: 'חובה',
    skills: ['תקשורת', 'נהיגה']
  },
  {
    id: 2,
    fullName: 'שרה כהן',
    personalNumber: '1234568',
    rank: 'סמל',
    department: 'חמ״ל מבצעים',
    population: 'קבע',
    skills: ['מבצעים', 'רפואה']
  },
  {
    id: 3,
    fullName: 'יוסי לוי',
    personalNumber: '1234569',
    rank: 'סמ״ר',
    department: 'אבטחת מידע',
    population: 'קבע',
    skills: ['סייבר', 'מחשבים']
  }
];

export default function Personnel({ isActive }: PersonnelProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);

  const handleAddPerson = () => {
    setSelectedPerson(null);
    setShowModal(true);
  };

  const handleEditPerson = (person: any) => {
    setSelectedPerson(person);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPerson(null);
  };

  const modalContent = (
    <form>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          שם מלא *
        </label>
        <input
          type="text"
          style={{
            width: '100%',
            padding: '10px 16px',
            border: '2px solid var(--border)',
            borderRadius: 'var(--radius)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
          }}
          defaultValue={selectedPerson?.fullName || ''}
        />
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          מספר אישי *
        </label>
        <input
          type="text"
          style={{
            width: '100%',
            padding: '10px 16px',
            border: '2px solid var(--border)',
            borderRadius: 'var(--radius)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
          }}
          defaultValue={selectedPerson?.personalNumber || ''}
        />
      </div>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
        <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
          ביטול
        </button>
        <button type="submit" className="btn btn-primary">
          {selectedPerson ? 'עדכן' : 'הוסף'} תיק אישי
        </button>
      </div>
    </form>
  );

  if (!isActive) return null;

  return (
    <>
      <section className="page-section active">
        <div className="action-row">
          <button className="btn btn-primary" onClick={handleAddPerson}>
            <span>➕</span>
            <span>הוסף תיק אישי</span>
          </button>
          <button className="btn btn-secondary">
            <span>📊</span>
            <span>ייצא נתונים</span>
          </button>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">תיקים אישיים</h2>
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input type="text" placeholder="חיפוש לפי שם, מספר אישי או מחלקה..." />
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>שם מלא</th>
                <th>מספר אישי</th>
                <th>דרגה</th>
                <th>מחלקה</th>
                <th>אוכלוסייה</th>
                <th>כשירויות</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {personnelData.map((person) => (
                <tr key={person.id}>
                  <td>{person.fullName}</td>
                  <td>{person.personalNumber}</td>
                  <td>{person.rank}</td>
                  <td>{person.department}</td>
                  <td>{person.population}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                      {person.skills.map((skill, index) => (
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
                          {skill}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <button className="btn-icon" onClick={() => handleEditPerson(person)}>✏️</button>
                    <button className="btn-icon">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={selectedPerson ? 'עריכת תיק אישי' : 'הוספת תיק אישי חדש'}
      >
        {modalContent}
      </Modal>
    </>
  );
}