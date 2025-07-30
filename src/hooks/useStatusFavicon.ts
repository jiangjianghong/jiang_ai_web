import { useEffect } from 'react';

/**
 * 状态指示 favicon Hook - 根据应用状态改变图标
 */
export const useStatusFavicon = () => {
    const updateFavicon = (iconUrl: string) => {
        const links = document.querySelectorAll("link[rel*='icon']") as NodeListOf<HTMLLinkElement>;
        links.forEach(link => {
            link.href = iconUrl;
        });
    };

    const setDefaultIcon = () => {
        updateFavicon('/icon/icon.jpg');
    };

    const setLoadingIcon = () => {
        // 可以是一个加载中的图标
        updateFavicon('/icon/loading.png');
    };

    const setNotificationIcon = () => {
        // 可以是一个有红点的图标，表示有通知
        updateFavicon('/icon/notification.png');
    };

    const setErrorIcon = () => {
        // 可以是一个错误状态的图标
        updateFavicon('/icon/error.png');
    };

    // 根据页面可见性自动切换
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // 页面隐藏时可以显示特殊图标
                setNotificationIcon();
            } else {
                // 页面显示时恢复默认图标
                setDefaultIcon();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return {
        setDefaultIcon,
        setLoadingIcon,
        setNotificationIcon,
        setErrorIcon
    };
};