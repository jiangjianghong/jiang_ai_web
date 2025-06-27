import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import { createContext, useState } from "react";
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
  const [websites, setWebsites] = useState(mockWebsites);

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
