import { useState, useEffect } from 'react';
import './AnimatedCat.css';

export function AnimatedCat() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 10秒后显示小猫
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10000); // 10秒延迟

    return () => clearTimeout(timer);
  }, []);

  const handleCatClick = () => {
    window.open('https://github.com/jiangjianghong', '_blank');
  };

  // 如果还不可见，不渲染任何内容
  if (!isVisible) {
    return null;
  }

  return (
    <div className="cat-container">
      <div className="cat" onClick={handleCatClick} style={{ cursor: 'pointer' }}>
        <div className="paw"></div>
        <div className="paw"></div>
        <div className="shake">
          <div className="tail"></div>
          <div className="main">
            <div className="head"></div>
            <div className="body">
              <div className="leg"></div>
            </div>
            <div className="face">
              <div className="mustache_cont">
                <div className="mustache"></div>
                <div className="mustache"></div>
              </div>
              <div className="mustache_cont">
                <div className="mustache"></div>
                <div className="mustache"></div>
              </div>
              <div className="nose"></div>
              <div className="eye"></div>
              <div className="eye"></div>
              <div className="brow_cont">
                <div className="brow"></div>
                <div className="brow"></div>
              </div>
              <div className="brow_cont">
                <div className="brow"></div>
                <div className="brow"></div>
              </div>
              <div className="ear_l">
                <div className="inner"></div>
              </div>
              <div className="ear_r">
                <div className="outer"></div>
                <div className="inner"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
