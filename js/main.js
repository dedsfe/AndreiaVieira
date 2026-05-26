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
    // Books carousel
    // ============================================================
    (function () {
        const carousel = document.getElementById('carousel');
        if (!carousel) return;

        const slides = carousel.querySelectorAll('.slide');
        const dots   = carousel.querySelectorAll('.dot');
        const bgLayer= document.querySelector('.books-bg-layer');
        const cur    = document.getElementById('bookCur');
        const prev   = carousel.querySelector('[data-action="prev"]');
        const next   = carousel.querySelector('[data-action="next"]');
        
        // Dynamically create backgrounds based on the covers
        const bgs = [];
        slides.forEach((slide, i) => {
            const bg = document.createElement('div');
            bg.className = `book-bg ${i === 0 ? 'is-active' : ''}`;
            
            // Clone the cover so the background matches exactly any image/content used
            const coverClone = slide.querySelector('.book-cover').cloneNode(true);
            bg.appendChild(coverClone);
            
            bgLayer.appendChild(bg);
            bgs.push(bg);
        });
        const total  = slides.length;
        let current  = 0;
        let locked   = false;

        function goTo(idx) {
            if (locked) return;
            idx = (idx + total) % total;
            if (idx === current) return;
            locked = true;

            slides.forEach((s, i) => s.classList.toggle('is-active', i === idx));
            dots.forEach((d, i)   => d.classList.toggle('is-active', i === idx));
            bgs.forEach((b, i)    => b.classList.toggle('is-active', i === idx));
            if (cur) cur.textContent = String(idx + 1).padStart(2, '0');

            current = idx;
            setTimeout(() => { locked = false; }, 750);
        }

        prev.addEventListener('click', () => goTo(current - 1));
        next.addEventListener('click', () => goTo(current + 1));
        dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));

        // Keyboard arrows when carousel is in viewport / focused
        document.addEventListener('keydown', (e) => {
            const rect = carousel.getBoundingClientRect();
            const inView = rect.top < window.innerHeight * 0.8 && rect.bottom > window.innerHeight * 0.2;
            if (!inView) return;
            if (e.key === 'ArrowLeft')  goTo(current - 1);
            if (e.key === 'ArrowRight') goTo(current + 1);
        });

        // Touch swipe
        let touchStartX = 0;
        carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });
        carousel.addEventListener('touchend', (e) => {
            const diff = e.changedTouches[0].clientX - touchStartX;
            if (Math.abs(diff) > 50) goTo(current + (diff < 0 ? 1 : -1));
        }, { passive: true });
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

        // Magnetic Button
        const magBtn = document.querySelector('.aww-magnetic-btn');
        if(magBtn) {
            magBtn.addEventListener('mousemove', (e) => {
                const rect = magBtn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                magBtn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
            });
            
            magBtn.addEventListener('mouseleave', () => {
                magBtn.style.transform = 'translate(0px, 0px)';
            });
        }

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
