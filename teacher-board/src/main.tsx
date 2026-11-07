import { Component, StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import '../../src/styles/studio-controls.css';
import '../../src/styles/site-appearance.css';
import './app/theme.css';

class Boundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main style={{ padding: 40, fontFamily: 'system-ui', direction: 'rtl' }}>
        <h1>تعذر فتح سبورة المعلم / Something went wrong</h1>
        <p>دروسك المحفوظة محليًا لم تُحذف. أعد تحميل الصفحة.</p>
        <button onClick={() => location.reload()}>إعادة المحاولة / Retry</button>
        <a href="/index.html"> UniTool </a>
      </main>
    ) : (
      this.props.children
    );
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Boundary>
      <App />
    </Boundary>
  </StrictMode>
);
