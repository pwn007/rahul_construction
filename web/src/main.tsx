import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { loadAnalytics } from './lib/analytics';
import { getAttribution } from './lib/attribution';
import './styles/globals.css';

/*
 * Before React, and in this order.
 *
 * Attribution reads the campaign parameters off the landing URL, which the
 * router rewrites as soon as it mounts — capturing after that point loses the
 * one thing it exists to record. Both are inert without `VITE_GTM_ID` and a
 * tagged URL respectively, so this costs a dev build nothing.
 */
loadAnalytics();
getAttribution();

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
