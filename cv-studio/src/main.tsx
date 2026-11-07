import { Component, StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/styles/studio-controls.css';
import '../../src/styles/site-appearance.css';
import App from './app/App';

class StudioErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    if (this.state.error) {
      return (
        <main style={{ padding: 40, fontFamily: 'system-ui, sans-serif', direction: 'rtl' }}>
          <h1>تعذر فتح ستوديو السيرة الذاتية / Something went wrong</h1>
          <p>بياناتك المحفوظة محلياً بأمان ولم تُحذف. أعد تحميل الصفحة للمتابعة.</p>
          <button onClick={() => location.reload()}>إعادة المحاولة / Retry</button>{' '}
          <a href="/index.html">UniTool</a>
        </main>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StudioErrorBoundary>
      <App />
    </StudioErrorBoundary>
  </StrictMode>,
);
