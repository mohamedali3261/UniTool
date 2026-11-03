import { installTextPathRevival } from './utils/textPathRevival';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initProjectStorage } from './utils/projectStorage';

installTextPathRevival();

const root = createRoot(document.getElementById('root')!);
root.render(<div dir="rtl" style={{ padding: 24, color: '#94a3b8', background: '#070D1E', minHeight: '100vh' }}>جارٍ فتح المشاريع المحفوظة…</div>);
void initProjectStorage().finally(() => {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
