import { Component, StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./style.css";
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main
        style={{
          padding: 40,
          color: "#eee",
          background: "#111",
          fontFamily: "system-ui",
        }}
      >
        <h1>تعذر فتح الاستوديو / Studio could not open</h1>
        <p>
          يمكنك إعادة تحميل الصفحة. لم نحذف ملفاتك المحفوظة. / Your saved files
          have not been deleted.
        </p>
        <button onClick={() => location.reload()}>
          إعادة المحاولة / Retry
        </button>
        <a href="/">UniTool</a>
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
