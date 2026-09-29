import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import LogoStudioApp from './LogoStudioApp';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LogoStudioApp />
  </StrictMode>,
);
