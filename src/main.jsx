import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui', maxWidth: 480 }}>
          <h1 style={{ fontSize: 20 }}>RentRight failed to load</h1>
          <p style={{ color: '#b91c1c' }}>{String(this.state.error?.message || this.state.error)}</p>
          <p style={{ fontSize: 14, color: '#475569' }}>
            Check the browser console (F12) and your <code>.env</code> file.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
)
