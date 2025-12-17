import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import MainApp from './MainApp.tsx';
import './index.css';

// 初始化统一清理管理器
import './lib/unifiedCleanupManager';

// 使用自定义域名，不需要 basename
const basename = undefined;

// 简化日志输出

// 错误边界处理
const ErrorFallback = ({ error }: { error: Error }) => (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100vh',
      background: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
    }}
  >
    <h1 style={{ color: 'red', marginBottom: '20px' }}>应用加载失败</h1>
    <pre
      style={{
        background: '#f5f5f5',
        padding: '20px',
        borderRadius: '8px',
        fontSize: '14px',
        maxWidth: '80%',
        overflow: 'auto',
      }}
    >
      {error.message}
      {'\n\n'}
      {error.stack}
    </pre>
  </div>
);

try {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    throw new Error('无法找到id为"root"的元素');
  }

  const root = createRoot(rootElement);

  // 渲染应用
  root.render(
    <StrictMode>
      <BrowserRouter basename={basename}>
        <MainApp />
        <Toaster />
      </BrowserRouter>
    </StrictMode>
  );
} catch (error) {
  // 保留错误日志，这对生产环境调试很重要
  console.error('❌ React应用初始化失败:', error);

  // 显示错误信息
  const root = createRoot(document.getElementById('root')!);
  root.render(<ErrorFallback error={error as Error} />);
}
