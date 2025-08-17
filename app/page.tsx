'use client';

import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Dashboard from '../components/sections/Dashboard';
import Personnel from '../components/sections/Personnel';
import Departments from '../components/sections/Departments';
import Skills from '../components/sections/Skills';
import Positions from '../components/sections/Positions';
import ThemeControls from '../components/ThemeControls';

// Placeholder components for other sections
function Constraints({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;
  return (
    <section className="page-section active">
      <div className="action-row">
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          בחר מחלקה:
        </label>
        <select style={{ padding: '10px 16px', border: '2px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-secondary)', marginLeft: '12px' }}>
          <option value="">כל המחלקות</option>
        </select>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          שבוע:
        </label>
        <input type="week" style={{ padding: '10px 16px', border: '2px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-secondary)' }} />
      </div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">אילוצים</h2>
        </div>
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          אין אילוצים מוגדרים
        </div>
      </div>
    </section>
  );
}

function Schedule({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;
  return (
    <section className="page-section active">
      <div className="action-row">
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          בחר עמדה:
        </label>
        <select style={{ padding: '10px 16px', border: '2px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-secondary)', marginLeft: '12px' }}>
          <option value="">בחר עמדה</option>
        </select>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          שבוע:
        </label>
        <input type="week" style={{ padding: '10px 16px', border: '2px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-secondary)', marginLeft: '12px' }} />
        <button className="btn btn-success">
          <span>💾</span>
          <span>שמור שבצ״ק</span>
        </button>
      </div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">בניית שבצ״ק</h2>
        </div>
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          בחר עמדה ושבוע כדי להתחיל בבניית שבצ״ק
        </div>
      </div>
    </section>
  );
}

function ViewSchedule({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;
  return (
    <section className="page-section active">
      <div className="action-row">
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          בחר עמדה:
        </label>
        <select style={{ padding: '10px 16px', border: '2px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-secondary)', marginLeft: '12px' }}>
          <option value="">בחר עמדה</option>
        </select>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          שבוע:
        </label>
        <input type="week" style={{ padding: '10px 16px', border: '2px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-secondary)' }} />
      </div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">צפייה בשבצ״ק</h2>
        </div>
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          בחר עמדה ושבוע לצפייה בשבצ״ק
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [activeSection, setActiveSection] = useState('dashboard');

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  return (
    <div className="app-container">
      <Sidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
      
      <main className="main-content">
        <Header />
        
        <div className="content-wrapper">
          {activeSection === 'dashboard' && <Dashboard onSectionChange={handleSectionChange} />}
          <Personnel isActive={activeSection === 'personnel'} />
          <Departments isActive={activeSection === 'departments'} />
          <Positions isActive={activeSection === 'positions'} />
          <Skills isActive={activeSection === 'skills'} />
          <Constraints isActive={activeSection === 'constraints'} />
          <Schedule isActive={activeSection === 'schedule'} />
          <ViewSchedule isActive={activeSection === 'view-schedule'} />
        </div>
      </main>

      <ThemeControls />

      {/* Toast Container */}
      <div className="toast-container" id="toast-container"></div>
    </div>
  );
}