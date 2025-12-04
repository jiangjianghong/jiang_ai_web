import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useUserStats } from '@/hooks/useUserStats';

interface WebsiteData {
  id: string;
  name: string;
  url: string;
  favicon?: string;
}

interface UserStatsDisplayProps {
  websites?: WebsiteData[];
}

export default function UserStatsDisplay({ websites = [] }: UserStatsDisplayProps) {
  const { stats, getTopCards, getDaysUsed, isSyncing, isLoggedIn } = useUserStats();

  const daysUsed = getDaysUsed();
  const topCards = getTopCards(5);

  // 将 cardId 映射到网站名称
  const topCardsWithNames = useMemo(() => {
    return topCards.map((item) => {
      const website = websites.find((w) => w.id === item.cardId);
      return {
        ...item,
        name: website?.name || '未知网站',
        favicon: website?.favicon,
      };
    });
  }, [topCards, websites]);

  // 计算平均每日使用
  const avgDailyVisits = daysUsed > 0 ? Math.round(stats.totalSiteVisits / daysUsed * 10) / 10 : 0;
  const avgDailySearches = daysUsed > 0 ? Math.round(stats.totalSearches / daysUsed * 10) / 10 : 0;

  return (
    <div className="space-y-6">
      {/* 云同步状态 */}
      {isLoggedIn && (
        <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg px-3 py-2 text-sm text-green-700">
          <i className={`fa-solid ${isSyncing ? 'fa-sync fa-spin' : 'fa-cloud-check'}`}></i>
          <span>{isSyncing ? '同步中...' : '统计数据已同步到云端'}</span>
        </div>
      )}

      {!isLoggedIn && (
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-500">
          <i className="fa-solid fa-cloud-slash"></i>
          <span>登录后可同步统计数据到云端</span>
        </div>
      )}

      {/* 使用概览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon="fa-solid fa-calendar-days"
          iconColor="text-blue-500"
          bgColor="bg-blue-50"
          label="使用天数"
          value={daysUsed}
          unit="天"
        />
        <StatCard
          icon="fa-solid fa-rocket"
          iconColor="text-purple-500"
          bgColor="bg-purple-50"
          label="应用启动"
          value={stats.appOpened}
          unit="次"
        />
        <StatCard
          icon="fa-solid fa-mouse-pointer"
          iconColor="text-green-500"
          bgColor="bg-green-50"
          label="网站访问"
          value={stats.totalSiteVisits}
          unit="次"
        />
        <StatCard
          icon="fa-solid fa-search"
          iconColor="text-orange-500"
          bgColor="bg-orange-50"
          label="搜索次数"
          value={stats.totalSearches}
          unit="次"
        />
      </div>

      {/* 今日统计 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <i className="fa-solid fa-sun text-yellow-500"></i>
          今日统计
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.todaySiteVisits}</div>
            <div className="text-xs text-gray-500">网站访问</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.todaySearches}</div>
            <div className="text-xs text-gray-500">搜索次数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.settingsOpened}</div>
            <div className="text-xs text-gray-500">设置打开</div>
          </div>
        </div>
      </div>

      {/* 平均使用 */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <i className="fa-solid fa-chart-line text-green-500"></i>
          日均统计
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-globe text-green-600"></i>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-800">{avgDailyVisits}</div>
              <div className="text-xs text-gray-500">日均访问网站</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-magnifying-glass text-orange-600"></i>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-800">{avgDailySearches}</div>
              <div className="text-xs text-gray-500">日均搜索次数</div>
            </div>
          </div>
        </div>
      </div>

      {/* 最常访问 TOP 5 */}
      {topCardsWithNames.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <i className="fa-solid fa-trophy text-amber-500"></i>
            最常访问 TOP 5
          </h4>
          <div className="space-y-2">
            {topCardsWithNames.map((item, index) => (
              <motion.div
                key={item.cardId}
                className="flex items-center gap-3 bg-white/60 rounded-lg p-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0
                      ? 'bg-yellow-400 text-yellow-900'
                      : index === 1
                        ? 'bg-gray-300 text-gray-700'
                        : index === 2
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                {item.favicon ? (
                  <img
                    src={item.favicon}
                    alt=""
                    className="w-5 h-5 rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center">
                    <i className="fa-solid fa-globe text-gray-400 text-xs"></i>
                  </div>
                )}
                <span className="flex-1 text-sm text-gray-700 truncate">{item.name}</span>
                <span className="text-xs text-gray-500 font-medium">{item.clicks} 次</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 首次使用日期 */}
      <div className="text-xs text-gray-500 px-1">
        <i className="fa-solid fa-clock-rotate-left mr-1"></i>
        首次使用: {stats.firstUseDate}
      </div>
    </div>
  );
}

// 统计卡片组件
interface StatCardProps {
  icon: string;
  iconColor: string;
  bgColor: string;
  label: string;
  value: number;
  unit: string;
}

function StatCard({ icon, iconColor, bgColor, label, value, unit }: StatCardProps) {
  return (
    <motion.div
      className={`${bgColor} rounded-xl p-4 text-center`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <i className={`${icon} ${iconColor} text-xl mb-2`}></i>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-500">
        {label} ({unit})
      </div>
    </motion.div>
  );
}
