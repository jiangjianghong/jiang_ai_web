import { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  private unhandledRejectionHandler?: (event: PromiseRejectionEvent) => void;
  private errorHandler?: (event: ErrorEvent) => void;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidMount() {
    // 监听未处理的Promise rejections
    this.unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      console.error('未处理的Promise rejection:', event.reason);

      // 将异步错误转换为同步错误，触发错误边界
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      this.setState({ hasError: true, error });

      // 阻止默认的控制台错误输出
      event.preventDefault();
    };

    // 监听全局JavaScript错误
    this.errorHandler = (event: ErrorEvent) => {
      console.error('全局JavaScript错误:', event.error);

      const error = event.error instanceof Error ? event.error : new Error(event.message);
      this.setState({ hasError: true, error });
    };

    window.addEventListener('unhandledrejection', this.unhandledRejectionHandler);
    window.addEventListener('error', this.errorHandler);
  }

  componentWillUnmount() {
    // 清理事件监听器
    if (this.unhandledRejectionHandler) {
      window.removeEventListener('unhandledrejection', this.unhandledRejectionHandler);
    }
    if (this.errorHandler) {
      window.removeEventListener('error', this.errorHandler);
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('错误边界捕获到错误:', error, errorInfo);

    // 这里可以发送错误日志到监控服务
    // 例如: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="mb-4">
              <i className="fa-solid fa-exclamation-triangle text-red-500 text-4xl"></i>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">应用出现错误</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              很抱歉，应用遇到了一个问题。您可以尝试刷新页面或联系技术支持。
            </p>
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
              >
                重试
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                刷新页面
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                  开发调试信息
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto max-h-40 text-gray-800 dark:text-gray-200">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 简化的错误边界Hook版本
export function useErrorHandler() {
  const handleError = (error: Error, errorInfo?: ErrorInfo) => {
    console.error('组件错误:', error, errorInfo);

    // 这里可以添加错误上报逻辑
    // reportError(error, errorInfo);
  };

  return handleError;
}
