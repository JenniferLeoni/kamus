import { createRoot } from 'react-dom/client';
import { setBaseUrl } from '@workspace/api-client-react';

import App from './App';

import './index.css';

// When deployed on Netlify (or any host without a co-located API server),
// set VITE_API_BASE_URL to the full base URL of the API, e.g.:
//   https://your-replit-api.replit.app/api
// Leave it unset (or empty) when running on Replit where /api is local.
const apiBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
if (apiBase) {
  setBaseUrl(apiBase);
}

createRoot(document.getElementById('root')!).render(<App />);
