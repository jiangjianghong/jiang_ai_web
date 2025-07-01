// Firebase 配置和初始化 (硬编码版本)
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase 配置对象 - 直接硬编码
// 注意：这些API key在前端是公开的，这是Firebase的正常设计
const firebaseConfig = {
  apiKey: "your_api_key_here", // 替换为你的实际API key
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com", 
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化 Firebase Authentication 和 Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
