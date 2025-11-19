import { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { parseNotionUrl, isValidDatabaseId } from '@/lib/notionUrlParser';

interface WorkspaceSettingsProps {
  onClose: () => void;
  onConfigured: () => void;
}

export default function WorkspaceSettings({ onClose, onConfigured }: WorkspaceSettingsProps) {
  const { configureNotion, testConnection, clearConfiguration, isConfigured, getConfiguration } =
    useWorkspace();

  const [apiKey, setApiKey] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [databaseIdInput, setDatabaseIdInput] = useState(''); // 用户输入的原始内容
  const [parseResult, setParseResult] = useState<{ isValid: boolean; error?: string } | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // 加载现有配置
  useEffect(() => {
    const config = getConfiguration();
    if (config) {
      // 自动填充上次保存的配置
      setApiKey(config.apiKey || '');
      const savedDatabaseId = config.databaseId || '';
      setDatabaseId(savedDatabaseId);
      setDatabaseIdInput(savedDatabaseId); // 显示保存的数据库 ID
      if (savedDatabaseId) {
        setParseResult({ isValid: true });
      }
      console.log('✅ 已加载保存的工作空间配置');
    }
  }, [getConfiguration]);

  // 处理数据库 ID 输入变化
  const handleDatabaseIdChange = (input: string) => {
    setDatabaseIdInput(input);

    if (!input.trim()) {
      setDatabaseId('');
      setParseResult(null);
      return;
    }

    const result = parseNotionUrl(input);
    setParseResult({
      isValid: result.isValid,
      error: result.error,
    });

    if (result.isValid && result.databaseId) {
      setDatabaseId(result.databaseId);
    } else {
      setDatabaseId('');
    }
  };

  // 验证表单
  const isFormValid =
    apiKey.trim().length > 0 && databaseId.length > 0 && isValidDatabaseId(databaseId);

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
      configureNotion(apiKey.trim(), databaseId, undefined);

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
      configureNotion(apiKey.trim(), databaseId, undefined);
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
      setDatabaseIdInput('');
      setParseResult(null);
      setConnectionStatus('idle');
      setErrorMessage('');
    }
  };

  return (
    <div className="h-full flex flex-col select-none" style={{ userSelect: 'none' }}>
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

          <div className="flex items-center space-x-2">
            <a
              href="/help"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium flex items-center space-x-1"
            >
              <i className="fa-solid fa-book text-xs"></i>
              <span>设置指南</span>
            </a>

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
      </div>

      {/* 设置内容 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* 配置说明 */}
          {!isConfigured && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <i className="fa-solid fa-rocket text-blue-500 mt-0.5"></i>
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 mb-2">首次配置 Notion 工作空间</h4>
                  <p className="text-sm text-blue-800 mb-3">
                    需要创建 Notion Integration 并获取 API 密钥。我们为您准备了详细的设置指南。
                  </p>
                  <a
                    href="/help"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <i className="fa-solid fa-book text-xs"></i>
                    <span>查看完整设置指南</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {isConfigured && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <i className="fa-solid fa-check-circle text-green-500"></i>
                <div>
                  <h4 className="font-medium text-green-900">工作空间已配置</h4>
                  <p className="text-sm text-green-800 mt-1">
                    您可以修改下方的配置信息或重新测试连接。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 基础配置 */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">基础配置</h4>

            {/* 数据库 ID 输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">数据库 ID *</label>
              <input
                type="text"
                value={databaseIdInput}
                onChange={(e) => handleDatabaseIdChange(e.target.value)}
                placeholder="粘贴 Notion 分享链接或数据库 ID"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent text-sm ${
                  parseResult === null
                    ? 'border-gray-300 focus:ring-blue-500'
                    : parseResult.isValid
                      ? 'border-green-300 focus:ring-green-500 bg-green-50'
                      : 'border-red-300 focus:ring-red-500 bg-red-50'
                }`}
              />

              {/* 解析状态提示 */}
              {parseResult && (
                <div
                  className={`mt-2 p-2 rounded-lg text-xs ${
                    parseResult.isValid
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  {parseResult.isValid ? (
                    <div className="flex items-center space-x-1">
                      <i className="fa-solid fa-check-circle"></i>
                      <span>✅ 已成功提取数据库 ID: {databaseId}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <i className="fa-solid fa-exclamation-triangle"></i>
                      <span>❌ {parseResult.error}</span>
                    </div>
                  )}
                </div>
              )}

              <p className="mt-1 text-xs text-gray-500">
                支持粘贴完整的 Notion 分享链接，系统会自动提取数据库 ID
              </p>
            </div>

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
                从{' '}
                <a
                  href="https://www.notion.so/my-integrations"
                  target="_blank"
                  rel="noopener"
                  className="text-blue-500 hover:underline"
                >
                  Notion Integrations
                </a>{' '}
                获取
              </p>
            </div>
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
            <div
              className={`p-4 rounded-lg border ${
                connectionStatus === 'success'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <i
                  className={`fa-solid ${
                    connectionStatus === 'success'
                      ? 'fa-check-circle text-green-500'
                      : 'fa-times-circle text-red-500'
                  }`}
                ></i>
                <span
                  className={`text-sm font-medium ${
                    connectionStatus === 'success' ? 'text-green-700' : 'text-red-700'
                  }`}
                >
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
