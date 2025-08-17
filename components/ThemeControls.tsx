'use client';

import { useState, useEffect } from 'react';

export default function ThemeControls() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
      document.body.dataset.theme = savedTheme;
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    document.body.dataset.theme = newTheme;
    localStorage.setItem('theme', newTheme);
  };

  return (
    <>
      {/* Theme Toggle */}
      <div className="theme-toggle">
        <button className="theme-toggle-btn" onClick={toggleTheme}>
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Floating Action Button */}
      <button className="fab">➕</button>
    </>
  );
}