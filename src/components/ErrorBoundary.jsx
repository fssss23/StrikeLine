import { Component } from 'react'

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null, info: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
    this.setState({ info })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px', fontFamily: 'monospace',
          background: '#fff1f1', minHeight: '100vh'
        }}>
          <h2 style={{ color: '#a32d2d' }}>
            Application Error — check console for details
          </h2>
          <pre style={{ 
            background: '#fff', padding: '20px', 
            borderRadius: '8px', overflow: 'auto',
            fontSize: '13px', color: '#0f172a'
          }}>
            {this.state.error?.toString()}
            {'\n\n'}
            {this.state.info?.componentStack}
          </pre>
          <button 
            onClick={() => this.setState({ hasError: false })}
            style={{
              marginTop: '16px', padding: '10px 20px',
              background: '#0D2F55', color: 'white',
              border: 'none', borderRadius: '8px', cursor: 'pointer'
            }}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
