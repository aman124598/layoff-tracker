import './index.css';
import { Dashboard } from './pages/Dashboard';
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <>
      <Dashboard />
      <Analytics />
    </>
  );
}

export default App;
