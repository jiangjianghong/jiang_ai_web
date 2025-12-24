import { useState } from 'react';

interface NotionGuideProps {
  onClose: () => void;
  backText?: string;
}

export default function NotionGuide({ onClose, backText = '返回设置' }: NotionGuideProps) {
  const TEMPLATE_URL = 'https://www.notion.so/2d3197407c238022aee1f6714fa6371a?v=2d3197407c2381a9b63b000c41446d6b&source=copy_link';

  const handleOpenTemplate = () => {
    window.open(TEMPLATE_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="h-full flex flex-col select-none">
      {/* 头部导航 - 透明背景 */}
      <div className="flex-shrink-0 px-6 pt-2 pb-4">
        <button
          onClick={onClose}
          className="group flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gray-100/50 dark:bg-gray-800/50 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 flex items-center justify-center transition-colors">
            <i className="fa-solid fa-arrow-left text-sm"></i>
          </div>
          <span className="font-medium">{backText}</span>
        </button>
      </div>

      {/* 指南内容 */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">配置指南</h2>
            <p className="text-gray-500 dark:text-gray-400">只需两步，轻松连接您的 Notion 工作空间</p>
          </div>

          {/* 步骤 1: 复制模板 */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 relative overflow-hidden group hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-15 transition-opacity">
              <i className="fa-solid fa-copy text-8xl text-indigo-500"></i>
            </div>

            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-indigo-500 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-lg shadow-indigo-500/20">
                  1
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  复制官方模板
                </h4>
              </div>

              <div className="ml-11">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  为了确保应用能正确读取数据，请务必使用我们预设的官方模板。模板已预设所有必要的属性字段。
                </p>

                <div className="bg-white/50 dark:bg-gray-900/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50 flex items-center justify-between gap-4">
                  <div className="flex items-center">
                    <span className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl mr-3">
                      📄
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">
                        官方工作空间模板
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        包含所有必要字段字段配置
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleOpenTemplate}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-all shadow-md shadow-indigo-500/20 flex items-center space-x-2 whitespace-nowrap"
                  >
                    <span>打开并复制</span>
                    <i className="fa-solid fa-external-link-alt text-xs opacity-70"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 步骤 2: 连接并授权 */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 relative overflow-hidden group hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-15 transition-opacity">
              <i className="fa-solid fa-link text-8xl text-green-500"></i>
            </div>

            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-green-500 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-lg shadow-green-500/20">
                  2
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  授权连接
                </h4>
              </div>

              <div className="ml-11 text-sm text-gray-600 dark:text-gray-300 space-y-4">
                <p>在点击连接按钮后，Notion 会询问您要授权哪些页面。</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-green-50/50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-800/30">
                    <div className="font-semibold text-green-800 dark:text-green-300 mb-1">
                      A. 选择页面
                    </div>
                    <p className="text-xs opacity-80">
                      请务必勾选您刚刚复制的那个数据库页面。
                    </p>
                  </div>
                  <div className="bg-green-50/50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-800/30">
                    <div className="font-semibold text-green-800 dark:text-green-300 mb-1">
                      B. 自动识别
                    </div>
                    <p className="text-xs opacity-80">
                      授权完成后，我们会自动识别该页面 ID，无需手动填写。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 常见问题 */}
          <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-gray-200/30 dark:border-gray-700/30 rounded-2xl p-6">
            <h4 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <i className="fa-solid fa-circle-question text-blue-500 mr-2"></i>
              配置相关问题
            </h4>
            <div className="space-y-4">
              <div>
                <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">如何切换其他 Notion 账号？</h5>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  点击设置页右上角的 <span className="text-red-500">"断开连接"</span> 按钮，然后重新点击连接并选择这不同的 Notion 账号登录即可。
                </p>
              </div>
              <div>
                <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">如何更换绑定的数据库？</h5>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  在已连接状态下，您可以直接在下方的数据库列表中点击切换。如果没有看到您想要的数据库，请点击列表上方的 "重新授权" 按钮，并确保在 Notion 授权页勾选了该页面。
                </p>
              </div>
              <div>
                <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">更换电脑或浏览器需要重新配置吗？</h5>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  需要。为了安全，数据库配置仅保存在当前浏览器中。不过您的授权信息是云端保存的，在新设备上点击连接通常会自动识别，只需再次确认选择数据库即可。
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
