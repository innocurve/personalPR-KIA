import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null }
  }

  componentDidCatch(error: Error) {
    console.error('Error:', error)
    this.setState({ error })
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-red-200 dark:border-red-800">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">오류가 발생했습니다.</h2>
          <p className="text-gray-700 dark:text-gray-300">{this.state.error.message}</p>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

