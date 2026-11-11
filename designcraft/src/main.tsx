import {DesignerThemeProvider} from './hooks/useDesignerTheme';
import './designer-theme.css';
import { installTextPathRevival } from './utils/textPathRevival';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import '../../src/styles/studio-controls.css';
import '../../src/styles/tools-appearance.css';
import { initProjectStorage } from './utils/projectStorage';

installTextPathRevival();

try { document.documentElement.dataset.dcTheme = localStorage.getItem('designcraft_theme_v1') === 'dark' ? 'dark' : 'light'; } catch { document.documentElement.dataset.dcTheme = 'light'; }
const root = createRoot(document.getElementById('root')!);
root.render(<div dir="rtl" style={{ padding: 24, color: 'var(--dc-loading-foreground, #94a3b8)', background: 'var(--dc-loading-background, #070D1E)', minHeight: '100vh' }}>جارٍ فتح المشاريع المحفوظة…</div>);
void initProjectStorage().finally(() => {
  root.render(
    <StrictMode>
      <DesignerThemeProvider><App /></DesignerThemeProvider>
    </StrictMode>,
  );
});
