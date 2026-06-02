import React from 'react';

interface State {
  hasError: boolean;
  error?: Error | null;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // Log to console — developer should check DevTools
    // Optionally wire to remote logging later
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Something went wrong.</h2>
          <p style={{ color: '#666', marginBottom: 12 }}>Open DevTools console to view the error details.</p>
          <pre style={{ textAlign: 'left', display: 'inline-block', maxWidth: '90%', whiteSpace: 'pre-wrap', color: '#b71c1c' }}>
            {String(this.state.error)}
          </pre>
        </div>
      );
    }

    return this.props.children as React.ReactElement;
  }
}

export default ErrorBoundary;
