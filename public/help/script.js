// Simple and efficient script for documentation page
document.addEventListener('DOMContentLoaded', function() {

    // Image lazy loading with sequential loading
    const imageContainers = document.querySelectorAll('.image-container[data-src]');
    let currentImageIndex = 0;

    function loadImage(container) {
        const src = container.getAttribute('data-src');
        if (!src) return Promise.resolve();

        return new Promise((resolve) => {
            const img = document.createElement('img');
            img.className = 'loading';

            img.onload = function() {
                img.className = 'loaded';
                container.appendChild(img);
                // Remove the placeholder after image is loaded
                const placeholder = container.querySelector('.image-placeholder');
                if (placeholder) {
                    placeholder.remove();
                }
                container.removeAttribute('data-src');
                resolve();
            };

            img.onerror = function() {
                const placeholder = container.querySelector('.image-placeholder span');
                if (placeholder) {
                    placeholder.textContent = '图片加载失败';
                    placeholder.style.color = '#dc2626';
                }
                resolve(); // Continue loading other images even if one fails
            };

            img.src = src;
            img.alt = container.querySelector('.image-placeholder span')?.textContent || '';
        });
    }

    // Sequential image loading
    async function loadImagesSequentially() {
        for (const container of imageContainers) {
            await loadImage(container);
            // Add a small delay between loads to prevent overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    // Use Intersection Observer for viewport-based loading
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadImage(entry.target);
                    imageObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px'
        });

        imageContainers.forEach(container => {
            imageObserver.observe(container);
        });
    } else {
        // Fallback for older browsers
        loadImagesSequentially();
    }

    // Navigation highlighting
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-link');

    function updateNavigation() {
        const scrollPosition = window.scrollY + 100;

        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');

            if (scrollPosition >= top && scrollPosition < top + height) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    // Throttle scroll events
    let scrollTimer;
    window.addEventListener('scroll', function() {
        if (scrollTimer) return;

        scrollTimer = setTimeout(() => {
            updateNavigation();
            scrollTimer = null;
        }, 100);
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                const offset = target.offsetTop - 80;
                window.scrollTo({
                    top: offset,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Mobile navigation (if needed in future)
    const mobileBreakpoint = 1024;

    function checkMobile() {
        return window.innerWidth <= mobileBreakpoint;
    }

    // Handle resize events
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            // Adjust layout if needed
            if (checkMobile()) {
                document.body.classList.add('mobile');
            } else {
                document.body.classList.remove('mobile');
            }
        }, 250);
    });

    // Initial check
    if (checkMobile()) {
        document.body.classList.add('mobile');
    }
});

// Performance optimization: Load remaining images after initial content
window.addEventListener('load', function() {
    // Preload images that are likely to be viewed
    const imageContainers = document.querySelectorAll('.image-container[data-src]');
    const imagesToPreload = Array.from(imageContainers).slice(0, 3);

    imagesToPreload.forEach((container, index) => {
        setTimeout(() => {
            const src = container.getAttribute('data-src');
            if (src) {
                const img = new Image();
                img.src = src;
            }
        }, index * 500);
    });
});