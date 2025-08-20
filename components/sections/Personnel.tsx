'use client';

import { useState, useEffect } from 'react';
import Modal from '../Modal';

interface PersonnelProps {
  isActive: boolean;
}


interface BulkActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: number[];
  actionType: 'population' | 'department' | 'qualifications' | null;
  onConfirm: (data: any) => void;
}

function BulkActionModal({ isOpen, onClose, selectedIds, actionType, onConfirm }: BulkActionModalProps) {
  const [populations, setPopulations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selectedValue, setSelectedValue] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && actionType) {
      fetchData();
    }
  }, [isOpen, actionType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (actionType === 'population') {
        const response = await fetch('http://localhost:3001/api/populations');
        const data = await response.json();
        setPopulations(data);
      } else if (actionType === 'department') {
        const response = await fetch('http://localhost:3001/api/departments');
        const data = await response.json();
        setDepartments(data);
      } else if (actionType === 'qualifications') {
        const response = await fetch('http://localhost:3001/api/skills');
        const data = await response.json();
        setSkills(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getData = () => {
    return actionType === 'population' ? populations : 
           actionType === 'department' ? departments : skills;
  };

  const handleConfirm = () => {
    if (actionType === 'qualifications') {
      onConfirm({ skillIds: selectedSkills });
    } else {
      const key = actionType + 'Id';
      onConfirm({ [key]: selectedValue });
    }
    handleClose();
  };

  const handleClose = () => {
    setSelectedValue('');
    setSelectedSkills([]);
    onClose();
  };


  if (!isOpen) return null;

  const data = getData();
  const title = actionType === 'population' ? 'הוסף לאוכלוסייה' :
               actionType === 'department' ? 'הוסף למחלקה' :
               'הוסף כשירויות';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--bg-primary)', padding: '24px',
        borderRadius: 'var(--radius)', minWidth: '400px', maxWidth: '500px',
        maxHeight: '80vh', overflowY: 'auto'
      }}>
        <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>
          {title} ({selectedIds.length} נבחרו)
        </h3>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>טוען נתונים...</div>
        ) : (
          <div>
            {actionType === 'qualifications' ? (
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '500', 
                  color: 'var(--text-primary)' 
                }}>
                  בחר כשירויות (ניתן לבחור מספר כשירויות):
                </label>
                <select 
                  multiple 
                  value={selectedSkills.map(String)} 
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => Number(option.value));
                    setSelectedSkills(values);
                  }}
                  style={{
                    width: '100%', 
                    minHeight: '200px',
                    padding: '8px',
                    border: '2px solid rgba(102, 126, 234, 0.3)',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                >
                  {data.map((item: any) => (
                    <option key={item.id} value={item.id} style={{ padding: '8px' }}>
                      {item.name} {item.notes && `- ${item.notes}`}
                    </option>
                  ))}
                </select>
                <div style={{ 
                  fontSize: '12px', 
                  color: 'var(--text-secondary)', 
                  marginTop: '4px' 
                }}>
                  החזק Ctrl/Cmd לבחירת מספר כשירויות
                </div>
              </div>
            ) : (
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '500', 
                  color: 'var(--text-primary)' 
                }}>
                  בחר {actionType === 'population' ? 'אוכלוסייה' : 'מחלקה'}:
                </label>
                <select 
                  value={selectedValue} 
                  onChange={(e) => setSelectedValue(e.target.value)}
                  style={{
                    width: '100%', 
                    padding: '12px',
                    border: '2px solid rgba(102, 126, 234, 0.3)',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                >
                  <option value="">-- בחר {actionType === 'population' ? 'אוכלוסייה' : 'מחלקה'} --</option>
                  {data.map((item: any) => (
                    <option key={item.id} value={item.id}>
                      {item.name} {item.notes && `- ${item.notes}`} {actionType === 'department' && item.member_count !== undefined && `(${item.member_count} חברים)`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        <div style={{ 
          display: 'flex', gap: '12px', justifyContent: 'flex-end',
          marginTop: '20px'
        }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={handleClose}
          >
            ביטול
          </button>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={actionType === 'qualifications' ? selectedSkills.length === 0 : !selectedValue}
          >
            אשר
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Personnel({ isActive }: PersonnelProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'population' | 'department' | 'qualifications' | null>(null);
  const [personnelData, setPersonnelData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch personnel data
  useEffect(() => {
    fetchPersonnelData();
  }, []);

  const fetchPersonnelData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/personnel');
      const data = await response.json();
      setPersonnelData(data);
    } catch (error) {
      console.error('Error fetching personnel:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPersonnelData = personnelData.filter(person => 
    !searchTerm || 
    person.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.personal_number?.includes(searchTerm) ||
    person.department_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.population_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleSelectPerson = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(personId => personId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredPersonnelData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPersonnelData.map(p => p.id));
    }
  };

  const handleBulkAction = (actionType: 'population' | 'department' | 'qualifications') => {
    if (selectedIds.length === 0) {
      setSuccessMessage('יש לבחור לפחות תיק אישי אחד');
      setTimeout(() => setSuccessMessage(''), 3000);
      return;
    }
    setBulkActionType(actionType);
    setShowBulkModal(true);
  };

  const handleBulkConfirm = async (data: any) => {
    try {
      let url = 'http://localhost:3001/api/personnel/batch/';
      let payload: any = { ids: selectedIds };
      
      if (bulkActionType === 'population') {
        url += 'population';
        payload.populationId = data.populationId;
      } else if (bulkActionType === 'department') {
        url += 'department';
        payload.departmentId = data.departmentId;
      } else if (bulkActionType === 'qualifications') {
        url = 'http://localhost:3001/api/personnel/batch-skills';
        payload.skillIds = data.skillIds;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        setSuccessMessage('הפעולה בוצעה בהצלחה');
        setTimeout(() => setSuccessMessage(''), 3000);
        setSelectedIds([]);
        // Refresh personnel data to show updates immediately
        await fetchPersonnelData();
      } else {
        const errorData = await response.json();
        setSuccessMessage(`שגיאה: ${errorData.error || 'שגיאה בביצוע הפעולה'}`);
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error:', error);
      setSuccessMessage('שגיאה בביצוע הפעולה');
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  const handleExportToExcel = () => {
    const dataToExport = filteredPersonnelData.map(person => ({
      'שם מלא': person.full_name,
      'מספר אישי': person.personal_number,
      'דרגה': person.rank,
      'מחלקה': person.department_name || '',
      'אוכלוסייה': person.population_name || '',
      'כשירויות': person.skills ? person.skills.map((skill: any) => skill.name || skill).join(', ') : ''
    }));
    
    // Convert to CSV format
    const headers = Object.keys(dataToExport[0] || {});
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');
    
    // Create and download file
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `תיקים_אישיים_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSuccessMessage('הנתונים יוצאו בהצלחה');
    setTimeout(() => setSuccessMessage(''), 3000);
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
          <button className="btn btn-secondary" onClick={handleExportToExcel}>
            <span>📊</span>
            <span>ייצא לאקסל</span>
          </button>
          
          {selectedIds.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', marginRight: 'auto' }}>
              <button 
                className="btn btn-accent" 
                onClick={() => handleBulkAction('population')}
              >
                הוסף לאוכלוסייה ({selectedIds.length})
              </button>
              <button 
                className="btn btn-accent" 
                onClick={() => handleBulkAction('department')}
              >
                הוסף למחלקה ({selectedIds.length})
              </button>
              <button 
                className="btn btn-accent" 
                onClick={() => handleBulkAction('qualifications')}
              >
                הוסף כשירויות ({selectedIds.length})
              </button>
            </div>
          )}
        </div>

        {successMessage && (
          <div style={{
            padding: '12px',
            marginBottom: '16px',
            backgroundColor: successMessage.includes('שגיאה') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
            border: `1px solid ${successMessage.includes('שגיאה') ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
            borderRadius: 'var(--radius)',
            color: successMessage.includes('שגיאה') ? '#dc2626' : '#16a34a',
            fontSize: '14px'
          }}>
            {successMessage}
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">תיקים אישיים</h2>
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input 
                type="text" 
                placeholder="חיפוש לפי שם, מספר אישי או מחלקה..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <input 
                    type="checkbox" 
                    checked={filteredPersonnelData.length > 0 && selectedIds.length === filteredPersonnelData.length}
                    onChange={handleSelectAll}
                  />
                </th>
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
              {loading && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>
                    טוען נתונים...
                  </td>
                </tr>
              )}
              {!loading && filteredPersonnelData.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>
                    {searchTerm ? 'לא נמצאו תוצאות' : 'אין תיקים אישיים'}
                  </td>
                </tr>
              )}
              {!loading && filteredPersonnelData.length > 0 && filteredPersonnelData.map((person) => (
                  <tr key={person.id}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(person.id)}
                        onChange={() => handleSelectPerson(person.id)}
                      />
                    </td>
                    <td>{person.full_name}</td>
                    <td>{person.personal_number}</td>
                    <td>{person.rank}</td>
                    <td>{person.department_name || '-'}</td>
                    <td>{person.population_name || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {person.skills && person.skills.length > 0 ? (
                          person.skills.map((skill: any, index: number) => (
                            <span
                              key={index}
                              style={{
                                padding: '4px 8px',
                                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                                borderRadius: '12px',
                                fontSize: '11px',
                                color: '#667eea',
                                border: '1px solid rgba(102, 126, 234, 0.3)',
                              }}
                            >
                              {skill.name || skill}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>-</span>
                        )}
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
      
      <BulkActionModal 
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        selectedIds={selectedIds}
        actionType={bulkActionType}
        onConfirm={handleBulkConfirm}
      />
    </>
  );
}