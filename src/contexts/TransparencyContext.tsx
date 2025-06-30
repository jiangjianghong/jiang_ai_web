import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TransparencyContextType {
  cardOpacity: number;
  searchBarOpacity: number;
  setCardOpacity: (opacity: number) => void;
  setSearchBarOpacity: (opacity: number) => void;
}

const TransparencyContext = createContext<TransparencyContextType | undefined>(undefined);

export function TransparencyProvider({ children }: { children: ReactNode }) {
  const [cardOpacity, setCardOpacity] = useState(() => {
    const saved = localStorage.getItem('cardOpacity');
    return saved ? parseFloat(saved) : 0.1;
  });
  
  const [searchBarOpacity, setSearchBarOpacity] = useState(() => {
    const saved = localStorage.getItem('searchBarOpacity');
    return saved ? parseFloat(saved) : 0.1;
  });

  useEffect(() => {
    localStorage.setItem('cardOpacity', cardOpacity.toString());
  }, [cardOpacity]);

  useEffect(() => {
    localStorage.setItem('searchBarOpacity', searchBarOpacity.toString());
  }, [searchBarOpacity]);

  return (
    <TransparencyContext.Provider
      value={{
        cardOpacity,
        searchBarOpacity,
        setCardOpacity,
        setSearchBarOpacity,
      }}
    >
      {children}
    </TransparencyContext.Provider>
  );
}

export function useTransparency() {
  const context = useContext(TransparencyContext);
  if (context === undefined) {
    throw new Error('useTransparency must be used within a TransparencyProvider');
  }
  return context;
}
