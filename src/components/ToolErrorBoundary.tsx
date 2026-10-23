import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, LayoutDashboard } from 'lucide-react';

interface Props {
  children: ReactNode;
  lang: 'ar' | 'en';
  pageKey: string;
  onNavigate: (page: string) => void;
}

interface State {
  error: Error | null;
}

export class ToolErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ToolErrorBoundary]', error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (prev.pageKey !== this.props.pageKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  private reset = () => this.setState({ error: null });

  private goHome = () => {
    this.setState({ error: null });
    this.props.onNavigate('toolsHome');
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const ar = this.props.lang === 'ar';

    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-[#0A0C0F]">
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-gradient-to-b from-red-500/[0.07] to-transparent p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/15 ring-1 ring-red-500/25">
            <AlertTriangle size={22} className="text-red-400" />
          </div>
          <h2 className="text-sm font-bold text-white">
            {ar ? 'حصلت مشكلة في الأداة دي' : 'This tool ran into a problem'}
          </h2>
          <p className="mt-1.5 text-[9px] leading-relaxed text-gray-500">
            {ar
              ? 'ملفاتك آمنة. جرّب تعيد المحاولة، أو ارجع لكل الأدوات واختار أداة تانية.'
              : 'Your files are safe. Try again, or go back to all tools and pick another one.'}
          </p>
          <p className="mt-3 break-words rounded-lg border border-white/[0.06] bg-black/30 px-3 py-2 text-start font-mono text-[8px] text-red-300/80">
            {error.message || String(error)}
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={this.reset}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-[10px] font-semibold text-white transition-colors hover:bg-indigo-500"
            >
              <RotateCcw size={12} />
              {ar ? 'إعادة المحاولة' : 'Try again'}
            </button>
            <button
              onClick={this.goHome}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-[10px] font-semibold text-gray-300 transition-colors hover:bg-white/[0.06]"
            >
              <LayoutDashboard size={12} />
              {ar ? 'كل الأدوات' : 'All tools'}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
