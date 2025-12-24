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

  const { loginWithNotion } = useAuth();

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

  // 处理 OAuth 登录
  const handleConnectNotion = async () => {
    try {
      await loginWithNotion();
    } catch (error) {
      setErrorMessage('去 Notion 登录失败，请重试');
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
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-8 shadow-sm text-center">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <i className="fa-brands fa-notion text-3xl text-gray-800 dark:text-white"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">连接 Notion 工作空间</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
                简单两步，将您的 Notion 数据库转变为强大的个人导航站。
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-left max-w-lg mx-auto">
                <div className="p-4 rounded-xl bg-white/50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700/50">
                  <div className="flex items-center mb-2">
                    <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-xs font-bold mr-2 text-gray-600 dark:text-gray-300">1</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">准备模板</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 ml-8">
                    复制 <button onClick={() => setShowGuide(true)} className="text-blue-600 dark:text-blue-400 hover:underline">官方模板</button> 到您的 Notion
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700/50">
                  <div className="flex items-center mb-2">
                    <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-xs font-bold mr-2 text-gray-600 dark:text-gray-300">2</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">授权连接</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 ml-8">
                    登录并选择刚才复制的页面
                  </p>
                </div>
              </div>

              <button
                onClick={handleConnectNotion}
                className="px-8 py-3 bg-gray-900 hover:bg-black text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <i className="fa-brands fa-notion mr-2"></i>
                前往 Notion 授权
              </button>
            </div>
          ) : (
            /* 2. 数据库选择 - 只在已连接时显示 */
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-sm animate-fadeIn">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center text-lg">
                  <span className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mr-3">
                    <i className="fa-solid fa-check"></i>
                  </span>
                  选择作为数据源的页面
                </h4>
                <button
                  onClick={handleConnectNotion}
                  className="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center"
                >
                  <i className="fa-solid fa-sync mr-1"></i>
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
                  <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar p-1">
                    {databases.map(db => (
                      <label
                        key={db.id}
                        className={`group flex items-center p-4 rounded-xl border cursor-pointer transition-all duration-200 ${selectedDatabaseId === db.id
                            ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-500/50 shadow-sm'
                            : 'border-transparent hover:bg-white/50 dark:hover:bg-gray-700/30 hover:shadow-sm'
                          }`}
                      >
                        <input
                          type="radio"
                          name="database"
                          className="hidden"
                          checked={selectedDatabaseId === db.id}
                          onChange={() => setSelectedDatabaseId(db.id)}
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mr-4 flex items-center justify-center transition-colors ${selectedDatabaseId === db.id
                            ? 'border-blue-500'
                            : 'border-gray-300 dark:border-gray-600 group-hover:border-blue-400'
                          }`}>
                          {selectedDatabaseId === db.id && <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium truncate transition-colors ${selectedDatabaseId === db.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'
                            }`}>{db.title}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 truncate font-mono mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity">ID: {db.id}</div>
                        </div>
                        <a
                          href={db.url}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-3 p-2 text-gray-300 hover:text-blue-500 dark:text-gray-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/10"
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
                    className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform active:scale-[0.98]"
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
                <div className="text-center py-8 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                  <p className="text-gray-600 dark:text-gray-300 mb-2">未找到可用的数据库页面</p>
                  <p className="text-xs text-gray-500 mb-5 px-4">请确认您已经在 Notion 中允许访问该页面</p>
                  <button
                    onClick={handleConnectNotion}
                    className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm"
                  >
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
