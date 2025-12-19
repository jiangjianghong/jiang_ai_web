/**
 * 雪花效果组件
 * 使用双层 Canvas 实现视觉深度效果
 * - 远景层（小雪花）：z-index 较低，在搜索框和卡片之下
 * - 近景层（大雪花）：z-index 较高，在搜索框之上
 */
import { useEffect, useRef, useCallback } from 'react';

interface Snowflake {
    x: number;
    y: number;
    radius: number;
    speed: number;
    opacity: number;
    swing: number;
    swingSpeed: number;
    swingOffset: number;
    layer: 'far' | 'near'; // 远景或近景
}

// 性能配置
const MAX_SNOWFLAKES = 1000; // 最大雪花数量
const SPAWN_RATE = 0.5; // 每帧生成雪花的概率
const SIZE_THRESHOLD = 2.2; // 大于此值的雪花在近景层

export default function SnowEffect() {
    const farCanvasRef = useRef<HTMLCanvasElement>(null);  // 远景 Canvas
    const nearCanvasRef = useRef<HTMLCanvasElement>(null); // 近景 Canvas
    const snowflakesRef = useRef<Snowflake[]>([]);
    const animationFrameRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);

    // 创建雪花
    const createSnowflake = useCallback((canvasWidth: number): Snowflake => {
        const radius = Math.random() * 2.5 + 1; // 1-3.5px
        return {
            x: Math.random() * canvasWidth,
            y: -10,
            radius,
            speed: Math.random() * 1.2 + 0.8, // 0.8-2.0px/帧
            opacity: Math.random() * 0.5 + 0.3,
            swing: Math.random() * 1.5 + 0.5,
            swingSpeed: Math.random() * 0.02 + 0.01,
            swingOffset: Math.random() * Math.PI * 2,
            layer: radius > SIZE_THRESHOLD ? 'near' : 'far',
        };
    }, []);

    // 动画循环
    const animate = useCallback((currentTime: number) => {
        const farCanvas = farCanvasRef.current;
        const nearCanvas = nearCanvasRef.current;
        if (!farCanvas || !nearCanvas) return;

        const farCtx = farCanvas.getContext('2d');
        const nearCtx = nearCanvas.getContext('2d');
        if (!farCtx || !nearCtx) return;

        // 控制帧率约为 30fps
        const deltaTime = currentTime - lastTimeRef.current;
        if (deltaTime < 33) {
            animationFrameRef.current = requestAnimationFrame(animate);
            return;
        }
        lastTimeRef.current = currentTime;

        const { width, height } = farCanvas;

        // 清空两个画布
        farCtx.clearRect(0, 0, width, height);
        nearCtx.clearRect(0, 0, width, height);

        // 可能生成新雪花
        if (snowflakesRef.current.length < MAX_SNOWFLAKES && Math.random() < SPAWN_RATE) {
            snowflakesRef.current.push(createSnowflake(width));
        }

        // 更新雪花位置并过滤
        snowflakesRef.current = snowflakesRef.current.filter((flake) => {
            flake.y += flake.speed;
            flake.swingOffset += flake.swingSpeed;
            return flake.y < height + 10;
        });

        // 分别获取远景和近景雪花
        const farFlakes = snowflakesRef.current.filter(f => f.layer === 'far');
        const nearFlakes = snowflakesRef.current.filter(f => f.layer === 'near');

        // 绘制远景雪花（按大小排序，小的先画）
        farFlakes.sort((a, b) => a.radius - b.radius).forEach((flake) => {
            const swingX = Math.sin(flake.swingOffset) * flake.swing;
            farCtx.beginPath();
            farCtx.arc(flake.x + swingX, flake.y, flake.radius, 0, Math.PI * 2);
            farCtx.fillStyle = `rgba(255, 255, 255, ${flake.opacity * 0.7})`; // 远景稍暗
            farCtx.fill();
        });

        // 绘制近景雪花（按大小排序，小的先画）
        nearFlakes.sort((a, b) => a.radius - b.radius).forEach((flake) => {
            const swingX = Math.sin(flake.swingOffset) * flake.swing;
            nearCtx.beginPath();
            nearCtx.arc(flake.x + swingX, flake.y, flake.radius, 0, Math.PI * 2);
            nearCtx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
            nearCtx.fill();
        });

        animationFrameRef.current = requestAnimationFrame(animate);
    }, [createSnowflake]);

    // 调整 Canvas 大小
    const resizeCanvas = useCallback(() => {
        const farCanvas = farCanvasRef.current;
        const nearCanvas = nearCanvasRef.current;
        if (!farCanvas || !nearCanvas) return;

        farCanvas.width = window.innerWidth;
        farCanvas.height = window.innerHeight;
        nearCanvas.width = window.innerWidth;
        nearCanvas.height = window.innerHeight;
    }, []);

    useEffect(() => {
        resizeCanvas();
        animationFrameRef.current = requestAnimationFrame(animate);
        window.addEventListener('resize', resizeCanvas);

        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            window.removeEventListener('resize', resizeCanvas);
            snowflakesRef.current = [];
        };
    }, [animate, resizeCanvas]);

    return (
        <>
            {/* 远景层 - 小雪花，在卡片下方 */}
            <canvas
                ref={farCanvasRef}
                className="fixed inset-0 pointer-events-none z-[1]"
                style={{ background: 'transparent' }}
            />
            {/* 近景层 - 大雪花，在搜索框上方 */}
            <canvas
                ref={nearCanvasRef}
                className="fixed inset-0 pointer-events-none z-[100]"
                style={{ background: 'transparent' }}
            />
        </>
    );
}
