import { useState } from 'react';

interface ErrorAction {
  label: string;
  onClick: () => void;
}

interface ProxyErrorProps {
  title: string;
  message: string;
  actions?: ErrorAction[];
  onClose?: () => void;
}

/**
 * Component to display proxy-related errors
 */
export function ProxyError({ title, message, actions = [], onClose }: ProxyErrorProps) {
  return (
    <div className="proxy-error bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-4 my-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-300">{title}</h3>
          <div className="mt-2 text-sm text-red-700 dark:text-red-400">
            <p className="whitespace-pre-line">{message}</p>
          </div>
          {actions.length > 0 && (
            <div className="mt-4 flex space-x-3">
              {actions.map((action, index) => (
                <button
                  key={index}
                  type="button"
                  className="rounded-md bg-red-50 dark:bg-red-900/50 px-2 py-1.5 text-sm font-medium text-red-800 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/70 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                  onClick={action.onClick}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                className="inline-flex rounded-md bg-red-50 dark:bg-red-900/50 p-1.5 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/70 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                onClick={onClose}
              >
                <span className="sr-only">关闭</span>
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Component to display CORS-related help
 */
export function CorsHelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">CORS 问题解决方案</h2>

        <div className="mb-4">
          <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">什么是CORS问题？</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            跨源资源共享 (CORS) 是一种安全机制，它限制了网页从不同域名请求数据的能力。
            当我们的应用需要从其他网站（如Notion
            API）获取数据时，浏览器会阻止这些请求，除非服务器明确允许。
          </p>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">解决方案</h3>
          <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 space-y-2">
            <li>
              <strong>使用浏览器扩展</strong>
              <p className="ml-5">
                安装CORS浏览器扩展，如Chrome的"CORS Unblock"或Firefox的"CORS Everywhere"
              </p>
            </li>
            <li>
              <strong>使用特殊浏览器启动模式</strong>
              <p className="ml-5">Chrome: 使用 --disable-web-security 参数启动</p>
              <p className="ml-5">
                Firefox: 在 about:config 中设置 security.fileuri.strict_origin_policy 为 false
              </p>
            </li>
            <li>
              <strong>尝试其他浏览器</strong>
              <p className="ml-5">有时候Edge浏览器的CORS策略相对宽松</p>
            </li>
          </ol>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={onClose}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for managing proxy errors
 */
export function useProxyErrorHandler() {
  const [error, setError] = useState<{
    title: string;
    message: string;
    actions?: ErrorAction[];
  } | null>(null);
  const [showCorsHelp, setShowCorsHelp] = useState(false);

  const showError = (title: string, message: string, actions?: ErrorAction[]) => {
    setError({ title, message, actions });
  };

  const clearError = () => {
    setError(null);
  };

  const openCorsHelp = () => {
    setShowCorsHelp(true);
  };

  const closeCorsHelp = () => {
    setShowCorsHelp(false);
  };

  const showProxyError = (error: Error) => {
    showError('代理服务错误', error.message, [
      {
        label: '了解更多',
        onClick: openCorsHelp,
      },
    ]);
  };

  const ErrorComponent = error ? (
    <ProxyError
      title={error.title}
      message={error.message}
      actions={error.actions}
      onClose={clearError}
    />
  ) : null;

  const CorsHelpComponent = showCorsHelp ? <CorsHelpDialog onClose={closeCorsHelp} /> : null;

  return {
    showError,
    clearError,
    showProxyError,
    openCorsHelp,
    closeCorsHelp,
    ErrorComponent,
    CorsHelpComponent,
  };
}
