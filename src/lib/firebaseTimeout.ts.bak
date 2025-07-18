// Firebase 超时和错误处理工具
import { auth } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  reload as firebaseReload
} from 'firebase/auth';
import { firebaseConnectionManager } from './firebaseConnectionManager';

// 网络状态检测
export const isOnline = () => navigator.onLine;

// 带超时的Promise包装器
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      firebaseConnectionManager.recordFailure(new Error(`操作超时 (${timeoutMs}ms)`));
      reject(new Error(`操作超时 (${timeoutMs}ms)`));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timeoutId);
        firebaseConnectionManager.recordSuccess();
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        firebaseConnectionManager.recordFailure(error);
        reject(error);
      });
  });
}

// 带超时的登录
export const loginWithTimeout = async (email: string, password: string, timeoutMs: number = 5000) => {
  if (!isOnline()) {
    throw new Error('网络连接不可用，请检查网络设置');
  }
  
  return withTimeout(
    signInWithEmailAndPassword(auth, email, password),
    timeoutMs
  );
};

// 带超时的注册
export const registerWithTimeout = async (email: string, password: string, timeoutMs: number = 5000) => {
  if (!isOnline()) {
    throw new Error('网络连接不可用，请检查网络设置');
  }
  
  return withTimeout(
    createUserWithEmailAndPassword(auth, email, password),
    timeoutMs
  );
};

// 带超时的Google登录
export const loginWithGoogleTimeout = async (timeoutMs: number = 5000) => {
  if (!isOnline()) {
    throw new Error('网络连接不可用，请检查网络设置');
  }
  
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  
  return withTimeout(
    signInWithPopup(auth, provider),
    timeoutMs
  );
};

// 带超时的邮箱验证发送
export const sendVerificationEmailWithTimeout = async (timeoutMs: number = 5000) => {
  if (!isOnline()) {
    throw new Error('网络连接不可用，请检查网络设置');
  }
  
  if (!auth.currentUser) {
    throw new Error('用户未登录');
  }
  
  return withTimeout(
    sendEmailVerification(auth.currentUser),
    timeoutMs
  );
};

// 带超时的用户重新加载
export const reloadUserWithTimeout = async (timeoutMs: number = 5000) => {
  if (!isOnline()) {
    throw new Error('网络连接不可用，请检查网络设置');
  }
  
  if (!auth.currentUser) {
    throw new Error('用户未登录');
  }
  
  return withTimeout(
    firebaseReload(auth.currentUser),
    timeoutMs
  );
};

// 错误信息本地化
export const getLocalizedErrorMessage = (error: any): string => {
  if (!isOnline()) {
    return '网络连接不可用，请检查网络设置后重试';
  }
  
  const errorCode = error?.code || error?.message || '';
  
  // 超时错误
  if (errorCode.includes('超时') || errorCode.includes('timeout')) {
    return '网络响应超时，请检查网络连接后重试';
  }
  
  // Firebase 错误码映射
  switch (errorCode) {
    case 'auth/network-request-failed':
      return '网络请求失败，请检查网络连接';
    case 'auth/timeout':
      return '连接超时，请稍后重试';
    case 'auth/too-many-requests':
      return '请求过于频繁，请稍后再试';
    case 'auth/user-not-found':
      return '用户不存在';
    case 'auth/wrong-password':
      return '密码错误';
    case 'auth/email-already-in-use':
      return '邮箱已被使用';
    case 'auth/weak-password':
      return '密码强度不够';
    case 'auth/invalid-email':
      return '邮箱格式不正确';
    case 'auth/popup-closed-by-user':
      return '登录窗口被关闭';
    case 'auth/cancelled-popup-request':
      return '登录请求被取消';
    default:
      return error?.message || '未知错误，请稍后重试';
  }
};

// 网络状态监听
export const createNetworkStatusListener = (callback: (isOnline: boolean) => void) => {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // 返回清理函数
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};
