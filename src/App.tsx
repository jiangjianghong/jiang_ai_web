import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import { createContext, useState, useEffect } from "react";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { mockWebsites } from '@/lib/mockData';
 
export const AuthContext = createContext({
  isAuthenticated: false,
  setIsAuthenticated: (value: boolean) => {},
  logout: () => {},
});

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // 优先从 localStorage 读取卡片数据
  const [websites, setWebsites] = useState(() => {
    const saved = localStorage.getItem('websites');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return mockWebsites;
      }
    }
    return mockWebsites;
  });

  // 持久化到 localStorage
  useEffect(() => {
    localStorage.setItem('websites', JSON.stringify(websites));
  }, [websites]);

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <AuthContext.Provider
        value={{ isAuthenticated, setIsAuthenticated, logout }}
      >
        <Routes>
          <Route path="/" element={<Home websites={websites} setWebsites={setWebsites} />} />
        </Routes>
      </AuthContext.Provider>
    </DndProvider>
  );
}
