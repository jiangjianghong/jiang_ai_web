import { useState, useEffect } from 'react';
import { WebsiteCard } from '@/components/WebsiteCard';
import { SearchBar } from '@/components/SearchBar';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import Settings from '@/pages/Settings';

interface HomeProps {
  websites: any[];
  setWebsites: (websites: any[]) => void;
}

export default function Home({ websites, setWebsites }: HomeProps) {
  const { theme } = useTheme();
  const { drag, drop, isDragging } = useDragAndDrop(websites, setWebsites);
  const [bgImage, setBgImage] = useState('https://bing.img.run/uhd.php');
  const [bgLoaded, setBgLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleSaveCard = (updatedCard: {
    id: string;
    name: string;
    url: string;
    favicon: string;
    tags: string[];
    note?: string;
  }) => {
    setWebsites(prev => 
      prev.map(card => 
        card.id === updatedCard.id ? { ...card, ...updatedCard } : card
      )
    );
  };

  useEffect(() => {
    const wallpapers = [
      'https://bing.img.run/uhd.php',
      'https://bing.img.run/1920x1080.php',
      'https://bing.img.run/1366x768.php',
      'https://bing.img.run/m.php'
    ];

    const tryLoadWallpaper = (index = 0) => {
      if (index >= wallpapers.length) {
        setBgImage('https://source.unsplash.com/random/1920x1080/?nature');
        return;
      }

      const img = new Image();
      img.src = wallpapers[index];
      img.onload = () => {
        setBgLoaded(true);
        setBgImage(img.src);
      };
      img.onerror = () => {
        tryLoadWallpaper(index + 1);
      };
    };

    tryLoadWallpaper();
  }, []);

    return (
    <div 
      className="fixed top-0 left-0 w-full h-full bg-cover bg-center bg-no-repeat -z-10"
      style={{ 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="relative min-h-screen pt-[33vh]">
    
      <SearchBar />
      
      <div className="pt-16 pb-8 px-4 max-w-6xl mx-auto">
        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {websites.map((website, index) => (
             <motion.div 
              key={website.id}
              ref={(node) => drag(drop(node))}
              style={{ opacity: isDragging ? 0.5 : 1 }}
              layout
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
            >
              <WebsiteCard 
                {...website} 
                onSave={handleSaveCard}
                onDelete={(id) => {
                  setWebsites(websites.filter(card => card.id !== id));
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {showSettings && (
        <Settings 
          onClose={() => setShowSettings(false)}
          websites={websites}
          setWebsites={setWebsites}
        />
      )}

      <div className="fixed bottom-4 right-4 z-[9999]">
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 text-white/70 hover:text-white transition-colors"
          aria-label="设置"
        >
          <i className="fa-solid fa-sliders text-lg"></i>
        </button>
      </div>
      </div>
    </div>
  );
}