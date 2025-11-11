// 文档加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化所有功能
    initThemeToggle();
    initSidebarToggle();
    initScrollNavigation();
    initBackToTop();
    initImageModal();
    initCopyButtons();
    initProgressIndicator();
    initSmoothScroll();

    // 主题切换功能
    function initThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        const currentTheme = localStorage.getItem('theme') || 'light';

        // 设置初始主题
        document.documentElement.setAttribute('data-theme', currentTheme);

        themeToggle.addEventListener('click', function() {
            const theme = document.documentElement.getAttribute('data-theme');
            const newTheme = theme === 'light' ? 'dark' : 'light';

            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);

            // 添加动画效果
            themeToggle.style.transform = 'rotate(180deg)';
            setTimeout(() => {
                themeToggle.style.transform = 'rotate(0deg)';
            }, 300);
        });
    }

    // 侧边栏切换功能
    function initSidebarToggle() {
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        let sidebarOpen = false;

        menuToggle.addEventListener('click', function() {
            sidebarOpen = !sidebarOpen;
            menuToggle.classList.toggle('active');
            sidebar.classList.toggle('active');

            // 添加背景遮罩
            if (sidebarOpen) {
                const overlay = document.createElement('div');
                overlay.className = 'sidebar-overlay';
                overlay.style.cssText = `
                    position: fixed;
                    top: 64px;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 997;
                    animation: fadeIn 0.3s ease-out;
                `;
                document.body.appendChild(overlay);

                overlay.addEventListener('click', function() {
                    sidebarOpen = false;
                    menuToggle.classList.remove('active');
                    sidebar.classList.remove('active');
                    overlay.remove();
                });
            } else {
                const overlay = document.querySelector('.sidebar-overlay');
                if (overlay) {
                    overlay.remove();
                }
            }
        });
    }

    // 滚动导航高亮功能
    function initScrollNavigation() {
        const sections = document.querySelectorAll('.content-section');
        const navLinks = document.querySelectorAll('.nav-link');

        // 创建观察器
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -70% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');

                    // 移除所有活动类
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                    });

                    // 添加当前活动类
                    const activeLink = document.querySelector(`.nav-link[href="#${id}"]`);
                    if (activeLink) {
                        activeLink.classList.add('active');
                    }
                }
            });
        }, observerOptions);

        // 观察所有部分
        sections.forEach(section => {
            observer.observe(section);
        });

        // 点击导航链接时关闭移动端侧边栏
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                if (window.innerWidth <= 1024) {
                    const menuToggle = document.getElementById('menuToggle');
                    const sidebar = document.getElementById('sidebar');
                    const overlay = document.querySelector('.sidebar-overlay');

                    menuToggle.classList.remove('active');
                    sidebar.classList.remove('active');
                    if (overlay) {
                        overlay.remove();
                    }
                }
            });
        });
    }

    // 返回顶部按钮功能
    function initBackToTop() {
        const backToTop = document.getElementById('backToTop');

        // 监听滚动事件
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTop.classList.add('show');
            } else {
                backToTop.classList.remove('show');
            }
        });

        // 点击返回顶部
        backToTop.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });

            // 添加点击动画
            backToTop.style.transform = 'scale(0.9)';
            setTimeout(() => {
                backToTop.style.transform = '';
            }, 200);
        });
    }

    // 图片模态框功能
    function initImageModal() {
        const modal = document.getElementById('imageModal');
        const modalImg = document.getElementById('modalImage');
        const modalCaption = document.getElementById('modalCaption');
        const modalClose = document.getElementById('modalClose');
        const images = document.querySelectorAll('.image-wrapper img');

        images.forEach(img => {
            img.addEventListener('click', function() {
                modal.classList.add('show');
                modalImg.src = this.src;
                modalImg.alt = this.alt;

                // 获取图片说明文字
                const caption = this.parentElement.querySelector('.image-caption');
                if (caption) {
                    modalCaption.textContent = caption.textContent;
                } else {
                    modalCaption.textContent = this.alt;
                }

                // 防止页面滚动
                document.body.style.overflow = 'hidden';
            });
        });

        // 关闭模态框
        function closeModal() {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }

        modalClose.addEventListener('click', closeModal);

        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });

        // ESC键关闭
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                closeModal();
            }
        });
    }

    // 代码复制功能
    function initCopyButtons() {
        const copyButtons = document.querySelectorAll('.copy-btn');

        copyButtons.forEach(btn => {
            btn.addEventListener('click', async function() {
                const code = this.getAttribute('data-code');

                try {
                    await navigator.clipboard.writeText(code);

                    // 显示复制成功
                    const originalText = this.textContent;
                    this.textContent = '已复制';
                    this.classList.add('copied');

                    setTimeout(() => {
                        this.textContent = originalText;
                        this.classList.remove('copied');
                    }, 2000);
                } catch (err) {
                    console.error('复制失败:', err);

                    // 降级方案
                    const textarea = document.createElement('textarea');
                    textarea.value = code;
                    textarea.style.position = 'fixed';
                    textarea.style.opacity = '0';
                    document.body.appendChild(textarea);
                    textarea.select();

                    try {
                        document.execCommand('copy');
                        this.textContent = '已复制';
                        this.classList.add('copied');

                        setTimeout(() => {
                            this.textContent = '复制';
                            this.classList.remove('copied');
                        }, 2000);
                    } catch (err) {
                        alert('复制失败，请手动复制');
                    }

                    document.body.removeChild(textarea);
                }
            });
        });
    }

    // 进度指示器功能
    function initProgressIndicator() {
        const progressIndicator = document.getElementById('progressIndicator');

        window.addEventListener('scroll', function() {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight - windowHeight;
            const scrolled = window.scrollY;
            const progress = (scrolled / documentHeight) * 100;

            progressIndicator.style.width = progress + '%';
        });
    }

    // 平滑滚动功能
    function initSmoothScroll() {
        // 为所有锚点链接添加平滑滚动
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));

                if (target) {
                    const offsetTop = target.offsetTop - 80; // 考虑固定头部高度

                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // 添加页面加载动画
    function initPageAnimations() {
        const sections = document.querySelectorAll('.content-section');

        const animateOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const animateObserver = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, animateOptions);

        sections.forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(20px)';
            section.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            animateObserver.observe(section);
        });
    }

    // 初始化页面动画
    initPageAnimations();

    // 处理窗口大小变化
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            // 在大屏幕上自动显示侧边栏
            const sidebar = document.getElementById('sidebar');
            const menuToggle = document.getElementById('menuToggle');
            const overlay = document.querySelector('.sidebar-overlay');

            if (window.innerWidth > 1024) {
                sidebar.classList.remove('active');
                menuToggle.classList.remove('active');
                if (overlay) {
                    overlay.remove();
                }
            }
        }, 250);
    });

    // 添加键盘快捷键支持
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + K 搜索快捷键（预留）
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            console.log('搜索功能待实现');
        }

        // Ctrl/Cmd + B 切换侧边栏
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            document.getElementById('menuToggle').click();
        }
    });

    // 图片懒加载优化
    if ('IntersectionObserver' in window) {
        const lazyImages = document.querySelectorAll('img[loading="lazy"]');

        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.style.opacity = '0';
                    img.addEventListener('load', () => {
                        img.style.transition = 'opacity 0.5s ease-out';
                        img.style.opacity = '1';
                    });
                    observer.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => {
            imageObserver.observe(img);
        });
    }

    // 打印优化
    window.addEventListener('beforeprint', function() {
        // 展开所有折叠的内容
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.style.display = 'none';
        }
    });

    window.addEventListener('afterprint', function() {
        // 恢复页面状态
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.style.display = '';
        }
    });

    // 性能监控（开发环境）
    if (window.location.hostname === 'localhost') {
        console.log('页面加载完成时间:', performance.now(), 'ms');

        // 监控长任务
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 50) {
                        console.warn('检测到长任务:', entry);
                    }
                }
            });

            try {
                observer.observe({ entryTypes: ['longtask'] });
            } catch (e) {
                console.log('长任务监控不可用');
            }
        }
    }
});

// 页面可见性变化处理
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // 页面不可见时暂停动画
        document.querySelectorAll('.animation').forEach(el => {
            el.style.animationPlayState = 'paused';
        });
    } else {
        // 页面可见时恢复动画
        document.querySelectorAll('.animation').forEach(el => {
            el.style.animationPlayState = 'running';
        });
    }
});

// 错误处理
window.addEventListener('error', function(e) {
    console.error('页面错误:', e);
});

// 确保图片加载失败时有备用方案
document.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG') {
        e.target.style.display = 'none';
        const placeholder = document.createElement('div');
        placeholder.className = 'image-error';
        placeholder.textContent = '图片加载失败';
        placeholder.style.cssText = `
            padding: 40px;
            background: var(--bg-tertiary);
            border-radius: var(--radius-md);
            text-align: center;
            color: var(--text-tertiary);
        `;
        e.target.parentElement.appendChild(placeholder);
    }
}, true);