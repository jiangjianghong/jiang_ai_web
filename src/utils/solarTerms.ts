/**
 * 节气日期判断工具
 * 用于判断是否在立冬至立春期间（冬季）
 */

// 缓存结构
interface WinterSeasonCache {
    date: string; // 格式: YYYY-MM-DD
    isWinter: boolean;
}

let winterSeasonCache: WinterSeasonCache | null = null;

/**
 * 获取今天的日期字符串 (YYYY-MM-DD)
 */
const getTodayString = (): string => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

/**
 * 判断当前是否处于冬季（立冬至次年立春期间）
 * 
 * 立冬: 通常在每年 11 月 7-8 日
 * 立春: 通常在每年 2 月 3-5 日
 * 
 * 简化判断逻辑：11月7日至次年2月4日期间返回 true
 * 
 * 结果会缓存一天，避免重复计算
 * 
 * @returns 是否在冬季期间
 */
export const isWinterSeason = (): boolean => {
    const todayString = getTodayString();

    // 检查缓存是否有效
    if (winterSeasonCache && winterSeasonCache.date === todayString) {
        return winterSeasonCache.isWinter;
    }

    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const day = now.getDate();

    let isWinter = false;

    // 判断是否在冬季期间
    // 11月7日及之后 或 12月全月 或 1月全月 或 2月4日及之前
    if (month === 11 && day >= 7) {
        isWinter = true;
    } else if (month === 12) {
        isWinter = true;
    } else if (month === 1) {
        isWinter = true;
    } else if (month === 2 && day <= 4) {
        isWinter = true;
    }

    // 更新缓存
    winterSeasonCache = {
        date: todayString,
        isWinter,
    };

    return isWinter;
};

/**
 * 清除缓存（用于测试）
 */
export const clearWinterSeasonCache = (): void => {
    winterSeasonCache = null;
};
