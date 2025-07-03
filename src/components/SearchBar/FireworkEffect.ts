/**
 * 烟花效果组件 - 从 SearchBar 中提取的复杂动画效果
 */

// 创建彩带动画效果 - 使用真正多样的SVG形状
export const createFireworkEffect = (centerX: number, centerY: number) => {
  // 丰富的彩带颜色
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3',
    '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43', '#EE5A24', '#FD79A8',
    '#0FB9B1', '#A55EEA', '#26D0CE', '#FDCB6E', '#6C5CE7', '#74B9FF',
    '#E17055', '#F39C12', '#E74C3C', '#3498DB', '#9B59B6', '#1ABC9C'
  ];

  // 多样的SVG彩带形状路径 - 更小更多样的形状
  const ribbonPaths = [
    // 细长S形彩带
    'M2,5 Q12,2 22,5 Q32,8 42,5 L42,8 Q32,11 22,8 Q12,5 2,8 Z',
    // 三角形彩带
    'M20,2 L38,2 L29,12 Z',
    // 圆形彩带
    'M20,7 A6,6 0,1,1 20,7.1 Z',
    // 菱形彩带
    'M20,2 L30,7 L20,12 L10,7 Z',
    // 星形彩带
    'M20,2 L22,8 L28,8 L23,11 L25,17 L20,14 L15,17 L17,11 L12,8 L18,8 Z',
    // 长条波浪彩带
    'M2,6 Q15,2 28,6 Q41,10 54,6 L54,9 Q41,13 28,9 Q15,5 2,9 Z',
    // 锯齿彩带
    'M5,5 L10,2 L15,5 L20,2 L25,5 L30,2 L35,5 L35,8 L30,11 L25,8 L20,11 L15,8 L10,11 L5,8 Z',
    // 花瓣彩带
    'M20,2 Q25,7 20,12 Q15,7 20,2 M20,2 Q25,7 30,2 Q25,7 30,12 Q25,7 20,12',
    // 爱心彩带
    'M20,4 C18,2 15,2 15,5 C15,8 20,12 20,12 C20,12 25,8 25,5 C25,2 22,2 20,4 Z',
    // 蝴蝶结彩带
    'M15,4 Q10,7 15,10 Q20,7 25,10 Q30,7 25,4 Q20,7 15,4',
    // 扭曲带彩带
    'M5,4 Q20,2 35,4 Q40,7 35,10 Q20,8 5,10 Q0,7 5,4',
    // 螺旋彩带
    'M2,7 Q10,3 18,7 Q26,11 34,7 Q38,5 42,7 L42,10 Q38,8 34,10 Q26,14 18,10 Q10,6 2,10 Z'
  ];

  // 增加粒子数量
  const particleCount = 50;

  for (let i = 0; i < particleCount; i++) {
    // 创建SVG元素
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // 随机选择颜色和形状
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomPath = ribbonPaths[Math.floor(Math.random() * ribbonPaths.length)];
    
    // 更小的随机大小
    const scale = Math.random() * 0.6 + 0.5; // 0.5-1.1倍缩放
    const width = 44 * scale; // 大幅缩小
    const height = 16 * scale; // 大幅缩小
    
    // 设置SVG属性
    svg.setAttribute('width', width.toString());
    svg.setAttribute('height', height.toString());
    svg.setAttribute('viewBox', '0 0 44 16'); // 匹配小尺寸
    svg.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 10000;
      left: ${centerX - width/2}px;
      top: ${centerY - height/2}px;
      transform-origin: center;
    `;
    
    // 设置路径属性
    path.setAttribute('d', randomPath);
    path.setAttribute('fill', randomColor);
    
    // 50%的概率添加描边效果
    if (Math.random() > 0.5) {
      path.setAttribute('stroke', randomColor);
      path.setAttribute('stroke-width', '1');
      path.setAttribute('fill-opacity', '0.8');
    }
    
    // 30%的概率使用渐变填充
    if (Math.random() > 0.7) {
      const gradientId = `gradient-${Date.now()}-${i}`;
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      
      gradient.setAttribute('id', gradientId);
      gradient.setAttribute('x1', '0%');
      gradient.setAttribute('y1', '0%');
      gradient.setAttribute('x2', '100%');
      gradient.setAttribute('y2', '100%');
      
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', randomColor);
      stop2.setAttribute('offset', '100%');
      stop2.setAttribute('stop-color', colors[Math.floor(Math.random() * colors.length)]);
      
      gradient.appendChild(stop1);
      gradient.appendChild(stop2);
      defs.appendChild(gradient);
      svg.appendChild(defs);
      
      path.setAttribute('fill', `url(#${gradientId})`);
    }
    
    svg.appendChild(path);
    document.body.appendChild(svg);

    // 随机初始速度和方向 - 更慢更优雅
    const angle = (Math.random() * 360) * (Math.PI / 180);
    const velocity = Math.random() * 4 + 2; // 进一步减慢速度：2-6
    let vx = Math.cos(angle) * velocity;
    let vy = Math.sin(angle) * velocity;
    
    // 随机旋转速度 - 更慢
    const rotationSpeed = (Math.random() - 0.5) * 80; // 进一步减慢旋转：-40到40度/秒
    let rotation = Math.random() * 360; // 随机初始旋转
    
    let x = centerX - width/2;
    let y = centerY - height/2;
    
    const gravity = 0.2; // 进一步减小重力
    const friction = 0.998; // 进一步减小阻力，让动画更持久
    
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      
      // 应用重力
      vy += gravity;
      
      // 应用空气阻力
      vx *= friction;
      vy *= friction;
      
      // 更新位置
      x += vx;
      y += vy;
      
      // 更新旋转
      rotation += rotationSpeed * (1/60);
      
      // 应用变换
      svg.style.left = x + 'px';
      svg.style.top = y + 'px';
      svg.style.transform = `rotate(${rotation}deg)`;
      
      // 淡出效果 - 进一步延长动画时间
      const opacity = Math.max(0, 1 - elapsed / 7); // 从5秒延长到7秒
      svg.style.opacity = opacity.toString();
      
      if (opacity > 0 && y < window.innerHeight + 100) {
        requestAnimationFrame(animate);
      } else {
        if (document.body.contains(svg)) {
          document.body.removeChild(svg);
        }
      }
    };
    
    // 适度的随机延迟 - 创造层次感
    setTimeout(() => {
      requestAnimationFrame(animate);
    }, Math.random() * 150); // 从50ms增加到150ms
  }
};
