import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import UnitoolSvgApp from './UnitoolSvgApp';
import './index.css';
import './styles/tools-appearance.css';
import './styles/studio-controls.css';
import './styles/site-appearance.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UnitoolSvgApp />
  </StrictMode>,
);
