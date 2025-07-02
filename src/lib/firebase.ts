// Firebase 配置和初始化
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// 调试：检查环境变量
console.log('🔧 Firebase 环境变量检查:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '✅ 已配置' : '❌ 未配置',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ 已配置' : '❌ 未配置',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ 已配置' : '❌ 未配置',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? '✅ 已配置' : '❌ 未配置',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? '✅ 已配置' : '❌ 未配置',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ? '✅ 已配置' : '❌ 未配置'
});

// Firebase 配置对象
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// 检查配置是否完整
const hasRequiredConfig = firebaseConfig.apiKey && 
                         firebaseConfig.authDomain && 
                         firebaseConfig.projectId && 
                         firebaseConfig.appId;

if (!hasRequiredConfig) {
  console.error('❌ Firebase 配置不完整！请检查 .env 文件:');
  console.error('缺少的配置:', {
    apiKey: !firebaseConfig.apiKey,
    authDomain: !firebaseConfig.authDomain,
    projectId: !firebaseConfig.projectId,
    appId: !firebaseConfig.appId
  });
}

// 初始化 Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase 初始化成功');
} catch (error) {
  console.error('❌ Firebase 初始化失败:', error);
  throw error;
}

// 初始化 Firebase Authentication 和 Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

// 网络诊断：测试 Firebase 连接
const testFirebaseConnection = async () => {
  try {
    console.log('🔍 开始 Firebase 连接诊断...');
    
    // 检查 Firebase Auth 域名配置
    console.log('🔍 检查 Firebase Auth 域名配置...');
    console.log(`认证域名: ${firebaseConfig.authDomain}`);
    console.log(`项目ID: ${firebaseConfig.projectId}`);
    
    // 测试正确的 Firebase Auth API 端点
    const authApiUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`;
    
    try {
      console.log('🔍 测试 Firebase Auth API...');
      const response = await fetch(authApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      
      if (response.status === 400) {
        console.log('✅ Firebase Auth API 可达（400错误是正常的，因为我们发送了空请求）');
      } else {
        console.log(`📊 Firebase Auth API 响应状态: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Firebase Auth API 测试失败:', error);
    }
    
    // 测试 Firestore API
    try {
      console.log('🔍 测试 Firestore API...');
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;
      const firestoreResponse = await fetch(firestoreUrl);
      console.log(`📊 Firestore API 响应状态: ${firestoreResponse.status}`);
      
      if (firestoreResponse.status === 401 || firestoreResponse.status === 403) {
        console.log('✅ Firestore API 可达（401/403 是正常的，因为我们没有认证）');
      }
    } catch (error) {
      console.error('❌ Firestore API 测试失败:', error);
    }
    
    // 检查网络连接状况
    console.log('🔍 检查整体网络状况...');
    console.log(`在线状态: ${navigator.onLine ? '✅ 在线' : '❌ 离线'}`);
    
    // 提供修复建议
    console.log('💡 如果登录仍然失败，请检查:');
    console.log('1. 网络连接是否稳定');
    console.log('2. 防火墙是否阻止了 Firebase 域名');
    console.log('3. Firebase 项目是否正确配置了认证域名');
    console.log('4. 浏览器是否阻止了跨域请求');
    
  } catch (error) {
    console.error('❌ Firebase 连接诊断失败:', error);
  }
};

// 在开发环境中运行连接测试
if (import.meta.env.DEV) {
  setTimeout(testFirebaseConnection, 1000);
}

// 初始化 Analytics (可选)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
