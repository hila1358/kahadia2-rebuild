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
  const [searchTerm, setSearchTerm] = useState('');
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

  const getFilteredData = () => {
    const data = actionType === 'population' ? populations : 
                actionType === 'department' ? departments : skills;
    
    if (!searchTerm) return data;
    
    return data.filter((item: any) => 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
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
    setSearchTerm('');
    setSelectedValue('');
    setSelectedSkills([]);
    onClose();
  };

  const toggleSkillSelection = (skillId: number) => {
    setSelectedSkills(prev => 
      prev.includes(skillId) 
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  if (!isOpen) return null;

  const filteredData = getFilteredData();
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
        
        <div style={{ 
          padding: '12px', 
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius)',
          marginBottom: '16px',
          fontSize: '14px',
          color: '#dc2626',
          fontWeight: '500'
        }}>
          ⚠️ בחירה בלבד מהרשימה הקיימת - אין אפשרות להוסיף פריטים חדשים
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: '500', 
            color: 'var(--text-secondary)' 
          }}>
            🔍 סינון הרשימה (חיפוש בלבד):
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder={`הקלד לסינון ${actionType === 'population' ? 'אוכלוסיות קיימות' : actionType === 'department' ? 'מחלקות קיימות' : 'כשירויות קיימות'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px 8px 36px',
                border: '2px solid rgba(102, 126, 234, 0.3)',
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '14px'
              }}
            />
            <span style={{
              position: 'absolute', left: '12px', top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-secondary)',
              fontSize: '16px'
            }}>
              🔍
            </span>
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: 'var(--text-secondary)', 
            marginTop: '4px',
            fontStyle: 'italic'
          }}>
            סינון בלבד - לא ניתן ליצור פריטים חדשים
          </div>
        </div>

        <div style={{ 
          padding: '12px', 
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: 'var(--radius)',
          marginBottom: '16px',
          fontSize: '14px',
          color: '#16a34a'
        }}>
          {actionType === 'qualifications' 
            ? '☑️ בחר כשירויות מהרשימה למטה (ניתן לבחור מספר כשירויות):'
            : `🔘 בחר ${actionType === 'population' ? 'אוכלוסייה אחת' : 'מחלקה אחת'} מהרשימה למטה:`
          }
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>טוען פריטים קיימים...</div>
        ) : (
          <div>
            <div style={{ 
              fontSize: '13px', 
              fontWeight: '600', 
              color: 'var(--text-primary)', 
              marginBottom: '8px',
              borderBottom: '2px solid rgba(102, 126, 234, 0.2)',
              paddingBottom: '6px'
            }}>
              📋 רשימת {actionType === 'population' ? 'אוכלוסיות' : actionType === 'department' ? 'מחלקות' : 'כשירויות'} קיימות במערכת:
            </div>
            <div style={{ 
              maxHeight: '300px', overflowY: 'auto',
              border: '2px solid rgba(102, 126, 234, 0.3)', 
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--bg-secondary)'
            }}>
            {filteredData.length === 0 ? (
              <div style={{ 
                padding: '20px', 
                textAlign: 'center', 
                color: 'var(--text-secondary)',
                fontStyle: 'italic'
              }}>
                {searchTerm ? 'לא נמצאו תוצאות חיפוש' : 'אין פריטים זמינים'}
              </div>
            ) : (
              filteredData.map((item: any) => (
                <div 
                  key={item.id} 
                  style={{
                    padding: '12px', 
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    backgroundColor: (
                      actionType === 'qualifications' 
                        ? selectedSkills.includes(item.id)
                        : selectedValue === item.id
                    ) ? 'rgba(102, 126, 234, 0.15)' : 'transparent',
                    transition: 'background-color 0.2s ease',
                    ':hover': {
                      backgroundColor: 'rgba(102, 126, 234, 0.08)'
                    }
                  }}
                  onClick={() => {
                    if (actionType === 'qualifications') {
                      toggleSkillSelection(item.id);
                    } else {
                      setSelectedValue(item.id);
                    }
                  }}
                  onMouseEnter={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    if (!(actionType === 'qualifications' ? selectedSkills.includes(item.id) : selectedValue === item.id)) {
                      target.style.backgroundColor = 'rgba(102, 126, 234, 0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    if (!(actionType === 'qualifications' ? selectedSkills.includes(item.id) : selectedValue === item.id)) {
                      target.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {actionType === 'qualifications' ? (
                      <input
                        type="checkbox"
                        checked={selectedSkills.includes(item.id)}
                        onChange={() => toggleSkillSelection(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ 
                          cursor: 'pointer', 
                          width: '16px', 
                          height: '16px' 
                        }}
                      />
                    ) : (
                      <input
                        type="radio"
                        name="selection"
                        checked={selectedValue === item.id}
                        onChange={() => setSelectedValue(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ 
                          cursor: 'pointer', 
                          width: '16px', 
                          height: '16px' 
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontWeight: '500', 
                        color: 'var(--text-primary)',
                        marginBottom: '4px'
                      }}>
                        {item.name}
                      </div>
                      {item.notes && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: 'var(--text-secondary)',
                          lineHeight: '1.4'
                        }}>
                          {item.notes}
                        </div>
                      )}
                      {actionType === 'department' && item.member_count !== undefined && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: 'var(--text-secondary)',
                          marginTop: '2px'
                        }}>
                          👥 {item.member_count} חברים
                        </div>
                      )}
                      {actionType === 'population' && item.person_count !== undefined && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: 'var(--text-secondary)',
                          marginTop: '2px'
                        }}>
                          👥 {item.person_count} אנשים
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            </div>
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