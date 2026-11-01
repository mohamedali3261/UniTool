import { StrictMode, Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App";
class Boundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main style={{ padding: 40, fontFamily: "system-ui" }}>
        <h1>تعذر عرض مساحة PDF / PDF Studio could not continue</h1>
        <p>ملفك الأصلي لم يتغير. / Your original file has not changed.</p>
        <button onClick={() => location.reload()}>
          إعادة التحميل / Reload
        </button>
        <a href="/index.html">UniTool</a>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Boundary>
      <App />
    </Boundary>
  </StrictMode>,
);
