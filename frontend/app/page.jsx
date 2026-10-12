'use client';

import dynamic from 'next/dynamic';

// Dynamic import with ssr: false ensures full client-side compatibility with localStorage and browser APIs
const App = dynamic(() => import('../src/App'), { ssr: false });

export default function HomePage() {
  return <App />;
}
