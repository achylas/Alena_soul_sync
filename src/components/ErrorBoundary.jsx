import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {}
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error">An error occurred in this view. Please refresh or navigate elsewhere.</div>
        </div>
      )
    }
    return this.props.children
  }
}
