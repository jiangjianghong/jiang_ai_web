import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from 'sonner';
import MainApp from "./MainApp.tsx";
import "./index.css";

const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const basename = isLocalhost ? undefined : "/jiang_ai_web";

// 移除加载骨架屏的函数
const removeLoadingSkeleton = () => {
  const skeleton = document.getElementById('loading-skeleton');
  if (skeleton) {
    skeleton.style.opacity = '0';
    skeleton.style.transition = 'opacity 0.3s ease-out';
    setTimeout(() => {
      skeleton.remove();
    }, 300);
  }
};

// 简化日志输出

// 错误边界处理
const ErrorFallback = ({ error }: { error: Error }) => (
  <div style={{
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
    fontFamily: 'Arial, sans-serif'
  }}>
    <h1 style={{ color: 'red', marginBottom: '20px' }}>应用加载失败</h1>
    <pre style={{ 
      background: '#f5f5f5', 
      padding: '20px', 
      borderRadius: '8px',
      fontSize: '14px',
      maxWidth: '80%',
      overflow: 'auto'
    }}>
      {error.message}
      {'\n\n'}
      {error.stack}
    </pre>
  </div>
);

try {
  const rootElement = document.getElementById("root");
  
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

  // 应用渲染完成后移除骨架屏
  // 使用微任务确保React已完成首次渲染
  queueMicrotask(() => {
    requestAnimationFrame(() => {
      removeLoadingSkeleton();
    });
  });

} catch (error) {
  console.error('❌ React应用初始化失败:', error);
  
  // 显示错误信息
  const root = createRoot(document.getElementById("root")!);
  root.render(<ErrorFallback error={error as Error} />);
}
