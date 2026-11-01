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
      <main style={{ padding: 40, fontFamily: "system-ui", direction: "rtl" }}>
        <h1>تعذر فتح مساحة الجداول / Something went wrong</h1>
        <p>
          بياناتك المحفوظة محليًا لم تُحذف. أعد تحميل الصفحة. / Your saved data
          has not been deleted.
        </p>
        <button onClick={() => location.reload()}>
          إعادة المحاولة / Retry
        </button>
        <a href="/index.html"> UniTool </a>
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
