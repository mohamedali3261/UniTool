import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/tools-appearance.css';
import './styles/studio-controls.css';
import { installDownloadGuard } from './utils/download';

// Safari cancels blob downloads whose object URL is revoked right after the
// click, and the guard must exist before any tool can start one.
installDownloadGuard();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
