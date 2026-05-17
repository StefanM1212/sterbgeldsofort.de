/* =========================================
   Sterbegeld Sofort – Frontend Script
   ========================================= */

(function () {
    'use strict';

    /* ---------------------------------------
       Mobile menu toggle
       --------------------------------------- */
    const navToggle = document.getElementById('navToggle');
    const mainNav = document.getElementById('mainNav');
    const body = document.body;

    function closeNav() {
        if (!mainNav) return;
        mainNav.classList.remove('is-open');
        navToggle.classList.remove('is-active');
        navToggle.setAttribute('aria-expanded', 'false');
        body.classList.remove('no-scroll');
    }

    function openNav() {
        if (!mainNav) return;
        mainNav.classList.add('is-open');
        navToggle.classList.add('is-active');
        navToggle.setAttribute('aria-expanded', 'true');
        body.classList.add('no-scroll');
    }

    if (navToggle && mainNav) {
        navToggle.addEventListener('click', () => {
            if (mainNav.classList.contains('is-open')) {
                closeNav();
            } else {
                openNav();
            }
        });

        // Close menu when clicking a nav link
        mainNav.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => closeNav());
        });

        // Close menu on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeNav();
        });

        // Close menu when resizing to desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 960) closeNav();
        });
    }

    /* ---------------------------------------
       Sticky header shadow on scroll
       --------------------------------------- */
    const header = document.querySelector('.header');
    let lastScroll = 0;

    function onScroll() {
        const y = window.scrollY;
        if (y > 8) {
            header.style.boxShadow = '0 4px 16px rgba(20, 46, 92, 0.06)';
        } else {
            header.style.boxShadow = 'none';
        }
        lastScroll = y;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------------------------------------
       Smooth-scroll offset for sticky header
       --------------------------------------- */
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            if (targetId === '#' || targetId.length < 2) return;

            const target = document.querySelector(targetId);
            if (!target) return;

            e.preventDefault();
            const headerHeight = header.offsetHeight;
            const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 12;

            window.scrollTo({ top, behavior: 'smooth' });
        });
    });

    /* ---------------------------------------
       FAQ – ensure only one item open at a time
       --------------------------------------- */
    const faqItems = document.querySelectorAll('.faq__item');
    faqItems.forEach((item) => {
        item.addEventListener('toggle', () => {
            if (item.open) {
                faqItems.forEach((other) => {
                    if (other !== item) other.open = false;
                });
            }
        });
    });

    /* ---------------------------------------
       Forms – simple validation + success state
       --------------------------------------- */
    function showSuccess(form, message) {
        const success = document.createElement('div');
        success.className = 'form__success';
        success.textContent = message;
        form.replaceWith(success);
    }

    function validateForm(form) {
        let valid = true;
        const fields = form.querySelectorAll('input[required], select[required], textarea[required]');

        fields.forEach((field) => {
            field.classList.remove('form__error');

            if (!field.value.trim()) {
                field.classList.add('form__error');
                valid = false;
                return;
            }

            if (field.type === 'tel') {
                const cleaned = field.value.replace(/[^\d+]/g, '');
                if (cleaned.length < 6) {
                    field.classList.add('form__error');
                    valid = false;
                }
            }

            if (field.type === 'number') {
                const v = Number(field.value);
                const min = Number(field.min) || -Infinity;
                const max = Number(field.max) || Infinity;
                if (Number.isNaN(v) || v < min || v > max) {
                    field.classList.add('form__error');
                    valid = false;
                }
            }

            if (field.type === 'checkbox' && !field.checked) {
                field.classList.add('form__error');
                valid = false;
            }
        });

        return valid;
    }

    const LEAD_ENDPOINT = 'https://leadsammlung-johannehlers.rechnungenundlogins.workers.dev';

    const forms = document.querySelectorAll('form');
    forms.forEach((form) => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!validateForm(form)) {
                const firstError = form.querySelector('.form__error');
                if (firstError) firstError.focus();
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalLabel = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Wird gesendet …';
            }

            // Build payload from all named fields (incl. honeypot "website")
            const formData = new FormData(form);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });
            data.formType = form.id || 'unknown';
            data.submittedAt = new Date().toISOString();
            data.pageUrl = window.location.href;

            try {
                const response = await fetch(LEAD_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (!response.ok) throw new Error('Request failed: ' + response.status);

                showSuccess(
                    form,
                    'Vielen Dank! Johann Ehlers meldet sich innerhalb von 24 Stunden persönlich bei Ihnen.'
                );
            } catch (err) {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalLabel;
                }
                const errorBox = document.createElement('p');
                errorBox.className = 'form__hint';
                errorBox.style.color = 'var(--color-accent)';
                errorBox.textContent = 'Es gab ein Problem beim Senden. Bitte versuchen Sie es erneut oder rufen Sie uns an: 0176 – 547 387 63';
                form.appendChild(errorBox);
            }
        });

        // Clear error styling on input
        form.querySelectorAll('input, select, textarea').forEach((field) => {
            field.addEventListener('input', () => field.classList.remove('form__error'));
            field.addEventListener('change', () => field.classList.remove('form__error'));
        });
    });

    /* ---------------------------------------
       Reveal-on-scroll (light progressive enhancement)
       --------------------------------------- */
    if ('IntersectionObserver' in window) {
        const reveal = document.querySelectorAll(
            '.benefit, .problem__card, .step, .testimonial, .faq__item'
        );

        reveal.forEach((el) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(16px)';
            el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        });

        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                        io.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        );

        reveal.forEach((el) => io.observe(el));
    }
})();
