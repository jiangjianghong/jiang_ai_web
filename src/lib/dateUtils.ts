// 日期工具函数 - 统一时区处理，避免前后端日期不一致问题
// 所有壁纸相关的日期计算都应该使用这个模块

/**
 * 获取中国时区 (UTC+8) 的当前日期对象
 * 使用 UTC 时间戳加 8 小时的方式，避免浏览器时区差异
 */
export function getChinaDate(date: Date = new Date()): Date {
    return new Date(date.getTime() + 8 * 60 * 60 * 1000);
}

/**
 * 获取中国时区 (UTC+8) 的日期字符串 (YYYY-MM-DD 格式)
 * 这是壁纸缓存键和日期检测的标准格式
 *
 * @example
 * // 假设 UTC 时间是 2025-12-15T23:30:00Z (北京时间 2025-12-16T07:30:00)
 * getLocalDateString() // 返回 "2025-12-16"
 */
export function getLocalDateString(date: Date = new Date()): string {
    const chinaTime = getChinaDate(date);

    const year = chinaTime.getUTCFullYear();
    const month = String(chinaTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(chinaTime.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * 比较两个日期是否是同一天（中国时区）
 */
export function isSameDay(date1: Date, date2: Date): boolean {
    return getLocalDateString(date1) === getLocalDateString(date2);
}

/**
 * 获取昨天的日期字符串（中国时区）
 */
export function getYesterdayDateString(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return getLocalDateString(yesterday);
}

/**
 * 检查给定的日期字符串是否是今天（中国时区）
 */
export function isToday(dateString: string): boolean {
    return dateString === getLocalDateString();
}

/**
 * 获取距离下一天的毫秒数（中国时区）
 * 用于计划在第二天刷新壁纸
 */
export function getMsUntilNextDay(): number {
    const now = getChinaDate();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return tomorrow.getTime() - now.getTime();
}
