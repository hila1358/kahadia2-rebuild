'use client';

export default function Header() {
  return (
    <header className="header">
      <h1 className="header-title">מערכת ניהול שבצ״ק</h1>
      <div className="header-actions">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="חיפוש..." />
        </div>
        <button className="btn-icon">🔔</button>
        <button className="btn-icon">👤</button>
      </div>
    </header>
  );
}