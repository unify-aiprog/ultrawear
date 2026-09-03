'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode; fallback?: ReactNode; name?: string };
type State = { hasError: boolean };

export class UltraErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[UltraWear] ${this.props.name || 'UI'} failed`, error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return this.props.fallback ?? (
      <div role="alert" className="empty-state">
        <strong>This part of UltraWear is temporarily unavailable.</strong>
        <p>Try again or continue exploring the rest of the experience.</p>
      </div>
    );
  }
}
