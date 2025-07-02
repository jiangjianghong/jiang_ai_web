import { useState, useEffect } from 'react';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useAuth } from '@/contexts/AuthContext';

export default function UserNameEditor() {
  const { currentUser } = useAuth();
  const { displayName, updateDisplayName, loading: profileLoading } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(displayName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 当 displayName 更新时，同步更新 newName
  useEffect(() => {
    setNewName(displayName);
  }, [displayName]);

  // 如果用户未登录或邮箱未验证，不显示编辑器
  if (!currentUser || !currentUser.emailVerified) {
    return null;
  }

  const handleSave = async () => {
    if (!newName.trim()) {
      setError('用户名不能为空');
      return;
    }

    if (newName.length < 2 || newName.length > 20) {
      setError('用户名长度需在2-20个字符之间');
      return;
    }

    if (!/^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/.test(newName)) {
      setError('用户名只能包含字母、数字、中文、下划线和短横线');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await updateDisplayName(newName);
      if (success) {
        setIsEditing(false);
        alert('用户名更新成功！');
      } else {
        setError('更新失败，请重试');
      }
    } catch (error) {
      setError('更新失败，请重试');
      console.error('更新用户名失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setNewName(displayName);
    setIsEditing(false);
    setError('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">人类</span>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-blue-500 hover:text-blue-600"
            disabled={profileLoading}
          >
            <i className="fa-solid fa-edit mr-1"></i>
            编辑
          </button>
        )}
      </div>

        {isEditing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入用户名"
              maxLength={20}
              disabled={loading}
            />
            
            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
            
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                disabled={loading || !newName.trim()}
                className="text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-2 py-1 rounded"
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-1"></i>
                    保存中...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check mr-1"></i>
                    保存
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded"
              >
                <i className="fa-solid fa-times mr-1"></i>
                取消
              </button>
            </div>
            
            <p className="text-xs text-gray-500">
              支持中文、英文、数字、下划线和短横线，2-20个字符
            </p>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-user text-gray-400"></i>
            <span className="text-sm font-medium text-gray-800">
              {profileLoading ? '加载中...' : displayName}
            </span>
          </div>
        )}

        <div className="border-t border-gray-200 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <i className="fa-solid fa-envelope text-gray-400"></i>
              <span className="text-xs text-gray-600">{currentUser.email}</span>
            </div>
            <i className="fa-solid fa-check-circle text-green-500 text-xs" title="邮箱已验证"></i>
          </div>
        </div>
      </div>
  );
}
