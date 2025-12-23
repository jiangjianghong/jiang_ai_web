interface NotionGuideProps {
  onClose: () => void;
}

export default function NotionGuide({ onClose }: NotionGuideProps) {
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    // 可以添加一个简单的提示
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* 指南头部 */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <i className="fa-solid fa-arrow-left text-sm"></i>
            </button>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Notion 设置指南</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">详细步骤帮您快速配置工作空间</p>
            </div>
          </div>
        </div>
      </div>

      {/* 指南内容 */}
      <div
        className="flex-1 overflow-y-auto px-6 py-6"
        style={{ maxHeight: 'calc(100vh - 160px)' }}
      >
        <div className="max-w-3xl space-y-8">
          {/* 步骤 1: 创建 Notion Integration */}
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                  创建 Notion Integration
                </h4>
                <div className="space-y-4 text-sm text-blue-800 dark:text-blue-200">
                  <div className="flex items-start space-x-2">
                    <span className="font-medium">1.1</span>
                    <div>
                      <p>前往 Notion 开发者页面：</p>
                      <div className="mt-2 flex items-center space-x-2">
                        <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs font-mono border dark:border-gray-600">
                          https://www.notion.so/my-integrations
                        </code>
                        <button
                          onClick={() => handleCopyText('https://www.notion.so/my-integrations')}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="复制链接"
                        >
                          <i className="fa-solid fa-copy text-xs"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <span className="font-medium">1.2</span>
                    <p>
                      点击 <strong>"+ New integration"</strong> 按钮
                    </p>
                  </div>

                  <div className="flex items-start space-x-2">
                    <span className="font-medium">1.3</span>
                    <div>
                      <p>填写 Integration 信息：</p>
                      <ul className="mt-1 ml-4 list-disc space-y-1">
                        <li>
                          <strong>Name:</strong> 自定义名称，如"我的工作空间"
                        </li>
                        <li>
                          <strong>Associated workspace:</strong> 选择您要同步的工作空间
                        </li>
                        <li>
                          <strong>Logo:</strong> 可选，上传一个图标
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <span className="font-medium">1.4</span>
                    <p>
                      点击 <strong>"Submit"</strong> 提交
                    </p>
                  </div>

                  <div className="flex items-start space-x-2">
                    <span className="font-medium">1.5</span>
                    <div>
                      <p>
                        在创建完成页面，复制 <strong>"Internal Integration Secret"</strong>
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        ⚠️ 这个密钥就是您的 API Key，请妥善保存
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 步骤 2: 创建数据库 */}
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3">创建或配置数据库</h4>
                <div className="space-y-4 text-sm text-green-800 dark:text-green-200">
                  <div className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-lg p-4">
                    <h5 className="font-medium text-green-900 dark:text-green-100 mb-2">选项 A: 创建新数据库</h5>
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <span className="font-medium">2A.1</span>
                        <p>
                          在 Notion 页面中输入 <code>/database</code> 创建新数据库
                        </p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="font-medium">2A.2</span>
                        <p>为数据库添加以下推荐属性：</p>
                      </div>
                      <div className="ml-8 bg-gray-50 rounded p-3">
                        <ul className="text-xs space-y-1">
                          <li>
                            <strong>Name</strong> (标题) - 工具/网站名称
                          </li>
                          <li>
                            <strong>URL</strong> (网址) - 访问链接
                          </li>
                          <li>
                            <strong>Description</strong> (富文本) - 工具描述
                          </li>
                          <li>
                            <strong>Category</strong> (选择) - 工具分类
                          </li>
                          <li>
                            <strong>Active</strong> (复选框) - 是否启用
                          </li>
                          <li>
                            <strong>Username</strong> (富文本) - 账号信息（可选）
                          </li>
                          <li>
                            <strong>Password</strong> (富文本) - 密码信息（可选）
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-lg p-4">
                    <h5 className="font-medium text-green-900 dark:text-green-100 mb-2">选项 B: 使用现有数据库</h5>
                    <p>
                      如果您已经有一个包含工具/网站信息的数据库，可以直接使用。只需确保有标题属性和URL属性即可。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 步骤 3: 连接 Integration */}
          <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3">
                  连接数据库到 Integration
                </h4>
                <div className="space-y-4 text-sm text-purple-800 dark:text-purple-200">
                  <div className="flex items-start space-x-2">
                    <span className="font-medium">3.1</span>
                    <p>
                      在您的数据库页面，点击右上角的 <strong>"···"</strong> (更多选项)
                    </p>
                  </div>

                  <div className="flex items-start space-x-2">
                    <span className="font-medium">3.2</span>
                    <p>
                      选择 <strong>"+ Add connections"</strong>
                    </p>
                  </div>

                  <div className="flex items-start space-x-2">
                    <span className="font-medium">3.3</span>
                    <p>找到并选择您在步骤1创建的 Integration</p>
                  </div>

                  <div className="flex items-start space-x-2">
                    <span className="font-medium">3.4</span>
                    <p>
                      点击 <strong>"Confirm"</strong> 确认连接
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-lg p-3 mt-4">
                    <div className="flex items-start space-x-2">
                      <i className="fa-solid fa-lightbulb text-purple-600 dark:text-purple-400 mt-0.5"></i>
                      <div>
                        <p className="font-medium text-purple-900 dark:text-purple-100">获取数据库 ID</p>
                        <p className="text-xs mt-1">
                          数据库连接成功后，您可以从浏览器地址栏复制完整的分享链接。
                          <br />
                          格式：
                          <code>
                            https://www.notion.so/22b197407c238188ace9fe148487a853?v=22b197407c23816c809f000c1b8ef117
                          </code>
                          <br />
                          <span className="text-green-600 dark:text-green-400">
                            ✨ 新功能：现在可以直接粘贴完整链接，系统会自动提取数据库 ID！
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 步骤 4: 配置工作空间 */}
          <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                4
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-3">配置工作空间连接</h4>
                <div className="space-y-4 text-sm text-orange-800 dark:text-orange-200">
                  <div className="flex items-start space-x-2">
                    <span className="font-medium">4.1</span>
                    <p>返回工作空间设置页面</p>
                  </div>

                  <div className="flex items-start space-x-2">
                    <span className="font-medium">4.2</span>
                    <p>
                      在 <strong>"Notion API Key"</strong> 输入框中粘贴步骤1.5获取的密钥
                    </p>
                  </div>

                  <div className="flex items-start space-x-2">
                    <span className="font-medium">4.3</span>
                    <p>
                      在 <strong>"Database ID"</strong> 输入框中粘贴步骤3.4获取的数据库ID
                    </p>
                  </div>

                  <div className="flex items-start space-x-2">
                    <span className="font-medium">4.4</span>
                    <p>
                      点击 <strong>"测试连接"</strong> 验证配置
                    </p>
                  </div>

                  <div className="flex items-start space-x-2">
                    <span className="font-medium">4.5</span>
                    <p>
                      连接成功后，点击 <strong>"保存配置"</strong> 完成设置
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 常见问题 */}
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <i className="fa-solid fa-question-circle mr-2 text-gray-600 dark:text-gray-400"></i>
              常见问题
            </h4>
            <div className="space-y-4">
              <div>
                <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-1">Q: 连接测试失败怎么办？</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  A: 请检查：1) API Key是否正确复制；2) 数据库ID格式是否正确（32位字符）；3)
                  Integration是否已连接到数据库；4) 网络连接是否正常。
                </p>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-1">Q: 找不到数据库ID？</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  A: 在数据库页面的URL中，database
                  ID位于工作空间名称后面，格式为32位字符串（包含数字和字母）。
                </p>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-1">Q: 数据同步不完整？</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  A: 请确保数据库中的属性名称与推荐配置匹配，特别是"Name"和"URL"属性是必需的。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部操作 */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            需要帮助？查看
            <a
              href="https://developers.notion.com/docs/create-a-notion-integration"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 ml-1"
            >
              Notion 官方文档
            </a>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            开始配置
          </button>
        </div>
      </div>
    </div>
  );
}
