import { lazy, Suspense } from 'react';

// Lazy load the Settings component
const Settings = lazy(() => import('@/pages/Settings'));

// Lazy load the WorkspaceModal component
const WorkspaceModal = lazy(() => import('@/components/Workspace/WorkspaceModal'));

// Preload functions - 预加载函数，用于在用户交互前预先加载组件
export const preloadSettings = () => import('@/pages/Settings');
export const preloadWorkspaceModal = () => import('@/components/Workspace/WorkspaceModal');

// Wrapper component for lazy-loaded Settings with Suspense
export const LazySettings = (props: any) => (
  <Suspense
    fallback={
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <div className="animate-pulse flex items-center space-x-2">
            <div className="rounded-full h-4 w-4 bg-white/30"></div>
            <span className="text-white/90 text-sm">加载设置中...</span>
          </div>
        </div>
      </div>
    }
  >
    <Settings {...props} />
  </Suspense>
);

// Wrapper component for lazy-loaded WorkspaceModal with Suspense
export const LazyWorkspaceModal = (props: any) => (
  <Suspense fallback={null}>
    <WorkspaceModal {...props} />
  </Suspense>
);
