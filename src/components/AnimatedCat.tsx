import './AnimatedCat.css';

export function AnimatedCat() {
  const handleCatClick = () => {
    window.open('https://github.com/jiangjianghong', '_blank');
  };

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
