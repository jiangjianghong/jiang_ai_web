/**
 * Creates a falling tomato rain effect
 */
export const createTomatoRain = () => {
    // Create container for the rain
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';
    document.body.appendChild(container);

    // Tomato SVG (High quality, refined icon)
    const tomatoSvg = `
    <svg width="100%" height="100%" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="tomato-grad" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop stop-color="#FF6B6B" offset="0%"/>
                <stop stop-color="#EE5253" offset="100%"/>
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
        </defs>
        <path d="M16,5 C23,5 29,10 29,19 C29,27 23,30 16,30 C9,30 3,27 3,19 C3,10 9,5 16,5 Z" fill="url(#tomato-grad)" stroke="#C0392B" stroke-width="0.5"/>
        <path d="M16,5 C16,5 12,1 9,3 C9,3 13,8 14,9 C14,9 15,3 16,4 C17,3 18,9 18,9 C19,8 23,3 23,3 C20,1 16,5 16,5 Z" fill="#2ECC71" stroke="#27AE60" stroke-width="0.5"/>
        <ellipse cx="12" cy="12" rx="3" ry="1.5" fill="rgba(255,255,255,0.3)" transform="rotate(-45 12 12)"/>
    </svg>
    `;

    // Increased count slightly for better effect with smaller size
    const tomatoCount = 60;

    for (let i = 0; i < tomatoCount; i++) {
        const tomato = document.createElement('div');
        tomato.innerHTML = tomatoSvg;
        tomato.style.position = 'absolute';
        // Reduced size: 20-35px (was 20-40px + natural emoji padding which made it huge)
        const size = Math.random() * 15 + 15;
        tomato.style.width = `${size}px`;
        tomato.style.height = `${size}px`;
        tomato.style.left = `${Math.random() * 100}vw`;
        tomato.style.top = '-50px';
        tomato.style.opacity = '1';
        tomato.style.willChange = 'transform, top';

        // Random physics
        // Increased duration: 3-5 seconds (was 2-4s)
        const duration = Math.random() * 3 + 3;
        const delay = Math.random() * 3; // 0-3s delay
        const rotationStart = Math.random() * 360;
        const rotationEnd = rotationStart + Math.random() * 360 + 180;

        // Initial state
        tomato.style.transform = `rotate(${rotationStart}deg)`;

        container.appendChild(tomato);

        // Trigger animation
        requestAnimationFrame(() => {
            // Cubic-bezier for more natural "falling" acceleration
            tomato.style.transition = `top ${duration}s cubic-bezier(0.4, 0, 1, 1) ${delay}s, transform ${duration}s linear ${delay}s, opacity 0.5s ease-out ${duration + delay - 0.5}s`;
            tomato.style.top = `${window.innerHeight + 60}px`;
            tomato.style.transform = `rotate(${rotationEnd}deg)`;
            tomato.style.opacity = '0'; // Fade out at the very end
        });
    }

    // Cleanup - extended buffer to ensure all animations finish
    setTimeout(() => {
        if (document.body.contains(container)) {
            document.body.removeChild(container);
        }
    }, 10000); // 10s max duration
};
