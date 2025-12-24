import { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import NotionGuide from './NotionGuide';

interface WorkspaceSettingsProps {
  onClose: () => void;
  onConfigured: () => void;
}

interface DatabaseOption {
  id: string;
  title: string;
  url: string;
  type?: 'database' | 'page';
}

export default function WorkspaceSettings({ onClose, onConfigured }: WorkspaceSettingsProps) {
  const {
    configureWithOAuth,
    testConnection,
    clearConfiguration,
    isConfigured,
    getConfiguration,
    hasNotionOAuth,
    searchDatabases
  } = useWorkspace();

  const { linkWithNotion } = useAuth();

  // 状态
  const [databases, setDatabases] = useState<DatabaseOption[]>([]);
  const [selectedDatabaseId, setSelectedDatabaseId] = useState('');
  const [isLoadingDatabases, setIsLoadingDatabases] = useState(false);
  const [isNotionConnected, setIsNotionConnected] = useState(false);

  // 通用状态
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  // 初始化检查
  useEffect(() => {
    checkNotionConnection();

    // 加载已有配置
    const config = getConfiguration();
    if (config && config.mode !== 'api_key') {
      setSelectedDatabaseId(config.databaseId || '');
    }
  }, []);

  // 检查 OAuth 连接并加载数据库
  const checkNotionConnection = async () => {
    try {
      const connected = await hasNotionOAuth();
      setIsNotionConnected(connected);

      if (connected) {
        loadDatabases();
      }
    } catch (error) {
      console.error('检查 Notion 连接失败:', error);
    }
  };

  // 加载数据库列表
  const loadDatabases = async () => {
    setIsLoadingDatabases(true);
    setErrorMessage('');
    try {
      const dbs = await searchDatabases();
      setDatabases(dbs);

      // 如果只有一个数据库且未选中，自动选中
      if (dbs.length === 1 && !selectedDatabaseId) {
        setSelectedDatabaseId(dbs[0].id);
      }
    } catch (error) {
      console.error('加载数据库失败:', error);
    } finally {
      setIsLoadingDatabases(false);
    }
  };

  // 处理 OAuth 身份链接（不是登录，而是将 Notion 链接到当前用户）
  const handleConnectNotion = async () => {
    try {
      await linkWithNotion();
    } catch (error) {
      setErrorMessage('连接 Notion 失败，请重试');
    }
  };

  // 处理自动保存 (OAuth)
  const handleAutoSave = async () => {
    if (!selectedDatabaseId) {
      setErrorMessage('请选择一个数据库');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      await configureWithOAuth(selectedDatabaseId);

      // 测试连接
      const success = await testConnection();
      if (success) {
        onConfigured();
      } else {
        setErrorMessage('连接测试失败，请重试');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '配置失败');
    } finally {
      setIsProcessing(false);
    }
  };

  // 清除配置
  const handleClear = () => {
    if (confirm('确定要清除所有配置吗？')) {
      clearConfiguration();
      setSelectedDatabaseId('');
      window.location.reload();
    }
  };

  if (showGuide) {
    return <NotionGuide onClose={() => setShowGuide(false)} />;
  }

  return (
    <div className="h-full flex flex-col select-none">
      {/* 头部导航 - 透明背景 */}
      <div className="flex-shrink-0 px-6 pt-2 pb-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="group flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100/50 dark:bg-gray-800/50 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 flex items-center justify-center transition-colors">
              <i className="fa-solid fa-arrow-left text-sm"></i>
            </div>
            <span className="font-medium">返回列表</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowGuide(true)}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <i className="fa-solid fa-book-open mr-1.5"></i>
              设置指南
            </button>
            {isConfigured && (
              <button
                onClick={handleClear}
                className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                断开连接
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 内容区域 - 滚动 */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* 错误提示 */}
          {errorMessage && (
            <div className="p-4 bg-red-50/80 dark:bg-red-900/30 backdrop-blur-sm border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-3 animate-fadeIn">
              <i className="fa-solid fa-circle-exclamation text-red-500 mt-0.5"></i>
              <span className="text-sm text-red-800 dark:text-red-200">{errorMessage}</span>
            </div>
          )}

          {/* 1. 引导卡片 / 连接状态 */}
          {!isNotionConnected ? (
            <div className="relative bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-800/60 backdrop-blur-xl border border-white/60 dark:border-gray-600/40 rounded-2xl p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] text-center overflow-hidden group transition-all duration-300 hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.6)]">
              {/* 背景装饰光效 */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 dark:from-blue-500/10 dark:to-indigo-500/10 rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity"></div>

              <div className="relative z-10">
                <div className="w-20 h-20 mx-auto bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 ring-1 ring-blue-200/50 dark:ring-blue-700/30">
                  <span className="text-4xl font-black text-blue-600 dark:text-blue-400 font-serif">N</span>
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-800 dark:from-white dark:via-gray-200 dark:to-gray-300 bg-clip-text text-transparent mb-3">连接 Notion 工作空间</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed">
                  简单两步，将您的 Notion 数据库转变为强大的个人导航站。
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-left max-w-lg mx-auto">
                  <div className="p-4 rounded-xl bg-white/70 dark:bg-gray-700/40 border border-gray-100/80 dark:border-gray-600/40 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                    <div className="flex items-center mb-2">
                      <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-xs font-bold mr-2.5 text-blue-600 dark:text-blue-400 shadow-sm">1</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">准备模板</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-9">
                      复制 <button onClick={() => setShowGuide(true)} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">官方模板</button> 到您的 Notion
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/70 dark:bg-gray-700/40 border border-gray-100/80 dark:border-gray-600/40 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                    <div className="flex items-center mb-2">
                      <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-xs font-bold mr-2.5 text-blue-600 dark:text-blue-400 shadow-sm">2</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">授权连接</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-9">
                      登录并选择刚才复制的页面
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleConnectNotion}
                  className="px-8 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]"
                >
                  <i className="fa-solid fa-arrow-right mr-2"></i>
                  前往 Notion 授权
                </button>
              </div>
            </div>
          ) : (
            /* 2. 数据库选择 - 只在已连接时显示 */
            <div className="relative bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-800/60 backdrop-blur-xl border border-white/60 dark:border-gray-600/40 rounded-2xl p-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden animate-fadeIn">
              {/* 顶部装饰渐变条 */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-t-2xl"></div>

              <div className="flex items-center justify-between mb-6">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center text-lg">
                  <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 text-white flex items-center justify-center mr-3 shadow-lg shadow-green-500/30">
                    <i className="fa-solid fa-check"></i>
                  </span>
                  选择作为数据源的页面
                </h4>
                <button
                  onClick={handleConnectNotion}
                  className="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <i className="fa-solid fa-sync mr-1.5"></i>
                  切换账号或重试
                </button>
              </div>

              {isLoadingDatabases ? (
                <div className="py-12 text-center text-gray-500">
                  <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-sm">正在搜索授权的页面...</p>
                </div>
              ) : databases.length > 0 ? (
                <div className="space-y-6">
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
                    {databases.map(db => (
                      <label
                        key={db.id}
                        className={`group flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${selectedDatabaseId === db.id
                          ? 'bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-400/60 dark:border-blue-500/40 shadow-md shadow-blue-500/10 ring-1 ring-blue-400/20'
                          : 'border-transparent hover:bg-white/70 dark:hover:bg-gray-700/40 hover:shadow-md hover:border-gray-200/50 dark:hover:border-gray-600/50'
                          }`}
                      >
                        <input
                          type="radio"
                          name="database"
                          className="hidden"
                          checked={selectedDatabaseId === db.id}
                          onChange={() => setSelectedDatabaseId(db.id)}
                        />
                        <div className={`w-11 h-11 rounded-xl flex-shrink-0 mr-4 flex items-center justify-center transition-all duration-200 ${selectedDatabaseId === db.id
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:bg-gradient-to-br group-hover:from-blue-400 group-hover:to-indigo-500 group-hover:text-white group-hover:shadow-md'
                          }`}>
                          <i className={`fa-solid ${db.type === 'page' ? 'fa-file-lines' : 'fa-database'} text-lg`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className={`font-semibold truncate transition-colors ${selectedDatabaseId === db.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'
                              }`}>{db.title}</div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${db.type === 'page'
                              ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                              : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                              }`}>
                              {db.type === 'page' ? 'Page' : 'Database'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 truncate font-mono mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            ID: {db.id}
                            {db.type === 'page' && <span className="ml-2 text-orange-500"><i className="fa-solid fa-triangle-exclamation mr-1"></i>注意：这是页面，可能不包含数据</span>}
                          </div>
                        </div>
                        <a
                          href={db.url}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-3 p-2.5 text-gray-300 hover:text-blue-500 dark:text-gray-600 dark:hover:text-blue-400 transition-all rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:shadow-sm"
                          onClick={e => e.stopPropagation()}
                          title="在 Notion 中打开"
                        >
                          <i className="fa-solid fa-external-link-alt"></i>
                        </a>
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={handleAutoSave}
                    disabled={isProcessing || !selectedDatabaseId}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
                  >
                    {isProcessing ? (
                      <>
                        <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>
                        <span>配置中...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-check mr-2"></i>
                        <span>确认连接</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-center py-10 bg-gradient-to-br from-gray-50/80 to-gray-100/60 dark:from-gray-800/40 dark:to-gray-800/20 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <i className="fa-solid fa-database text-2xl text-gray-400 dark:text-gray-500"></i>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 font-medium mb-2">未找到可用的数据库页面</p>
                  <p className="text-xs text-gray-500 mb-6 px-4">请确认您已经在 Notion 中允许访问该页面</p>
                  <button
                    onClick={handleConnectNotion}
                    className="px-5 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                  >
                    <i className="fa-solid fa-sync mr-2"></i>
                    重新授权
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
