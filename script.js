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

            const rawId = targetId.slice(1);

            // If the link points at a legal tab, activate that tab first
            // so the panel is visible before we scroll to it.
            if (rawId.startsWith('tab-')) {
                activateLegalTab(rawId);
            }

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
       Rechtliches – tab switching + deep-link
       --------------------------------------- */
    const tabButtons = document.querySelectorAll('.tabs__btn');
    const tabPanels = document.querySelectorAll('.tabs__panel');

    function activateLegalTab(panelId) {
        let matched = false;
        tabButtons.forEach((btn) => {
            const isMatch = btn.dataset.tab === panelId;
            btn.classList.toggle('is-active', isMatch);
            btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
            if (isMatch) matched = true;
        });
        tabPanels.forEach((panel) => {
            const isMatch = panel.id === panelId;
            panel.classList.toggle('is-active', isMatch);
            if (isMatch) {
                panel.removeAttribute('hidden');
            } else {
                panel.setAttribute('hidden', '');
            }
        });
        return matched;
    }

    tabButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            activateLegalTab(btn.dataset.tab);
        });
    });

    // Open the matching tab when arriving with #tab-* in the URL
    const initialHash = window.location.hash.replace('#', '');
    if (initialHash.startsWith('tab-')) {
        activateLegalTab(initialHash);
    }

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

    const LEAD_ENDPOINTS = [
        'https://leadsammlung-johannehlers.rechnungenundlogins.workers.dev'
    ];

    const SUCCESS_MSG = 'Vielen Dank! Johann Ehlers meldet sich innerhalb von 24 Stunden persönlich bei Ihnen.';

    const forms = document.querySelectorAll('form');
    forms.forEach((form) => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!validateForm(form)) {
                const firstError = form.querySelector('.form__error');
                if (firstError) firstError.focus();
                return;
            }

            // Honeypot: silently swallow bot submits so they never reach any endpoint
            const honeypot = form.querySelector('input[name="website"]');
            if (honeypot && honeypot.value.trim()) {
                showSuccess(form, SUCCESS_MSG);
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalLabel = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Wird gesendet …';
            }

            // Collect raw form fields
            const formData = new FormData(form);
            const raw = {};
            formData.forEach((value, key) => {
                raw[key] = value;
            });

            // Combine country dial code + local number into E.164
            // (so GHL doesn't fall back to +1/US default)
            function toE164(country, local) {
                if (!local) return '';
                let cleaned = String(local).replace(/[\s\-().]/g, '');
                if (cleaned.startsWith('+')) return cleaned;
                if (cleaned.startsWith('00')) return '+' + cleaned.slice(2);
                if (cleaned.startsWith('0')) cleaned = cleaned.slice(1);
                return (country || '+49') + cleaned;
            }

            const phoneE164 = toE164(
                raw.phoneCountry || raw.cPhoneCountry,
                raw.phone || raw.cPhone
            );

            // Normalize across the three form variants so GHL always receives
            // the same keys (name / phone / email / age / callbackTime / desiredSum)
            const data = {
                formType: form.id || 'unknown',
                submittedAt: new Date().toISOString(),
                pageUrl: window.location.href,
                name: raw.firstName || raw.cName || raw.oName || '',
                phone: phoneE164,
                phoneCountry: raw.phoneCountry || raw.cPhoneCountry || '',
                phoneRaw: raw.phone || raw.cPhone || '',
                email: raw.email || raw.oEmail || '',
                age: raw.age || raw.oAge || '',
                callbackTime: raw.cTime || '',
                desiredSum: raw.oSum || '',
                consent: !!(raw.cAgree || raw.oAgree),
                website: raw.website || ''
            };

            try {
                const results = await Promise.allSettled(
                    LEAD_ENDPOINTS.map((url) =>
                        fetch(url, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data)
                        })
                    )
                );

                const anyOk = results.some(
                    (r) => r.status === 'fulfilled' && r.value && r.value.ok
                );
                if (!anyOk) throw new Error('All endpoints failed');

                showSuccess(form, SUCCESS_MSG);
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
       Cookie consent banner + settings modal
       --------------------------------------- */
    const COOKIE_KEY = 'sgs_consent_v1';
    const banner = document.getElementById('cookieBanner');
    const modal = document.getElementById('cookieModal');
    const catAnalytics = document.getElementById('cookieCatAnalytics');
    const catMarketing = document.getElementById('cookieCatMarketing');

    function readConsent() {
        try {
            const raw = localStorage.getItem(COOKIE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function writeConsent(consent) {
        try {
            localStorage.setItem(COOKIE_KEY, JSON.stringify({
                ...consent,
                necessary: true,
                timestamp: new Date().toISOString(),
                version: 1
            }));
        } catch (e) {
            /* localStorage blocked – session-only consent */
        }
        applyConsent(consent);
        hideBanner();
        closeModal();
    }

    function applyConsent(consent) {
        // Hook for loading analytics / marketing pixels only after consent.
        // Tracking scripts (Google, Meta, HubSpot, GoHighLevel) should be
        // injected here based on consent.analytics / consent.marketing.
        window.__sgsConsent = consent;
        document.documentElement.dataset.consentAnalytics = consent.analytics ? '1' : '0';
        document.documentElement.dataset.consentMarketing = consent.marketing ? '1' : '0';
    }

    function showBanner() {
        if (!banner) return;
        banner.removeAttribute('hidden');
    }

    function hideBanner() {
        if (!banner) return;
        banner.setAttribute('hidden', '');
    }

    function openModal(prefill) {
        if (!modal) return;
        if (catAnalytics) catAnalytics.checked = !!(prefill && prefill.analytics);
        if (catMarketing) catMarketing.checked = !!(prefill && prefill.marketing);
        modal.removeAttribute('hidden');
        document.body.classList.add('cookie-open');
    }

    function closeModal() {
        if (!modal) return;
        modal.setAttribute('hidden', '');
        document.body.classList.remove('cookie-open');
    }

    const stored = readConsent();
    if (stored) {
        applyConsent(stored);
    } else {
        showBanner();
    }

    document.getElementById('cookieAccept')?.addEventListener('click', () => {
        writeConsent({ analytics: true, marketing: true });
    });
    document.getElementById('cookieReject')?.addEventListener('click', () => {
        writeConsent({ analytics: false, marketing: false });
    });
    document.getElementById('cookieSettings')?.addEventListener('click', () => {
        openModal(stored || { analytics: false, marketing: false });
    });

    document.getElementById('cookieAcceptModal')?.addEventListener('click', () => {
        writeConsent({ analytics: true, marketing: true });
    });
    document.getElementById('cookieRejectModal')?.addEventListener('click', () => {
        writeConsent({ analytics: false, marketing: false });
    });
    document.getElementById('cookieSaveModal')?.addEventListener('click', () => {
        writeConsent({
            analytics: !!(catAnalytics && catAnalytics.checked),
            marketing: !!(catMarketing && catMarketing.checked)
        });
    });

    modal?.querySelectorAll('[data-cookie-close]').forEach((el) => {
        el.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && !modal.hasAttribute('hidden')) {
            closeModal();
        }
    });

    document.getElementById('cookieReopen')?.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(readConsent() || { analytics: false, marketing: false });
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
