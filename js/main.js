// Scroll reveal — single, gentle fade-up
    const reveals = document.querySelectorAll('.reveal, .step');
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
        reveals.forEach(el => io.observe(el));
    } else {
        reveals.forEach(el => el.classList.add('is-visible'));
    }

    // ============================================================
    // Books carousel (Swiper Coverflow)
    // ============================================================
    (function () {
        const swiperEl = document.querySelector('.mySwiper');
        if (!swiperEl || typeof Swiper === 'undefined') return;

        const bookInfos = document.querySelectorAll('.books-text-container .book-info');

        const swiper = new Swiper('.mySwiper', {
            effect: 'coverflow',
            grabCursor: true,
            centeredSlides: true,
            slidesPerView: 'auto',
            initialSlide: 0,
            coverflowEffect: {
                rotate: 0,
                stretch: 0,
                depth: 150,
                modifier: 1.5,
                slideShadows: true,
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            keyboard: {
                enabled: true,
            },
            on: {
                slideChange: function () {
                    const activeIndex = this.activeIndex;
                    
                    // Crossfade text
                    bookInfos.forEach((info, index) => {
                        if (index === activeIndex) {
                            info.classList.add('is-active');
                        } else {
                            info.classList.remove('is-active');
                        }
                    });
                }
            }
        });
    })();

    // ============================================================
    // Witnesses (Mulheres Curadas) — parallax + custom cursor
    // ============================================================
    (function () {
        const section = document.querySelector('.witnesses');
        if (!section) return;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isTouch = window.matchMedia('(hover: none)').matches;

        // --- Parallax: each photo frame moves at a slightly different Y speed.
        // Applied to .witness-frame (child) so it never collides with the
        // reveal transform on the .witness-item parent. The frame has a
        // 28px inset buffer, so translate is capped to ±20px to stay inside. ---
        if (!prefersReducedMotion) {
            const frames = section.querySelectorAll('.witness-item:not(.w-quote) .witness-frame');
            const speeds = [22, -28, 18, 14, -25, 26, 20];
            let ticking = false;

            function updateParallax() {
                const rect = section.getBoundingClientRect();
                const viewportH = window.innerHeight;
                const sectionCenter = rect.top + rect.height / 2;
                // Cap norm so the translate stays within the frame buffer
                const raw = (sectionCenter - viewportH / 2) / viewportH;
                const norm = Math.max(-0.7, Math.min(0.7, raw));

                frames.forEach((frame, i) => {
                    const speed = speeds[i % speeds.length];
                    frame.style.setProperty('--parallax-y', `${norm * speed}px`);
                });

                ticking = false;
            }

            window.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(updateParallax);
                    ticking = true;
                }
            }, { passive: true });

            updateParallax();
        }

        // --- Custom cursor over photos (desktop only) ---
        if (!isTouch && !prefersReducedMotion) {
            const cursor = section.querySelector('.witnesses-cursor');
            if (!cursor) return;

            const photoItems = section.querySelectorAll('.witness-item:not(.w-quote)');
            let mouseX = 0, mouseY = 0;
            let cursorX = 0, cursorY = 0;
            let active = false;

            // Smooth-follow with lerp for a premium feel
            function tickCursor() {
                cursorX += (mouseX - cursorX) * 0.22;
                cursorY += (mouseY - cursorY) * 0.22;
                cursor.style.left = cursorX + 'px';
                cursor.style.top  = cursorY + 'px';
                requestAnimationFrame(tickCursor);
            }

            document.addEventListener('mousemove', (e) => {
                mouseX = e.clientX;
                mouseY = e.clientY;
                if (!active) {
                    // Snap on first move so it doesn't slide from 0,0
                    cursorX = mouseX;
                    cursorY = mouseY;
                    active = true;
                }
            }, { passive: true });

            photoItems.forEach(item => {
                item.addEventListener('mouseenter', () => cursor.classList.add('is-visible'));
                item.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'));
                item.addEventListener('mousedown',  () => cursor.classList.add('is-clicking'));
                item.addEventListener('mouseup',    () => cursor.classList.remove('is-clicking'));
            });

            tickCursor();
        }

        // --- Lightbox: click a photo to enlarge with blurred backdrop ---
        const lightbox = section.querySelector('.witnesses-lightbox');
        if (lightbox) {
            const lbImg      = lightbox.querySelector('.lightbox-img');
            const lbNum      = lightbox.querySelector('.lightbox-num');
            const lbLabel    = lightbox.querySelector('.lightbox-label');
            const lbClose    = lightbox.querySelector('.lightbox-close');
            const lbBackdrop = lightbox.querySelector('.lightbox-backdrop');
            const html       = document.documentElement;
            const cursorEl   = section.querySelector('.witnesses-cursor');

            function openLightbox(item) {
                const img   = item.querySelector('img');
                const num   = item.querySelector('.witness-num');
                const label = item.querySelector('.witness-label');
                if (!img) return;

                lbImg.src   = img.src;
                lbImg.alt   = img.alt || '';
                lbNum.textContent   = num   ? num.textContent   : '';
                lbLabel.textContent = label ? label.textContent : '';

                lightbox.classList.add('is-open');
                lightbox.setAttribute('aria-hidden', 'false');
                html.classList.add('lightbox-locked');
                if (cursorEl) cursorEl.classList.remove('is-visible');
                lbClose.focus({ preventScroll: true });
            }

            function closeLightbox() {
                lightbox.classList.remove('is-open');
                lightbox.setAttribute('aria-hidden', 'true');
                html.classList.remove('lightbox-locked');
            }

            const photoItems = section.querySelectorAll('.witness-item:not(.w-quote)');
            photoItems.forEach(item => {
                item.addEventListener('click', () => openLightbox(item));
            });

            lbClose.addEventListener('click', closeLightbox);
            lbBackdrop.addEventListener('click', closeLightbox);

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && lightbox.classList.contains('is-open')) {
                    closeLightbox();
                }
            });
        }
    })();

// ============================================================
    // Awwwards Interactions & Nav
    // ============================================================
    (function(){
        // Hide/Show Nav on scroll
        const nav = document.getElementById('main-nav');
        let lastScrollY = window.scrollY;
        
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                // Scrolling down
                nav.classList.add('is-hidden');
            } else {
                // Scrolling up
                nav.classList.remove('is-hidden');
            }
            lastScrollY = currentScrollY;
        }, { passive: true });

        // 3D Tilt for cards
        const cards = document.querySelectorAll('.aww-card');
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = ((y - centerY) / centerY) * -10;
                const rotateY = ((x - centerX) / centerX) * 10;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            });
        });

        // ============================================================
        // FAQ Accordion Interaction
        // ============================================================
        const faqItems = document.querySelectorAll('.faq-item');
        faqItems.forEach(item => {
            const trigger = item.querySelector('.faq-trigger');
            const content = item.querySelector('.faq-content');
            
            trigger.addEventListener('click', () => {
                const isActive = item.classList.contains('is-active');
                
                // Close other items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('is-active');
                        otherItem.querySelector('.faq-trigger').setAttribute('aria-expanded', 'false');
                        otherItem.querySelector('.faq-content').style.maxHeight = null;
                        otherItem.querySelector('.faq-content').style.opacity = '0';
                    }
                });
                
                // Toggle current item
                if (isActive) {
                    item.classList.remove('is-active');
                    trigger.setAttribute('aria-expanded', 'false');
                    content.style.maxHeight = null;
                    content.style.opacity = '0';
                } else {
                    item.classList.add('is-active');
                    trigger.setAttribute('aria-expanded', 'true');
                    content.style.maxHeight = content.scrollHeight + 'px';
                    content.style.opacity = '1';
                }
            });
        });

        // ============================================================
        // Newsletter Form Handling
        // ============================================================
        const newsForm = document.getElementById('newsletterForm');
        const newsEmail = document.getElementById('newsletterEmail');
        const newsFeedback = document.getElementById('newsletterFeedback');
        const newsSuccess = document.getElementById('newsletterSuccess');
        const newsFormState = document.querySelector('.newsletter-form-state');
        
        if (newsForm) {
            newsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const emailVal = newsEmail.value.trim();
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                
                if (!emailVal || !emailRegex.test(emailVal)) {
                    newsEmail.style.borderColor = '#ff5252';
                    newsEmail.style.boxShadow = '0 0 16px rgba(255, 82, 82, 0.15)';
                    newsFeedback.style.opacity = '1';
                    
                    // Shake effect
                    newsForm.style.animation = 'none';
                    newsForm.offsetHeight; // trigger reflow
                    newsForm.style.animation = 'shake 0.4s ease';
                    return;
                }
                
                // Success: trigger animations
                newsEmail.style.borderColor = 'var(--gold)';
                newsFeedback.style.opacity = '0';
                
                // Fade out current form state
                newsFormState.style.opacity = '0';
                newsFormState.style.transform = 'translateY(-10px)';
                newsFormState.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                
                setTimeout(() => {
                    newsFormState.style.display = 'none';
                    
                    // Show success state
                    newsSuccess.style.display = 'block';
                    newsSuccess.offsetHeight; // trigger reflow
                    newsSuccess.style.opacity = '1';
                    newsSuccess.style.transform = 'scale(1)';
                }, 400);
            });
            
            // Clear errors on input
            newsEmail.addEventListener('input', () => {
                newsEmail.style.borderColor = '';
                newsEmail.style.boxShadow = '';
                newsFeedback.style.opacity = '0';
            });
        }
    })();


// ============================================================
// Preloader & Lenis Smooth Scroll Initialization
// ============================================================
window.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize Lenis
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: "vertical",
        gestureDirection: "vertical",
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    // Pause Lenis while preloader is active
    lenis.stop();

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    
    // 2. Awwwards Preloader Logic
    const preloader = document.getElementById("preloader");
    const prelPerc = document.getElementById("prel-perc");
    const body = document.body;

    // Trigger book cascade entry
    setTimeout(() => {
        preloader.classList.add("is-loaded");
    }, 100); // slight delay to ensure CSS transitions trigger

    // Custom Counter 0 -> 100
    let progress = 0;
    const duration = 2500; // 2.5 seconds total loading
    const start = performance.now();

    function updateCounter(currentTime) {
        const elapsed = currentTime - start;
        progress = Math.min(100, (elapsed / duration) * 100);
        
        // Custom easing (easeOutExpo)
        const easedProgress = progress === 100 ? 100 : 100 * (-Math.pow(2, -10 * progress / 100) + 1);
        prelPerc.textContent = Math.floor(easedProgress);

        if (progress < 100) {
            requestAnimationFrame(updateCounter);
        } else {
            // Reached 100%. Trigger fly-away exit!
            setTimeout(() => {
                preloader.classList.add("is-exiting");
                
                // Remove preloader from screen entirely after books fly away
                setTimeout(() => {
                    preloader.classList.add("is-hidden");
                    body.classList.remove("loading");
                    lenis.start(); // Unlock scroll
                }, 800); // 800ms before curtain up
            }, 300); // short wait at 100%
        }
    }
    requestAnimationFrame(updateCounter);
});
