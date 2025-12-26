/**
 * 图片颜色分析工具
 * 使用 Canvas API 计算图片平均颜色
 * 支持缓存机制，避免重复计算
 */

export interface ColorAnalysisResult {
    r: number;
    g: number;
    b: number;
    brightness: number; // 0-255，越高越亮
    isLight: boolean; // 是否为浅色/白色调
}

interface CachedColorResult extends ColorAnalysisResult {
    timestamp: number; // 缓存时间戳
}

interface ColorCache {
    [key: string]: CachedColorResult;
}

const CACHE_KEY = 'wallpaper-color-cache';
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 缓存有效期7天

/**
 * 获取颜色缓存
 */
function getColorCache(): ColorCache {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        return cached ? JSON.parse(cached) : {};
    } catch {
        return {};
    }
}

/**
 * 保存颜色缓存
 */
function saveColorCache(cache: ColorCache): void {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
        console.warn('保存颜色缓存失败:', error);
    }
}

/**
 * 生成缓存键
 * - Bing 壁纸：使用日期作为键
 * - 自定义壁纸：使用壁纸 ID 作为键
 */
export function generateCacheKey(wallpaperId?: string): string {
    // 如果提供了壁纸 ID（自定义壁纸），直接使用
    if (wallpaperId) {
        return `custom:${wallpaperId}`;
    }

    // 对于 Bing 壁纸，使用当天日期作为键
    const today = new Date();
    const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return `bing:${dateKey}`;
}

/**
 * 从缓存获取颜色分析结果
 */
export function getCachedColorResult(cacheKey: string): ColorAnalysisResult | null {
    const cache = getColorCache();
    const cached = cache[cacheKey];

    if (!cached) {
        return null;
    }

    // 检查缓存是否过期
    if (Date.now() - cached.timestamp > CACHE_MAX_AGE) {
        // 缓存过期，删除并返回 null
        delete cache[cacheKey];
        saveColorCache(cache);
        return null;
    }

    const { timestamp, ...result } = cached;
    return result;
}

/**
 * 缓存颜色分析结果
 */
export function cacheColorResult(cacheKey: string, result: ColorAnalysisResult): void {
    const cache = getColorCache();

    // 清理过期缓存
    const now = Date.now();
    Object.keys(cache).forEach(key => {
        if (now - cache[key].timestamp > CACHE_MAX_AGE) {
            delete cache[key];
        }
    });

    // 添加新缓存
    cache[cacheKey] = {
        ...result,
        timestamp: now,
    };

    saveColorCache(cache);
}

/**
 * 删除指定缓存
 */
export function deleteCachedColorResult(cacheKey: string): void {
    const cache = getColorCache();
    if (cache[cacheKey]) {
        delete cache[cacheKey];
        saveColorCache(cache);
    }
}

/**
 * 清除所有颜色缓存
 */
export function clearAllColorCache(): void {
    try {
        localStorage.removeItem(CACHE_KEY);
    } catch (error) {
        console.warn('清除颜色缓存失败:', error);
    }
}

/**
 * 清除自定义壁纸的颜色缓存
 */
export function clearCustomWallpaperColorCache(wallpaperId: string): void {
    deleteCachedColorResult(`custom:${wallpaperId}`);
}

/**
 * 分析图片中心上方区域的平均颜色
 * 重点分析时间和搜索栏所在位置（水平20%-80%，垂直5%-40%）
 * 使用10x10采样点取平均，性能好且精准
 * 支持缓存，避免重复计算
 * @param imageUrl 图片 URL（可以是 blob URL 或普通 URL）
 * @param cacheKey 可选的缓存键，不传则每次都重新计算
 * @returns 颜色分析结果
 */
export async function analyzeImageColor(
    imageUrl: string,
    cacheKey?: string
): Promise<ColorAnalysisResult | null> {
    // 如果有缓存键，先尝试从缓存获取
    if (cacheKey) {
        const cached = getCachedColorResult(cacheKey);
        if (cached) {
            console.log('🎨 使用缓存的颜色分析结果:', cacheKey);
            return cached;
        }
    }

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

                // 使用 10x10 采样点分析中心上方区域
                const sampleSize = 10;
                canvas.width = sampleSize;
                canvas.height = sampleSize;

                // 定义中心上方区域（时间和搜索栏所在位置）
                // 水平：20% - 80%（中间60%）
                // 垂直：5% - 40%（上方35%）
                const sourceX = img.width * 0.2;
                const sourceY = img.height * 0.05;
                const sourceWidth = img.width * 0.6;
                const sourceHeight = img.height * 0.35;

                // 将中心区域绘制到小画布
                ctx.drawImage(
                    img,
                    sourceX, sourceY, sourceWidth, sourceHeight,
                    0, 0, sampleSize, sampleSize
                );

                // 获取所有采样点的像素数据
                const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
                const pixels = imageData.data;

                // 计算平均颜色
                let totalR = 0, totalG = 0, totalB = 0;
                const pixelCount = sampleSize * sampleSize;

                for (let i = 0; i < pixels.length; i += 4) {
                    totalR += pixels[i];
                    totalG += pixels[i + 1];
                    totalB += pixels[i + 2];
                }

                const r = Math.round(totalR / pixelCount);
                const g = Math.round(totalG / pixelCount);
                const b = Math.round(totalB / pixelCount);

                // 计算亮度（使用感知亮度公式）
                // 人眼对绿色更敏感，所以绿色权重更高
                const brightness = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

                // 判断是否为浅色：亮度 > 150 认为是浅色/偏亮
                // 由于只分析中心区域，阈值可以适当提高
                const isLight = brightness > 150;

                const result: ColorAnalysisResult = {
                    r,
                    g,
                    b,
                    brightness,
                    isLight,
                };

                // 缓存结果
                if (cacheKey) {
                    cacheColorResult(cacheKey, result);
                    console.log('🎨 缓存中心区域颜色分析结果:', cacheKey, result);
                }

                resolve(result);
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
 * 支持缓存
 * @param imageUrl 壁纸 URL
 * @param wallpaperId 可选的壁纸 ID（用于自定义壁纸缓存）
 * @returns 是否需要遮罩
 */
export async function shouldApplyOverlay(
    imageUrl: string,
    wallpaperId?: string
): Promise<boolean> {
    const cacheKey = generateCacheKey(wallpaperId);
    const result = await analyzeImageColor(imageUrl, cacheKey);

    if (!result) {
        // 分析失败时默认不应用遮罩
        return false;
    }

    console.log('🎨 壁纸中心区域颜色分析:', {
        cacheKey,
        rgb: `rgb(${result.r}, ${result.g}, ${result.b})`,
        brightness: result.brightness,
        isLight: result.isLight,
        note: '已优化为只分析中心上方区域（时间和搜索栏位置）',
    });

    return result.isLight;
}
