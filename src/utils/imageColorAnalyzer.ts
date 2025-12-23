/**
 * 图片颜色分析工具
 * 使用 Canvas API 计算图片平均颜色
 */

export interface ColorAnalysisResult {
    r: number;
    g: number;
    b: number;
    brightness: number; // 0-255，越高越亮
    isLight: boolean; // 是否为浅色/白色调
}

/**
 * 分析图片的平均颜色
 * 使用缩放到 1x1 像素取平均值的方式，非常轻量
 * @param imageUrl 图片 URL（可以是 blob URL 或普通 URL）
 * @returns 颜色分析结果
 */
export async function analyzeImageColor(imageUrl: string): Promise<ColorAnalysisResult | null> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // 允许跨域读取像素

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    console.warn('无法获取 Canvas 2D 上下文');
                    resolve(null);
                    return;
                }

                // 缩放到 1x1 像素，让浏览器自动计算平均颜色
                canvas.width = 1;
                canvas.height = 1;

                // 绘制图片到 1x1 画布
                ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, 1, 1);

                // 获取像素数据
                const imageData = ctx.getImageData(0, 0, 1, 1);
                const [r, g, b] = imageData.data;

                // 计算亮度（使用感知亮度公式）
                // 人眼对绿色更敏感，所以绿色权重更高
                const brightness = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

                // 判断是否为浅色：亮度 > 140 认为是浅色/偏亮（更宽松的阈值）
                const isLight = brightness > 140;

                resolve({
                    r,
                    g,
                    b,
                    brightness,
                    isLight,
                });
            } catch (error) {
                console.warn('分析图片颜色失败:', error);
                resolve(null);
            }
        };

        img.onerror = () => {
            console.warn('加载图片失败，无法分析颜色');
            resolve(null);
        };

        // 设置超时
        setTimeout(() => {
            resolve(null);
        }, 5000);

        img.src = imageUrl;
    });
}

/**
 * 判断当前壁纸是否需要遮罩（偏白色）
 * @param imageUrl 壁纸 URL
 * @returns 是否需要遮罩
 */
export async function shouldApplyOverlay(imageUrl: string): Promise<boolean> {
    const result = await analyzeImageColor(imageUrl);

    if (!result) {
        // 分析失败时默认不应用遮罩
        return false;
    }

    console.log('🎨 壁纸颜色分析:', {
        rgb: `rgb(${result.r}, ${result.g}, ${result.b})`,
        brightness: result.brightness,
        isLight: result.isLight,
    });

    return result.isLight;
}
