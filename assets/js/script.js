// ==========================================================================
// UNIVERSAL GLOBAL SCOPE VARIABLES & STATE CONTROLLER MATRICES
// ==========================================================================
let activeSortField = 'chrono'; // Options: 'chrono' | 'citations'
let sortDirections = {
    chrono: 'desc',    // 'desc' (Recent First) or 'asc' (Oldest First)
    citations: 'desc' // 'desc' (Highest First) or 'asc' (Lowest First)
};

// ==========================================
// 1. PUBLICATION SORTING
// ==========================================
// Publication cards are rendered by Jekyll from _data/publications.yml, so
// there is no BibTeX to fetch or parse here. Sorting reorders the nodes that
// are already on the page, using the year and citation count carried in their
// data attributes.

function sortPublications() {
    const reduce = window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.querySelectorAll('.publications-list-container').forEach((container) => {
        const cards = Array.from(container.querySelectorAll('.publication-item-card'));
        if (!cards.length) return;

        // FLIP: measure where every card is, reorder, then animate each one
        // from where it was to where it landed. Seeing a paper travel is the
        // point — it shows how far the new ordering moved it.
        const before = new Map(cards.map((c) => [c, c.getBoundingClientRect().top]));

        const bands = Array.from(container.querySelectorAll('.pub-year-band'));
        const byYear = activeSortField !== 'citations';
        const dir = sortDirections[activeSortField] === 'desc' ? -1 : 1;
        const key = byYear ? 'year' : 'citations';

        cards.sort((a, b) => (Number(a.dataset[key]) - Number(b.dataset[key])) * dir);

        if (byYear) {
            // Re-emit each band immediately ahead of the run of cards it heads,
            // so the headings follow the reader's chosen direction.
            const bandFor = new Map(bands.map((b) => [b.dataset.bandYear, b]));
            let last = null;
            cards.forEach((card) => {
                if (card.dataset.year !== last) {
                    last = card.dataset.year;
                    const head = bandFor.get(last);
                    if (head) {
                        head.hidden = false;
                        container.appendChild(head);
                    }
                }
                container.appendChild(card);
            });
        } else {
            // A chronological band over a citation ordering would be a lie.
            bands.forEach((band) => { band.hidden = true; });
            cards.forEach((card) => container.appendChild(card));
        }

        if (reduce || typeof Element.prototype.animate !== 'function') return;

        cards.forEach((card) => {
            const delta = before.get(card) - card.getBoundingClientRect().top;
            if (!delta) return;
            card.animate(
                [{ transform: `translateY(${delta}px)` }, { transform: 'none' }],
                { duration: 380, easing: 'cubic-bezier(.22,1,.36,1)' }
            );
        });
    });
}

function setupSortEventHandlers() {
    const btnChrono = document.getElementById('sort-chrono');
    const btnCitations = document.getElementById('sort-citations');
    if (!btnChrono || !btnCitations) return;

    function updateButtonVisuals() {
        [[btnChrono, 'chrono'], [btnCitations, 'citations']].forEach(([btn, field]) => {
            const active = activeSortField === field;
            btn.classList.toggle('sort-btn-active', active);
            btn.setAttribute('aria-pressed', String(active));

            const icon = btn.querySelector('.sort-icon');
            if (!icon) return;
            icon.style.display = active ? 'inline-block' : 'none';
            if (!active) return;
            icon.className = field === 'chrono'
                ? `sort-icon fas ${sortDirections.chrono === 'desc' ? 'fa-sort-numeric-down' : 'fa-sort-numeric-up-alt'}`
                : `sort-icon fas ${sortDirections.citations === 'desc' ? 'fa-sort-amount-down' : 'fa-sort-amount-up'}`;
        });
    }

    function activate(field) {
        if (activeSortField === field) {
            sortDirections[field] = sortDirections[field] === 'desc' ? 'asc' : 'desc';
        } else {
            activeSortField = field;
        }
        updateButtonVisuals();
        sortPublications();
    }

    btnChrono.addEventListener('click', () => activate('chrono'));
    btnCitations.addEventListener('click', () => activate('citations'));
    updateButtonVisuals();
}

// ==================================================================
// 2. LEGACY URL REDIRECTS
// ==================================================================
// Publications and software used to be query-string views of research.html.
// They are real pages now; keep the old links working.
(function redirectLegacyResearchViews() {
    if (!window.location.pathname.endsWith('/research.html')) return;
    const view = new URLSearchParams(window.location.search).get('view');
    const target = { publications: '/publications/', projects: '/software/' }[view];
    if (target) window.location.replace(target);
})();

// ==========================================
// 5. SECURE DOMCONTENTLOADED EVENT LIFECYCLE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // Theme switcher. Code colours come from the site stylesheet now, so there
    // is no separate syntax theme to swap.
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    const themeIcon = themeToggleBtn ? themeToggleBtn.querySelector('i') : null;

    const currentTheme = htmlElement.getAttribute('data-theme') || 'dark';
    updateThemeIcon(currentTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }

    function updateThemeIcon(theme) {
        if (!themeIcon) return; // Guard clause against missing DOM nodes on specific views
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }


    // Wire up publication sorting where the list is present.
    if (document.getElementById('journal-papers-target')) {
        setupSortEventHandlers();
    }

    // Search is handled site-wide by assets/js/search.js.

    // Off-Canvas Mobile Navigation Controls
    const menuToggleBtn = document.getElementById('mobile-menu-toggle');
    const navMenuLinks = document.querySelectorAll('.nav-menu a');

    if (menuToggleBtn) menuToggleBtn.addEventListener('click', toggleMobileSidebar);
    navMenuLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (document.body.classList.contains('sidebar-open')) toggleMobileSidebar();
        });
    });

    // Dynamic Footer timestamp calculation logic
    const dateTarget = document.getElementById("dynamic-update-date");
    if (dateTarget) {
        const lastMod = new Date(document.lastModified);
        dateTarget.textContent = lastMod.toLocaleString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    // Floating Scroll-To-Top Chip, and the article reading rail. Both answer
    // "where am I in this page", so they share one scroll listener.
    const scrollTopBtn = document.getElementById("scroll-to-top-btn");
    const progressFill = document.querySelector("#reading-progress > span");

    if (progressFill) {
        const drawProgress = () => {
            const travel = document.documentElement.scrollHeight - window.innerHeight;
            const done = travel > 0 ? (window.scrollY / travel) * 100 : 0;
            progressFill.style.width = Math.max(0, Math.min(100, done)) + "%";
        };
        window.addEventListener("scroll", drawProgress, { passive: true });
        window.addEventListener("resize", drawProgress, { passive: true });
        drawProgress();
    }

    if (scrollTopBtn) {
        const checkScrollPosition = () => {
            const currentScrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
            if (currentScrollY > 350) scrollTopBtn.classList.add("visible");
            else scrollTopBtn.classList.remove("visible");
        };
        window.addEventListener("scroll", checkScrollPosition, { passive: true });
        document.addEventListener("scroll", checkScrollPosition, { passive: true });

        scrollTopBtn.addEventListener("click", (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
            document.documentElement.scrollTo({ top: 0, behavior: "smooth" }); // Fallback track layout for older Safari iOS engines
        });
    }

    // Keyboard activation for clickable hub cards (role="button" divs)
    document.querySelectorAll('[role="button"]').forEach(el => {
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                el.click();
            }
        });
    });
});

// ==========================================
// 6. GLOBAL STATE POPS & DELEGATORS
// ==========================================
function toggleMobileSidebar() {
    const body = document.body;
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const toggleIcon = toggleBtn ? toggleBtn.querySelector('i') : null;

    const isOpen = body.classList.toggle('sidebar-open');

    if (toggleIcon) {
        toggleIcon.className = isOpen ? 'fas fa-xmark' : 'fas fa-bars';
    }
    // Tell assistive technology whether the drawer is open.
    if (toggleBtn) {
        toggleBtn.setAttribute('aria-expanded', String(isOpen));
    }
}

// The overlay used to carry an inline onclick in all eight page files.
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) overlay.addEventListener('click', toggleMobileSidebar);

    // Escape closes the drawer, which a click-only overlay did not allow.
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.body.classList.contains('sidebar-open')) {
            toggleMobileSidebar();
        }
    });
});

// Global scope Event Delegation system for dynamic layouts
document.addEventListener("click", (event) => {
    const absBtn = event.target.closest(".abs-toggle-btn");
    if (absBtn) {
        event.preventDefault();
        const drawer = document.getElementById(absBtn.getAttribute("aria-controls"));
        if (!drawer) return;
        const opening = drawer.hidden;
        drawer.hidden = !opening;
        absBtn.setAttribute("aria-expanded", String(opening));
        return;
    }

    const toggleBtn = event.target.closest(".cite-toggle-btn");
    if (toggleBtn) {
        event.preventDefault();
        const pubItem = toggleBtn.closest(".pub-item");
        const drawer = pubItem.querySelector(".citation-drawer");
        
        drawer.classList.toggle("expanded");
        toggleBtn.classList.toggle("active");
        
        if (drawer.classList.contains("expanded")) {
            drawer.style.maxHeight = drawer.scrollHeight + "px";
        } else {
            drawer.style.maxHeight = "0px";
        }
        return;
    }

    const copyBtn = event.target.closest(".copy-citation-btn");
    if (copyBtn) {
        event.preventDefault();
        const drawer = copyBtn.closest(".citation-drawer");
        const bibtexCode = drawer.querySelector(".bibtex-snippet").textContent;
        
        navigator.clipboard.writeText(bibtexCode).then(() => {
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> Copied!`;
            copyBtn.style.color = "var(--pos)";
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
                copyBtn.style.color = "";
            }, 2000);
        }).catch(err => console.error("Clipboard capture error: ", err));
        return;
    }
});

// ==========================================
// 7. STAGGERED REVEAL
// ==========================================
// Marks groups of sibling cards so each arrives just behind the last. Uses an
// IntersectionObserver rather than a scroll listener, reveals once, and does
// nothing at all when the reader has asked for reduced motion.
(function setupReveal() {
    const reduce = window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce || !('IntersectionObserver' in window)) {
        document.documentElement.classList.remove('js');
        return;
    }

    const GROUPS = [
        '.publications-list-container .publication-item-card',
        '.series-grid > .series-card',
        '.project-showcase-grid > .project-grid-card',
        '.blog-feed > .blog-post',
        '.cv-timeline > .cv-node',
        '.timeline-stream > .timeline-node',
        '.literature-list-container > *',
        '.catalog-matrix-container > .catalog-subcard'
    ];

    document.addEventListener('DOMContentLoaded', () => {
        const seen = new Map();

        GROUPS.forEach((selector) => {
            document.querySelectorAll(selector).forEach((el) => {
                const parent = el.parentElement;
                const n = seen.get(parent) || 0;
                seen.set(parent, n + 1);
                // Cap the stagger so a long list does not leave the last
                // entries waiting seconds to appear.
                el.style.setProperty('--reveal-delay', Math.min(n, 8) * 70 + 'ms');
                el.setAttribute('data-reveal', '');
            });
        });

        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-in');
                io.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });

        document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

        // Safety net. The worst failure this animation can have is leaving
        // content permanently invisible — an element that was display:none
        // when the observer ran (a filtered blog category, a hidden resource
        // panel) and never produced an intersection afterwards. Anything still
        // unrevealed after three seconds is shown regardless.
        window.setTimeout(() => {
            document.querySelectorAll('[data-reveal]:not(.is-in)').forEach((el) => {
                el.classList.add('is-in');
                io.unobserve(el);
            });
        }, 3000);
    });
})();
