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
    document.querySelectorAll('.publications-list-container').forEach((container) => {
        const cards = Array.from(container.querySelectorAll('.publication-item-card'));
        if (!cards.length) return;

        const dir = sortDirections[activeSortField] === 'desc' ? -1 : 1;
        const key = activeSortField === 'citations' ? 'citations' : 'year';

        cards
            .sort((a, b) => (Number(a.dataset[key]) - Number(b.dataset[key])) * dir)
            .forEach((card) => container.appendChild(card));
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
    
    // Theme Switcher & Prism Style Integration Engine (Zero Flash Architecture)
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    const themeIcon = themeToggleBtn ? themeToggleBtn.querySelector('i') : null;

    const currentTheme = htmlElement.getAttribute('data-theme') || 'dark';
    updateThemeIcon(currentTheme);
    syncPrismCodeTheme(currentTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
            syncPrismCodeTheme(newTheme);
        });
    }

    function updateThemeIcon(theme) {
        if (!themeIcon) return; // Guard clause against missing DOM nodes on specific views
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    function syncPrismCodeTheme(theme) {
        const prismLink = document.getElementById('prism-theme');
        if (!prismLink) return; // SAFE EXIT: Prevents code crashing on pages without code snippets!
        
        prismLink.href = theme === 'dark'
            ? '/assets/vendor/prism/prism-tomorrow.min.css'
            : '/assets/vendor/prism/prism.min.css';
    }

    // Wire up publication sorting where the list is present.
    if (document.getElementById('journal-papers-target')) {
        setupSortEventHandlers();
    }

    // Integrated Search Bar Logic
    const searchInput = document.getElementById('page-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const urlParamsNow = new URLSearchParams(window.location.search);
            const currentView = urlParamsNow.get('view') || 'root';

            if (document.querySelector('.project-showcase-grid') && !document.querySelector('.publication-item-card')) {
                const query = e.target.value.toLowerCase().trim();
                document.querySelectorAll('.project-grid-card').forEach(card => {
                    const text = card.textContent.toLowerCase();
                    card.style.display = text.includes(query) ? '' : 'none';
                });
            } else {
                // Publications: filter on the search pool rendered into each card.
                const query = e.target.value.toLowerCase().trim();
                document.querySelectorAll('.publication-item-card').forEach(card => {
                    const pool = card.dataset.search || card.textContent.toLowerCase();
                    card.style.display = pool.includes(query) ? '' : 'none';
                });
            }
        });
    }

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

    // Floating Scroll-To-Top Chip
    const scrollTopBtn = document.getElementById("scroll-to-top-btn");
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
            copyBtn.style.color = "#00f2fe";
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
                copyBtn.style.color = "";
            }, 2000);
        }).catch(err => console.error("Clipboard capture error: ", err));
        return;
    }
});