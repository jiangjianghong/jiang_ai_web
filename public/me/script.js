// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {

    // =============== Swiper 3D卡片轮播初始化 ===============
    let hasAutoPlayed = false; // 标记是否已经自动播放过

    const projectSwiper = new Swiper('.projectSwiper', {
        effect: 'coverflow',
        grabCursor: true,
        centeredSlides: true,
        slidesPerView: 'auto',
        coverflowEffect: {
            rotate: 20,
            stretch: 0,
            depth: 300,
            modifier: 1,
            slideShadows: true,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        loop: true,
        speed: 800,
        autoplay: false, // 初始不自动播放
    });

    // 添加卡片3D鼠标跟随效果
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', function() {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });
    });

    // =============== 流星动画系统 ===============
    const meteorContainer = document.getElementById('meteorContainer');
    const welcomeText = document.querySelector('.welcome-text');
    let meteors = [];

    // 流星类
    class Meteor {
        constructor() {
            this.element = document.createElement('div');
            this.element.className = 'meteor';

            // 从屏幕右上方开始，向左下方飞行
            this.x = window.innerWidth * 0.7 + Math.random() * (window.innerWidth * 0.3);
            this.y = -100 - Math.random() * 100;

            // 速度（向左下）- 降低速度
            this.speedX = -(2 + Math.random() * 2); // 向左
            this.speedY = 1.5 + Math.random() * 1.5;     // 向下

            // 计算角度（用于视觉旋转，需要加90度因为流星是竖直的）
            this.angle = Math.atan2(this.speedY, this.speedX) * (180 / Math.PI) + 90;

            // 设置初始位置和角度
            this.element.style.left = this.x + 'px';
            this.element.style.top = this.y + 'px';
            this.element.style.transform = `rotate(${this.angle}deg)`;

            // 添加到容器
            meteorContainer.appendChild(this.element);

            // 淡入效果
            setTimeout(() => {
                this.element.style.opacity = '1';
            }, 50);

            this.active = true;
        }

        update() {
            if (!this.active) return false;

            // 按速度移动
            this.x += this.speedX;
            this.y += this.speedY;

            // 更新位置（保持角度不变）
            this.element.style.left = this.x + 'px';
            this.element.style.top = this.y + 'px';

            // 检测是否超出屏幕
            if (this.x < -100 || this.y > window.innerHeight + 100) {
                this.destroy();
                return false;
            }

            // 碰撞检测
            this.checkCollision();

            return true;
        }

        checkCollision() {
            const meteorRect = this.element.getBoundingClientRect();
            const textElements = welcomeText.querySelectorAll('.line');

            textElements.forEach(textElement => {
                const textRect = textElement.getBoundingClientRect();

                // 扩大文字碰撞区域，增加缓冲区
                const buffer = 15; // 增加15px的缓冲区
                const expandedTextRect = {
                    left: textRect.left - buffer,
                    right: textRect.right + buffer,
                    top: textRect.top - buffer,
                    bottom: textRect.bottom + buffer
                };

                // 检测流星头部的中心点
                const meteorHeadX = meteorRect.left + meteorRect.width / 2;
                const meteorHeadY = meteorRect.top + 2;

                // 检测点是否在扩大的文字区域内
                if (meteorHeadX >= expandedTextRect.left &&
                    meteorHeadX <= expandedTextRect.right &&
                    meteorHeadY >= expandedTextRect.top &&
                    meteorHeadY <= expandedTextRect.bottom) {
                    this.onCollision(textElement);
                }
            });
        }

        isColliding(rect1, rect2) {
            return !(
                rect1.right < rect2.left ||
                rect1.left > rect2.right ||
                rect1.bottom < rect2.top ||
                rect1.top > rect2.bottom
            );
        }

        onCollision(textElement) {
            // 创建流星碎裂效果
            this.createMeteorShatterEffect();

            // 销毁流星
            this.destroy();
        }

        createMeteorShatterEffect() {
            const rect = this.element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + 10; // 碰撞点

            // 创建多个碎片
            for (let i = 0; i < 8; i++) {
                const shard = document.createElement('div');
                shard.className = 'meteor-shard';

                shard.style.left = centerX + 'px';
                shard.style.top = centerY + 'px';

                // 随机飞散方向
                const angle = (i / 8) * Math.PI * 2;
                const distance = 50 + Math.random() * 80;
                const tx = Math.cos(angle) * distance;
                const ty = Math.sin(angle) * distance;
                const rotate = (Math.random() - 0.5) * 720;

                shard.style.setProperty('--tx', tx + 'px');
                shard.style.setProperty('--ty', ty + 'px');
                shard.style.setProperty('--rotate', rotate + 'deg');

                document.body.appendChild(shard);

                // 动画结束后移除
                setTimeout(() => {
                    shard.remove();
                }, 1000);
            }
        }

        destroy() {
            this.active = false;
            this.element.style.opacity = '0';
            setTimeout(() => {
                if (this.element.parentNode) {
                    this.element.remove();
                }
            }, 300);
        }
    }

    // 生成流星
    function createMeteor() {
        const meteor = new Meteor();
        meteors.push(meteor);
    }

    // 动画循环
    function animate() {
        meteors = meteors.filter(meteor => meteor.update());
        requestAnimationFrame(animate);
    }

    // 启动动画循环
    animate();

    // 监听键盘按键事件
    document.addEventListener('keydown', function(e) {
        // 只响应字母键 a-z 和 A-Z
        if ((e.key.length === 1 && /[a-zA-Z]/.test(e.key)) || e.code.startsWith('Key')) {
            createMeteor();
        }
    });

    // 监听鼠标左键点击事件
    document.addEventListener('mousedown', function(e) {
        // 只响应左键（button === 0）
        if (e.button === 0) {
            createMeteor();
        }
    });

    // =============== 原有代码 ===============

    // 滚动监听，实现页面切换效果
    let isScrolling = false;
    let currentPage = 1;
    const totalPages = 4;

    // 监听滚轮事件
    window.addEventListener('wheel', function(e) {
        if (isScrolling) return;

        const delta = e.deltaY;
        const threshold = 15; // 降低阈值，更灵敏

        // 向下滚动
        if (delta > threshold && currentPage < totalPages) {
            e.preventDefault();
            isScrolling = true;
            currentPage++;

            const targetPage = document.getElementById(`page${currentPage}`);
            targetPage.scrollIntoView({ behavior: 'smooth' });

            // 触发目标页面动画
            setTimeout(() => {
                activatePageAnimations(currentPage);
            }, 200); // 减少延迟

            setTimeout(() => {
                isScrolling = false;
            }, 600); // 缩短冷却时间
        }
        // 向上滚动
        else if (delta < -threshold && currentPage > 1) {
            e.preventDefault();
            isScrolling = true;
            currentPage--;

            const targetPage = document.getElementById(`page${currentPage}`);
            targetPage.scrollIntoView({ behavior: 'smooth' });

            setTimeout(() => {
                isScrolling = false;
            }, 600); // 缩短冷却时间
        }
    }, { passive: false });

    // 触发页面动画
    function activatePageAnimations(pageNum) {
        if (pageNum === 2) {
            activateTimelineAnimations();
        } else if (pageNum === 3) {
            activateProjectsAnimations();
        } else if (pageNum === 4) {
            activateContactAnimations();
        }
    }

    // 触发时间轴动画
    function activateTimelineAnimations() {
        const aboutContainer = document.querySelector('.about-container');
        const timelineItems = document.querySelectorAll('.timeline-item');

        aboutContainer.classList.add('active');

        timelineItems.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('active');
            }, index * 200);
        });
    }

    // 触发项目页动画
    function activateProjectsAnimations() {
        const projectsContainer = document.querySelector('.projects-container');
        projectsContainer.classList.add('active');

        // 首次进入时自动轮转提示
        if (!hasAutoPlayed) {
            hasAutoPlayed = true;

            // 延迟800ms后开始自动轮转
            setTimeout(() => {
                let autoPlayCount = 0;
                const maxAutoPlay = 3; // 自动播放3次

                const autoPlayInterval = setInterval(() => {
                    projectSwiper.slideNext();
                    autoPlayCount++;

                    if (autoPlayCount >= maxAutoPlay) {
                        clearInterval(autoPlayInterval);
                    }
                }, 100); // 每0.5秒切换一次
            }, 100);
        }
    }

    // 触发联系页动画
    function activateContactAnimations() {
        const contactContainer = document.querySelector('.contact-container');
        contactContainer.classList.add('active');
    }

    // 交叉观察器，用于检测元素是否进入视口
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.id === 'page2') {
                    activateTimelineAnimations();
                } else if (entry.target.id === 'page3') {
                    activateProjectsAnimations();
                } else if (entry.target.id === 'page4') {
                    activateContactAnimations();
                }
            }
        });
    }, observerOptions);

    // 观察所有页面
    observer.observe(document.getElementById('page2'));
    observer.observe(document.getElementById('page3'));
    observer.observe(document.getElementById('page4'));

    // 为时间轴项添加鼠标跟随效果
    const timelineItems = document.querySelectorAll('.timeline-content');

    timelineItems.forEach(item => {
        item.addEventListener('mousemove', function(e) {
            const rect = item.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const deltaX = (x - centerX) / centerX;
            const deltaY = (y - centerY) / centerY;

            item.style.transform = `translateX(10px) perspective(1000px) rotateY(${deltaX * 2}deg) rotateX(${-deltaY * 2}deg)`;
        });

        item.addEventListener('mouseleave', function() {
            item.style.transform = 'translateX(10px)';
        });
    });

    // 平滑滚动到页面顶部（刷新时）
    window.scrollTo({
        top: 0,
        behavior: 'instant'
    });

    // 添加键盘导航
    document.addEventListener('keydown', function(e) {
        if (isScrolling) return;

        // 向下箭头或空格键
        if ((e.key === 'ArrowDown' || e.key === ' ') && currentPage < totalPages) {
            e.preventDefault();
            currentPage++;
            const targetPage = document.getElementById(`page${currentPage}`);
            targetPage.scrollIntoView({ behavior: 'smooth' });
            isScrolling = true;

            setTimeout(() => {
                activatePageAnimations(currentPage);
            }, 300);

            setTimeout(() => {
                isScrolling = false;
            }, 1000);
        }
        // 向上箭头
        else if (e.key === 'ArrowUp' && currentPage > 1) {
            e.preventDefault();
            currentPage--;
            const targetPage = document.getElementById(`page${currentPage}`);
            targetPage.scrollIntoView({ behavior: 'smooth' });
            isScrolling = true;

            setTimeout(() => {
                isScrolling = false;
            }, 1000);
        }
    });

    // 添加触摸支持（移动端）
    let touchStartY = 0;
    let touchEndY = 0;

    document.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
        if (isScrolling) return;

        touchEndY = e.changedTouches[0].clientY;
        const deltaY = touchStartY - touchEndY;

        // 向上滑动（向下翻页）
        if (deltaY > 50 && currentPage < totalPages) {
            currentPage++;
            const targetPage = document.getElementById(`page${currentPage}`);
            targetPage.scrollIntoView({ behavior: 'smooth' });
            isScrolling = true;

            setTimeout(() => {
                activatePageAnimations(currentPage);
            }, 300);

            setTimeout(() => {
                isScrolling = false;
            }, 1000);
        }
        // 向下滑动（向上翻页）
        else if (deltaY < -50 && currentPage > 1) {
            currentPage--;
            const targetPage = document.getElementById(`page${currentPage}`);
            targetPage.scrollIntoView({ behavior: 'smooth' });
            isScrolling = true;

            setTimeout(() => {
                isScrolling = false;
            }, 1000);
        }
    }, { passive: true });

    // 添加页面可见性变化监听
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // 页面隐藏时暂停动画
        } else {
            // 页面可见时恢复动画
            if (currentPage === 2) {
                activateTimelineAnimations();
            }
        }
    });
});
