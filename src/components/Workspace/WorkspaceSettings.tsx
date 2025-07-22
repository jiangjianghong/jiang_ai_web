import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface WorkspaceSettingsProps {
  onClose: () => void;
  onConfigured: () => void;
}

export default function WorkspaceSettings({ onClose, onConfigured }: WorkspaceSettingsProps) {
  const { configureNotion, testConnection, clearConfiguration, isConfigured } = useWorkspace();
  
  const [apiKey, setApiKey] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [corsProxy, setCorsProxy] = useState('enabled'); // 使用标记来启用代理
  const [customProxyUrl, setCustomProxyUrl] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(true); // 默认显示高级设置
  
  // 加载现有配置
  useEffect(() => {
    // 这里可以从 workspaceManager 获取现有配置
    // 但出于安全考虑，不显示 API 密钥
  }, []);

  // 验证表单
  const isFormValid = apiKey.trim().length > 0 && databaseId.trim().length > 0;

  // 获取代理配置
  const getProxyConfig = () => {
    switch (corsProxy) {
      case 'enabled':
        return 'enabled'; // 使用 corsproxy.io
      case 'supabase':
        return customProxyUrl || undefined;
      case 'custom':
        return customProxyUrl || undefined;
      default:
        return undefined; // 直连
    }
  };

  // 处理连接测试
  const handleTestConnection = async () => {
    if (!isFormValid) {
      setErrorMessage('请填写必要的配置信息');
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus('idle');
    setErrorMessage('');

    try {
      // 先配置连接
      const proxyConfig = getProxyConfig();
      configureNotion(apiKey.trim(), databaseId.trim(), proxyConfig);
      
      // 测试连接
      const isConnected = await testConnection();
      
      if (isConnected) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
        setErrorMessage('连接失败，请检查 API 密钥和数据库 ID 是否正确');
      }
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : '连接测试失败');
    } finally {
      setIsTestingConnection(false);
    }
  };

  // 保存配置
  const handleSave = async () => {
    if (!isFormValid) {
      setErrorMessage('请填写必要的配置信息');
      return;
    }

    try {
      const proxyConfig = getProxyConfig();
      configureNotion(apiKey.trim(), databaseId.trim(), proxyConfig);
      onConfigured();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '保存配置失败');
    }
  };

  // 清除配置
  const handleClearConfiguration = () => {
    if (confirm('确定要清除所有工作空间配置吗？这将删除缓存的数据。')) {
      clearConfiguration();
      setApiKey('');
      setDatabaseId('');
      setCorsProxy('');
      setConnectionStatus('idle');
      setErrorMessage('');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 设置头部 */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <i className="fa-solid fa-arrow-left text-sm"></i>
            </button>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">工作空间设置</h3>
              <p className="text-sm text-gray-500">配置 Notion 数据库连接</p>
            </div>
          </div>

          {isConfigured && (
            <button
              onClick={handleClearConfiguration}
              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
            >
              清除配置
            </button>
          )}
        </div>
      </div>

      {/* 设置内容 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* 配置说明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <i className="fa-solid fa-info-circle text-blue-500 mt-0.5"></i>
              <div>
                <h4 className="font-medium text-blue-900 mb-2">如何配置 Notion 工作空间？</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>访问 <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener" className="underline hover:text-blue-900">Notion Integrations</a> 创建新集成</li>
                  <li>复制生成的 API 密钥</li>
                  <li>在你的 Notion 数据库页面点击"Share"并添加你的集成</li>
                  <li>复制数据库 URL 中的 32 位数据库 ID</li>
                </ol>
              </div>
            </div>
          </div>

          {/* 基础配置 */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">基础配置</h4>
            
            {/* API 密钥输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notion API 密钥 *
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
              />
              <p className="mt-1 text-xs text-gray-500">
                从 <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener" className="text-blue-500 hover:underline">Notion Integrations</a> 获取
              </p>
            </div>

            {/* 数据库 ID 输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                数据库 ID *
              </label>
              <input
                type="text"
                value={databaseId}
                onChange={(e) => setDatabaseId(e.target.value)}
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
              />
              <p className="mt-1 text-xs text-gray-500">
                从数据库 URL 中提取的 32 位字符串
              </p>
            </div>
          </div>

          {/* 高级配置 */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <i className={`fa-solid ${showAdvanced ? 'fa-chevron-down' : 'fa-chevron-right'} text-xs`}></i>
              <span>高级配置</span>
            </button>

            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-4"
              >
                {/* CORS 代理设置 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      CORS 解决方案
                    </label>
                    <button
                      type="button"
                      onClick={() => setCorsProxy(corsProxy === 'enabled' ? '' : 'enabled')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ${
                        corsProxy === 'enabled' ? 'bg-blue-500 shadow-lg shadow-blue-200' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${
                          corsProxy === 'enabled' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="proxy-enabled"
                        name="corsProxy"
                        checked={corsProxy === 'enabled'}
                        onChange={() => setCorsProxy('enabled')}
                        className="text-blue-600"
                      />
                      <label htmlFor="proxy-enabled" className="text-sm text-gray-700">
                        使用公共代理 (corsproxy.io)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="proxy-supabase"
                        name="corsProxy"
                        checked={corsProxy === 'supabase'}
                        onChange={() => setCorsProxy('supabase')}
                        className="text-blue-600"
                      />
                      <label htmlFor="proxy-supabase" className="text-sm text-gray-700">
                        使用 Supabase Edge Functions（推荐）
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="proxy-custom"
                        name="corsProxy"
                        checked={corsProxy !== 'enabled' && corsProxy !== ''}
                        onChange={() => setCorsProxy('custom')}
                        className="text-blue-600"
                      />
                      <label htmlFor="proxy-custom" className="text-sm text-gray-700">
                        使用自定义代理服务器
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="proxy-disabled"
                        name="corsProxy"
                        checked={corsProxy === ''}
                        onChange={() => setCorsProxy('')}
                        className="text-blue-600"
                      />
                      <label htmlFor="proxy-disabled" className="text-sm text-gray-700">
                        直连（需要特殊浏览器设置）
                      </label>
                    </div>
                  </div>
                  
                  {corsProxy === 'supabase' && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800 mb-2">
                        <strong>Supabase 配置步骤：</strong>
                      </p>
                      <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                        <li>创建 Supabase 项目</li>
                        <li>部署 Edge Function 代理</li>
                        <li>在下方输入您的 Function URL</li>
                      </ol>
                      <input
                        type="url"
                        placeholder="https://your-project.supabase.co/functions/v1/notion-proxy"
                        value={customProxyUrl}
                        onChange={(e) => setCustomProxyUrl(e.target.value)}
                        className="w-full mt-2 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  )}
                  
                  {corsProxy === 'custom' && (
                    <div className="mt-3">
                      <input
                        type="url"
                        placeholder="https://your-proxy-server.com/api/notion"
                        value={customProxyUrl}
                        onChange={(e) => setCustomProxyUrl(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        输入您的自定义代理服务器地址
                      </p>
                    </div>
                  )}
                  
                  {corsProxy !== 'enabled' && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-700">
                        <strong>警告：</strong> 禁用代理后，浏览器会阻止直接访问 Notion API（CORS 错误）。
                        <br />除非使用特殊启动参数或服务器环境，否则连接会失败。
                        <br /><strong>强烈建议保持代理启用。</strong>
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* 错误信息 */}
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <i className="fa-solid fa-exclamation-triangle text-red-500 mt-0.5"></i>
                <div>
                  <p className="text-red-700 text-sm font-medium">配置错误</p>
                  <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* 连接状态 */}
          {connectionStatus !== 'idle' && (
            <div className={`p-4 rounded-lg border ${
              connectionStatus === 'success' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                <i className={`fa-solid ${
                  connectionStatus === 'success' ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-500'
                }`}></i>
                <span className={`text-sm font-medium ${
                  connectionStatus === 'success' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {connectionStatus === 'success' ? '连接成功！' : '连接失败'}
                </span>
              </div>
              {connectionStatus === 'success' && (
                <p className="text-green-600 text-sm mt-1">
                  Notion API 连接正常，可以开始同步工作空间数据
                </p>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <button
              onClick={handleTestConnection}
              disabled={!isFormValid || isTestingConnection}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTestingConnection ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span>测试中...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-plug"></i>
                  <span>测试连接</span>
                </>
              )}
            </button>

            <button
              onClick={handleSave}
              disabled={!isFormValid}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fa-solid fa-save"></i>
              <span>保存配置</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}