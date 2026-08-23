import { Component } from 'react'
import { SUPPORT_EMAIL, supportMailto } from '../lib/constants'

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null, info: null, showDetails: false }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
    this.setState({ info })
  }

  render() {
    if (this.state.hasError) {
      const { error, info, showDetails } = this.state

      return (
        <div className="min-h-[100dvh] bg-surface-page flex items-center justify-center p-5">
          <div className="sl-card shadow-lifted w-full max-w-lg p-7 animate-scale-in">
            <div className="w-11 h-11 rounded-[14px] bg-signal-redBg text-signal-red flex items-center justify-center mb-4">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            <h1 className="text-xl font-bold text-text-primary tracking-tighter mb-2">
              Something went wrong
            </h1>
            <p className="text-[13.5px] text-text-secondary leading-relaxed mb-6">
              StrikeLine hit an unexpected error while rendering this screen. Your data is safe —
              try again, and if it keeps happening, reload the page.
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => this.setState({ hasError: false, error: null, info: null })}
                className="sl-tap inline-flex items-center justify-center h-10 px-4 text-[13.5px] font-semibold rounded-[10px] bg-brand-blue text-white shadow-cta hover:brightness-105 transition-all"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="sl-tap inline-flex items-center justify-center h-10 px-4 text-[13.5px] font-semibold rounded-[10px] bg-surface-card text-text-primary border border-surface-border shadow-card hover:bg-surface-muted transition-all"
              >
                Reload page
              </button>
              <button
                onClick={() => this.setState({ showDetails: !showDetails })}
                className="sl-tap inline-flex items-center justify-center h-10 px-3 text-[13px] font-semibold rounded-[10px] text-text-secondary hover:bg-surface-muted transition-colors"
              >
                {showDetails ? 'Hide details' : 'Show details'}
              </button>
            </div>

            <p className="text-[12px] text-text-tertiary mt-5">
              Keeps happening?{' '}
              <a
                href={supportMailto('StrikeLine — application error', error?.toString() ?? '')}
                className="font-semibold text-brand-blue hover:text-brand-navy transition-colors break-all"
              >
                {SUPPORT_EMAIL}
              </a>
            </p>

            {showDetails && (
              <pre className="mt-5 bg-surface-sunken border border-surface-hairline rounded-[10px] p-3.5 overflow-auto max-h-64 text-[11.5px] leading-relaxed text-text-secondary font-mono whitespace-pre-wrap">
                {error?.toString()}
                {'\n\n'}
                {info?.componentStack}
              </pre>
            )}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
