'use client';

import '../styles/globals.css';
import { useEffect } from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Set RTL direction
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'he';
  }, []);

  return (
    <html dir="rtl" lang="he">
      <head>
        <title>קה״דיה - מערכת ניהול שבצ״ק</title>
        <meta name="description" content="מערכת ניהול שבצ״ק ומשמרות" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}