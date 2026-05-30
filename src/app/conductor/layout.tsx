'use client';

import { useEffect, useState } from 'react';

export default function ConductorLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <div className="lc-admin-app">
      <style>{STYLES}</style>
      <div className="lc-admin-body">
        {children}
      </div>
    </div>
  );
}

const STYLES = `
  .lc-admin-app {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    max-height: 100dvh;
    background: #F5F7FA;
    max-width: 430px;
    margin: 0 auto;
    font-family: var(--font-body);
    position: relative;
    overflow: hidden;
  }

  .lc-admin-body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
  }
`;
