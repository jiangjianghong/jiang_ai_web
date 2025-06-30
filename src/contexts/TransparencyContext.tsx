import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TransparencyContextType {
  cardOpacity: number;
  searchBarOpacity: number;
  parallaxEnabled: boolean;
  setCardOpacity: (opacity: number) => void;
  setSearchBarOpacity: (opacity: number) => void;
  setParallaxEnabled: (enabled: boolean) => void;
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

  const [parallaxEnabled, setParallaxEnabled] = useState(() => {
    const saved = localStorage.getItem('parallaxEnabled');
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('cardOpacity', cardOpacity.toString());
  }, [cardOpacity]);

  useEffect(() => {
    localStorage.setItem('searchBarOpacity', searchBarOpacity.toString());
  }, [searchBarOpacity]);

  useEffect(() => {
    localStorage.setItem('parallaxEnabled', JSON.stringify(parallaxEnabled));
  }, [parallaxEnabled]);

  return (
    <TransparencyContext.Provider
      value={{
        cardOpacity,
        searchBarOpacity,
        parallaxEnabled,
        setCardOpacity,
        setSearchBarOpacity,
        setParallaxEnabled,
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
