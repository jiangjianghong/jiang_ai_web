

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
          <div className="relative bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-800/60 backdrop-blur-xl border border-white/60 dark:border-gray-600/40 rounded-2xl p-6 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.2)] dark:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.4)] overflow-hidden group hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.25)] dark:hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] transition-all duration-300">
            {/* 顶部装饰渐变条 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-2xl"></div>

            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <i className="fa-solid fa-copy text-8xl text-indigo-500"></i>
            </div>

            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-lg shadow-indigo-500/30">
                  1
                </div>
                <h4 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  复制官方模板
                </h4>
              </div>

              <div className="ml-[52px]">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  为了确保应用能正确读取数据，请务必使用我们预设的官方模板。模板已预设所有必要的属性字段。
                </p>

                <div className="bg-white/70 dark:bg-gray-900/40 rounded-xl p-4 border border-gray-100/80 dark:border-gray-700/50 flex items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center">
                    <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center text-2xl mr-3 shadow-sm">
                      📄
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">
                        官方工作空间模板
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        包含所有必要字段配置
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleOpenTemplate}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-medium rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 flex items-center space-x-2 whitespace-nowrap transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span>打开并复制</span>
                    <i className="fa-solid fa-external-link-alt text-xs opacity-70"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 步骤 2: 连接并授权 */}
          <div className="relative bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-800/60 backdrop-blur-xl border border-white/60 dark:border-gray-600/40 rounded-2xl p-6 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.2)] dark:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.4)] overflow-hidden group hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.25)] dark:hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] transition-all duration-300">
            {/* 顶部装饰渐变条 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-t-2xl"></div>

            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <i className="fa-solid fa-link text-8xl text-green-500"></i>
            </div>

            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-lg shadow-green-500/30">
                  2
                </div>
                <h4 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  授权连接
                </h4>
              </div>

              <div className="ml-[52px] text-sm text-gray-600 dark:text-gray-300 space-y-4">
                <p>在点击连接按钮后，Notion 会询问您要授权哪些页面。</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-green-50/80 to-emerald-50/60 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl border border-green-200/60 dark:border-green-800/40 shadow-sm">
                    <div className="font-semibold text-green-700 dark:text-green-300 mb-1.5 flex items-center">
                      <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold mr-2">A</span>
                      选择页面
                    </div>
                    <p className="text-xs text-green-600/80 dark:text-green-400/80">
                      请务必勾选您刚刚复制的那个数据库页面。
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50/80 to-emerald-50/60 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl border border-green-200/60 dark:border-green-800/40 shadow-sm">
                    <div className="font-semibold text-green-700 dark:text-green-300 mb-1.5 flex items-center">
                      <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold mr-2">B</span>
                      自动识别
                    </div>
                    <p className="text-xs text-green-600/80 dark:text-green-400/80">
                      授权完成后，我们会自动识别该页面 ID，无需手动填写。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 常见问题 */}
          <div className="relative bg-gradient-to-br from-white/70 to-white/50 dark:from-gray-800/70 dark:to-gray-800/50 backdrop-blur-xl border border-white/50 dark:border-gray-600/30 rounded-2xl p-6 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)]">
            <h4 className="text-base font-bold text-gray-900 dark:text-white mb-5 flex items-center">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mr-2.5 shadow-md shadow-blue-500/20">
                <i className="fa-solid fa-circle-question text-white text-sm"></i>
              </span>
              配置相关问题
            </h4>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/50 dark:bg-gray-700/30 border border-gray-100/50 dark:border-gray-600/30 hover:bg-white/70 dark:hover:bg-gray-700/40 transition-colors">
                <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5 flex items-center">
                  <i className="fa-solid fa-user-pen text-blue-500 mr-2 text-xs"></i>
                  如何切换其他 Notion 账号？
                </h5>
                <p className="text-xs text-gray-500 dark:text-gray-400 ml-5 leading-relaxed">
                  点击设置页右上角的 <span className="text-red-500 font-medium">"断开连接"</span> 按钮，然后重新点击连接并选择不同的 Notion 账号登录即可。
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/50 dark:bg-gray-700/30 border border-gray-100/50 dark:border-gray-600/30 hover:bg-white/70 dark:hover:bg-gray-700/40 transition-colors">
                <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5 flex items-center">
                  <i className="fa-solid fa-database text-blue-500 mr-2 text-xs"></i>
                  如何更换绑定的数据库？
                </h5>
                <p className="text-xs text-gray-500 dark:text-gray-400 ml-5 leading-relaxed">
                  在已连接状态下，您可以直接在下方的数据库列表中点击切换。如果没有看到您想要的数据库，请点击列表上方的 "重新授权" 按钮，并确保在 Notion 授权页勾选了该页面。
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/50 dark:bg-gray-700/30 border border-gray-100/50 dark:border-gray-600/30 hover:bg-white/70 dark:hover:bg-gray-700/40 transition-colors">
                <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5 flex items-center">
                  <i className="fa-solid fa-laptop text-blue-500 mr-2 text-xs"></i>
                  更换电脑或浏览器需要重新配置吗？
                </h5>
                <p className="text-xs text-gray-500 dark:text-gray-400 ml-5 leading-relaxed">
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
