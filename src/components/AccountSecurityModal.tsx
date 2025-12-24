import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { supabase } from '@/lib/supabase';

interface AccountSecurityModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AccountSecurityModal({ isOpen, onClose }: AccountSecurityModalProps) {
    const { currentUser, updatePassword, linkWithGoogle, linkWithGithub, linkWithNotion, unlinkIdentity, deleteAccount, getPrimaryEmail } = useAuth();
    const { displayName, updateDisplayName, avatarUrl, updateAvatar } = useUserProfile();

    // 使用 getPrimaryEmail 确保绑定 OAuth 后显示的主邮箱不变
    const primaryEmail = getPrimaryEmail();

    // 头像上传状态
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // 用户名编辑状态
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState('');
    const [nameError, setNameError] = useState('');
    const [nameLoading, setNameLoading] = useState(false);

    // 密码修改状态
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    // 当 displayName 更新时，同步更新 newName
    useEffect(() => {
        setNewName(displayName || '');
    }, [displayName]);

    // 重置表单状态
    const resetFormState = () => {
        setIsEditingName(false);
        setNewName(displayName || '');
        setNameError('');
        setShowChangePassword(false);
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
    };

    // 关闭弹窗
    const handleClose = () => {
        resetFormState();
        onClose();
    };

    // ESC键关闭弹窗
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    // 处理头像上传
    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!event.target.files || event.target.files.length === 0) {
                return;
            }

            const file = event.target.files[0];

            // 验证文件大小 (最大 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert('图片大小不能超过 2MB');
                return;
            }

            // 验证文件类型
            if (!file.type.startsWith('image/')) {
                alert('请上传图片文件');
                return;
            }

            setUploadingAvatar(true);

            // 生成唯一文件名
            const fileExt = file.name.split('.').pop();
            const fileName = `${currentUser?.id}/${Date.now()}.${fileExt}`;

            // 上传
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // 获取公开链接
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            // 更新资料
            const success = await updateAvatar(publicUrl);
            if (success) {
                alert('头像上传成功！');
            } else {
                throw new Error('更新头像失败');
            }

        } catch (error) {
            console.error('上传失败:', error);
            alert('上传失败: ' + (error as Error).message);
        } finally {
            setUploadingAvatar(false);
            // 清除 input value 以许重复上传同一文件
            const input = document.getElementById('avatar-upload') as HTMLInputElement;
            if (input) input.value = '';
        }
    };

    // 处理用户名保存
    const handleSaveName = async () => {
        if (!newName.trim()) {
            setNameError('用户名不能为空');
            return;
        }

        if (newName.length < 2 || newName.length > 20) {
            setNameError('用户名长度需在2-20个字符之间');
            return;
        }

        if (!/^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/.test(newName)) {
            setNameError('用户名只能包含字母、数字、中文、下划线和短横线');
            return;
        }

        setNameLoading(true);
        setNameError('');

        try {
            const success = await updateDisplayName(newName);
            if (success) {
                setIsEditingName(false);
                alert('用户名更新成功！');
            } else {
                setNameError('更新失败，请重试');
            }
        } catch (error) {
            setNameError('更新失败，请重试');
            console.error('更新用户名失败:', error);
        } finally {
            setNameLoading(false);
        }
    };

    // 处理用户名取消编辑
    const handleCancelName = () => {
        setNewName(displayName || '');
        setIsEditingName(false);
        setNameError('');
    };

    // 处理密码修改
    const handleChangePassword = async () => {
        setPasswordError('');

        if (!newPassword || !confirmPassword) {
            setPasswordError('请填写完整密码信息');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError('密码至少需要6位字符');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('两次输入的密码不一致');
            return;
        }

        setPasswordLoading(true);

        try {
            await updatePassword(newPassword);
            setNewPassword('');
            setConfirmPassword('');
            setShowChangePassword(false);
            alert('✅ 密码修改成功！');
        } catch (error) {
            console.error('修改密码失败:', error);
            setPasswordError((error as Error).message || '修改密码失败，请重试');
        } finally {
            setPasswordLoading(false);
        }
    };

    // 取消密码修改
    const handleCancelChangePassword = () => {
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
        setShowChangePassword(false);
    };

    if (!isOpen || !currentUser) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
                <motion.div
                    className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl z-50 max-h-[90vh] flex flex-col mx-4"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                >
                    {/* 头部 */}
                    <div className="p-6 pb-0">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <i className="fa-solid fa-shield-halved text-blue-600 dark:text-blue-400 text-2xl"></i>
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">账号与安全</h2>
                            </div>
                            <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    </div>

                    {/* 内容 */}
                    <div className="flex-1 px-6 py-4 space-y-5 overflow-y-auto">
                        {/* 个人资料 */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <i className="fa-solid fa-user text-xs"></i>
                                个人资料
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="relative group cursor-pointer" onClick={() => !uploadingAvatar && document.getElementById('avatar-upload')?.click()}>
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt="Avatar"
                                            className={`w-12 h-12 rounded-xl object-cover border border-gray-200 ${uploadingAvatar ? 'opacity-50' : ''}`}
                                        />
                                    ) : (
                                        <div className={`w-12 h-12 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 rounded-xl flex items-center justify-center shadow-sm ${uploadingAvatar ? 'opacity-50' : ''}`}>
                                            <i className="fa-solid fa-cat text-white text-lg"></i>
                                        </div>
                                    )}

                                    {/* Hover 遮罩 */}
                                    <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <i className={`fa-solid ${uploadingAvatar ? 'fa-spinner fa-spin' : 'fa-camera'} text-white text-sm`}></i>
                                    </div>

                                    <input
                                        type="file"
                                        id="avatar-upload"
                                        hidden
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        disabled={uploadingAvatar}
                                    />
                                </div>
                                <div className="flex-1">
                                    {isEditingName ? (
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                                                placeholder="请输入用户名"
                                                maxLength={20}
                                                disabled={nameLoading}
                                                autoFocus
                                            />
                                            {nameError && <p className="text-xs text-red-500">{nameError}</p>}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleSaveName}
                                                    disabled={nameLoading || !newName.trim()}
                                                    className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
                                                >
                                                    {nameLoading ? '...' : '保存'}
                                                </button>
                                                <button
                                                    onClick={handleCancelName}
                                                    disabled={nameLoading}
                                                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                                                >
                                                    取消
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium text-gray-800 dark:text-gray-100">{displayName || '用户'}</div>
                                                <div className="text-xs text-gray-400 dark:text-gray-500">{primaryEmail}</div>
                                            </div>
                                            <button
                                                onClick={() => setIsEditingName(true)}
                                                className="text-xs text-blue-500 hover:text-blue-600"
                                            >
                                                修改
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 分割线 */}
                        <div className="border-t border-gray-100 dark:border-gray-700"></div>

                        {/* 安全设置 */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <i className="fa-solid fa-key text-xs"></i>
                                安全设置
                            </h3>
                            {!showChangePassword ? (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700 dark:text-gray-200">登录密码</span>
                                    <button
                                        onClick={() => setShowChangePassword(true)}
                                        className="text-xs text-blue-500 hover:text-blue-600"
                                    >
                                        修改
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-700">修改密码</span>
                                        <button onClick={handleCancelChangePassword} className="text-xs text-gray-400 hover:text-gray-600">
                                            取消
                                        </button>
                                    </div>
                                    {passwordError && (
                                        <p className="text-xs text-red-500">{passwordError}</p>
                                    )}
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                                        placeholder="新密码（至少6位）"
                                    />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                                        placeholder="确认新密码"
                                    />
                                    <button
                                        onClick={handleChangePassword}
                                        disabled={passwordLoading || !newPassword || !confirmPassword}
                                        className="w-full py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded text-xs transition-colors"
                                    >
                                        {passwordLoading ? '修改中...' : '确认修改'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 分割线 */}
                        <div className="border-t border-gray-100 dark:border-gray-700"></div>

                        {/* 关联账号 */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <i className="fa-solid fa-link text-xs"></i>
                                关联账号
                            </h3>
                            <div className="space-y-2">
                                {/* Google */}
                                <div className="flex items-center justify-between py-1">
                                    <div className="flex items-center gap-2">
                                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                                        <span className="text-sm text-gray-700 dark:text-gray-200">Google</span>
                                        {currentUser.identities?.some(id => id.provider === 'google') && (
                                            <span className="text-xs text-green-500">已绑定</span>
                                        )}
                                    </div>
                                    {currentUser.identities?.some(id => id.provider === 'google') ? (
                                        <button
                                            onClick={() => window.confirm('确定要解绑 Google 账号吗？') && unlinkIdentity('google')}
                                            className="text-xs text-red-500 hover:text-red-600"
                                        >
                                            解绑
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => linkWithGoogle().catch((e: any) => alert('绑定失败: ' + (e.message || '未知错误')))}
                                            className="text-xs text-blue-500 hover:text-blue-600"
                                        >
                                            绑定
                                        </button>
                                    )}
                                </div>

                                {/* GitHub */}
                                <div className="flex items-center justify-between py-1">
                                    <div className="flex items-center gap-2">
                                        <i className="fa-brands fa-github text-sm text-gray-700"></i>
                                        <span className="text-sm text-gray-700 dark:text-gray-200">GitHub</span>
                                        {currentUser.identities?.some(id => id.provider === 'github') && (
                                            <span className="text-xs text-green-500">已绑定</span>
                                        )}
                                    </div>
                                    {currentUser.identities?.some(id => id.provider === 'github') ? (
                                        <button
                                            onClick={() => window.confirm('确定要解绑 GitHub 账号吗？') && unlinkIdentity('github')}
                                            className="text-xs text-red-500 hover:text-red-600"
                                        >
                                            解绑
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => linkWithGithub().catch((e: any) => alert('绑定失败: ' + (e.message || '未知错误')))}
                                            className="text-xs text-blue-500 hover:text-blue-600"
                                        >
                                            绑定
                                        </button>
                                    )}
                                </div>

                                {/* Notion */}
                                <div className="flex items-center justify-between py-1">
                                    <div className="flex items-center gap-2">
                                        <img src="https://www.notion.so/images/favicon.ico" alt="Notion" className="w-4 h-4" />
                                        <span className="text-sm text-gray-700 dark:text-gray-200">Notion</span>
                                        {currentUser.identities?.some(id => id.provider === 'notion') && (
                                            <span className="text-xs text-green-500">已绑定</span>
                                        )}
                                    </div>
                                    {currentUser.identities?.some(id => id.provider === 'notion') ? (
                                        <button
                                            onClick={() => window.confirm('确定要解绑 Notion 账号吗？') && unlinkIdentity('notion')}
                                            className="text-xs text-red-500 hover:text-red-600"
                                        >
                                            解绑
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => linkWithNotion().catch((e: any) => alert('绑定失败: ' + (e.message || '未知错误')))}
                                            className="text-xs text-blue-500 hover:text-blue-600"
                                        >
                                            绑定
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 分割线 */}
                        <div className="border-t border-gray-100 dark:border-gray-700"></div>

                        {/* 注销账号 */}
                        <div className="flex justify-center">
                            <button
                                onClick={async () => {
                                    if (window.confirm('警告：此操作将永久删除您的账号和所有数据！确定要继续吗？')) {
                                        const input = window.prompt('请输入 "DELETE" 以确认删除账号');
                                        if (input === 'DELETE') {
                                            await deleteAccount();
                                            handleClose();
                                        }
                                    }
                                }}
                                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <i className="fa-solid fa-trash-can text-[10px]"></i>
                                <span>注销账号</span>
                            </button>
                        </div>
                    </div>

                    {/* 底部 */}
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                            onClick={handleClose}
                            className="w-full py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm transition-colors"
                        >
                            关闭
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
