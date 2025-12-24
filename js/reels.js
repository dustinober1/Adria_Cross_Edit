/**
 * Adria Cross - Instagram Reels Showcase Logic
 * Handles lazy loading of iframes and horizontal scroll interactions.
 */

(function () {
    'use strict';

    const initReels = () => {
        const reelCards = document.querySelectorAll('.reel-card');
        const wrapper = document.querySelector('.reels-wrapper');

        if (reelCards.length === 0 || !wrapper) return;

        // 1. Intersection Observer for Lazy Loading
        const loadReel = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const card = entry.target;
                    const iframe = card.querySelector('iframe');

                    if (iframe && iframe.dataset.src) {
                        // Load iframe
                        iframe.src = iframe.dataset.src;
                        iframe.removeAttribute('data-src');

                        iframe.onload = () => {
                            iframe.classList.add('loaded');
                            const placeholder = card.querySelector('.reel-placeholder');
                            if (placeholder) {
                                // Fade out placeholder
                                placeholder.style.transition = 'opacity 0.5s ease';
                                placeholder.style.opacity = '0';
                                setTimeout(() => placeholder.remove(), 500);
                            }
                        };
                    }
                    observer.unobserve(card);
                }
            });
        };

        const observerOptions = {
            root: null, // use viewport
            rootMargin: '200px', // start loading before it enters
            threshold: 0.1
        };

        const observer = new IntersectionObserver(loadReel, observerOptions);
        reelCards.forEach(card => observer.observe(card));

        // 2. Drag to Scroll (Desktop support)
        let isDown = false;
        let startX;
        let scrollLeft;

        wrapper.addEventListener('mousedown', (e) => {
            if (e.target.closest('.reel-nav-btn')) return; // Don't drag if clicking buttons
            isDown = true;
            wrapper.classList.add('active');
            startX = e.pageX - wrapper.offsetLeft;
            scrollLeft = wrapper.scrollLeft;
        });

        wrapper.addEventListener('mouseleave', () => {
            isDown = false;
            wrapper.classList.remove('active');
        });

        wrapper.addEventListener('mouseup', () => {
            isDown = false;
            wrapper.classList.remove('active');
        });

        wrapper.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - wrapper.offsetLeft;
            const walk = (x - startX) * 2; // scroll-fast
            wrapper.scrollLeft = scrollLeft - walk;
        });

        // 3. Arrow Navigation Logic
        const prevBtn = document.getElementById('prevReel');
        const nextBtn = document.getElementById('nextReel');

        if (prevBtn && nextBtn) {
            nextBtn.addEventListener('click', () => {
                const cardWidth = reelCards[0].offsetWidth + 32; // width + gap
                wrapper.scrollBy({ left: cardWidth, behavior: 'smooth' });
            });

            prevBtn.addEventListener('click', () => {
                const cardWidth = reelCards[0].offsetWidth + 32; // width + gap
                wrapper.scrollBy({ left: -cardWidth, behavior: 'smooth' });
            });

            // Toggle button visibility based on scroll position
            const toggleButtons = () => {
                const isAtStart = wrapper.scrollLeft <= 5;
                const isAtEnd = wrapper.scrollLeft + wrapper.offsetWidth >= wrapper.scrollWidth - 5;

                prevBtn.style.opacity = isAtStart ? '0.3' : '1';
                prevBtn.style.pointerEvents = isAtStart ? 'none' : 'auto';

                nextBtn.style.opacity = isAtEnd ? '0.3' : '1';
                nextBtn.style.pointerEvents = isAtEnd ? 'none' : 'auto';
            };

            wrapper.addEventListener('scroll', toggleButtons);
            window.addEventListener('resize', toggleButtons);
            toggleButtons(); // Initial state
        }
    };

    // Run on init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initReels);
    } else {
        initReels();
    }
})();
