'use client';

import { useState } from 'react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { id: 'dashboard', icon: '📊', label: 'לוח בקרה' },
  { id: 'personnel', icon: '👥', label: 'תיקים אישיים' },
  { id: 'departments', icon: '🏢', label: 'מחלקות' },
  { id: 'positions', icon: '💼', label: 'עמדות ותפקידנים' },
  { id: 'skills', icon: '🎯', label: 'כשירויות' },
  { id: 'constraints', icon: '⚠️', label: 'אילוצים' },
  { id: 'schedule', icon: '📅', label: 'שיבוצים' },
  { id: 'view-schedule', icon: '👁️', label: 'צפייה בשבצ״ק' },
];

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} id="sidebar">
      <div className="logo">
        <div className="logo-icon">📋</div>
        {!collapsed && <span id="logo-text">קה״דיה</span>}
      </div>
      <nav className="nav-menu">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => onSectionChange(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </div>
        ))}
      </nav>
    </aside>
  );
}