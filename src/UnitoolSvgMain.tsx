import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import UnitoolSvgApp from './UnitoolSvgApp';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UnitoolSvgApp />
  </StrictMode>,
);
