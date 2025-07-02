// 临时调试版本的 Firebase 配置
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// 硬编码配置用于调试（从 .env 文件复制）
const firebaseConfig = {
  apiKey: "AIzaSyAgRdBtg_I5NMAC5x3gh-7_CvQ058n25go",
  authDomain: "jiang-ai-web.firebaseapp.com",
  projectId: "jiang-ai-web",
  storageBucket: "jiang-ai-web.firebasestorage.app",
  messagingSenderId: "923755523160",
  appId: "1:923755523160:web:043dca5d76b6ded7ecee2d",
  measurementId: "G-8FXGZWC0M4"
};

console.log('🔧 调试版 Firebase 配置:', firebaseConfig);

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化 Auth 和 Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

// 测试基本连接
console.log('🔍 Firebase 初始化状态:', {
  app: !!app,
  auth: !!auth,
  db: !!db,
  authCurrentUser: auth.currentUser,
  authConfig: auth.config
});

// 进行连接测试
const testConnection = async () => {
  try {
    console.log('🔍 开始连接测试...');
    
    // 测试获取配置
    const configTest = await fetch(`https://securetoken.googleapis.com/v1/token?key=${firebaseConfig.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnSecureToken: true })
    });
    
    console.log('📊 Firebase Auth Token API 状态:', configTest.status);
    
  } catch (error) {
    console.error('❌ 连接测试失败:', error);
  }
};

// 延迟执行测试
setTimeout(testConnection, 2000);

export default app;
