import { Component, ReactNode, ErrorInfo } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Error captured — UI already shows fallback
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', padding: 40, textAlign: 'center', color: 'var(--text-main)',
        }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Something went wrong</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 8, maxWidth: 440, fontSize: 14 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <p style={{ color: 'var(--text-light)', marginBottom: 24, fontSize: 13 }}>
            Try reloading the page or going back. If this keeps happening, contact support.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={this.handleReset}
              className="btn-rounded btn-ghost"
              style={{ padding: '12px 24px', fontSize: 14 }}
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn-rounded btn-primary"
              style={{ padding: '12px 32px', fontSize: 14 }}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
