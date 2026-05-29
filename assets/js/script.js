// ==========================================================================
// UNIVERSAL GLOBAL SCOPE VARIABLES & STATE CONTROLLER MATRICES
// ==========================================================================
let cachedGlobalEntries = []; 
let activeSortField = 'chrono'; // Options: 'chrono' | 'citations'
let sortDirections = {
    chrono: 'desc',    // 'desc' (Recent First) or 'asc' (Oldest First)
    citations: 'desc' // 'desc' (Highest First) or 'asc' (Lowest First)
};

// ==========================================
// 1. BIBTEX ASYNC PARSE & FETCH ENGINE
// ==========================================
function initializeBibtexEngine() {
    // Reverted target directory to keep backup path sync
    const targetFile = 'assets/data/soumya_publications.bib'; 

    fetch(targetFile)
        .then(response => {
            if (!response.ok) throw new Error(`Could not locate ${targetFile} file context.`);
            const lastModifiedHeader = response.headers.get('Last-Modified');
            displayIndexTimestamp(lastModifiedHeader);
            return response.text();
        })
        .then(rawBibtex => {
            cachedGlobalEntries = parseRawBibtex(rawBibtex);
            renderBibliography(cachedGlobalEntries);
            setupSortEventHandlers();
        })
        .catch(err => {
            console.error("BibTeX Engine Error: ", err);
            const tsNode = document.getElementById('bib-last-modified');
            if (tsNode) tsNode.innerText = 'Unavailable';
            document.querySelectorAll('.loading-state').forEach(el => {
                el.innerHTML = `<span style="color:red;"><i class="fas fa-exclamation-triangle"></i> Error loading publications index.</span>`;
            });
        });
}

function displayIndexTimestamp(headerDateString) {
    const timestampPlaceholder = document.getElementById('bib-last-modified');
    if (!timestampPlaceholder) return;

    if (headerDateString) {
        const parsedDate = new Date(headerDateString);
        const formattedDate = parsedDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        const formattedTime = parsedDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
        timestampPlaceholder.innerText = `${formattedDate} (${formattedTime})`;
    } else {
        const fallbackDate = new Date();
        timestampPlaceholder.innerText = fallbackDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }
}

function parseRawBibtex(text) {
    if (!text) return [];
    const entryBlocks = text.split(/@([a-zA-Z]+)\s*\{/);
    const compiledEntries = [];

    for (let i = 1; i < entryBlocks.length; i += 2) {
        const entryType = entryBlocks[i].toUpperCase();
        const interiorContent = entryBlocks[i + 1];
        if (!interiorContent) continue;

        const citationKey = interiorContent.split(',')[0].trim();
        const fields = {};
        const lines = interiorContent.split(/,\s*\n/);
        
        lines.forEach(line => {
            const eqIndex = line.indexOf('=');
            if (eqIndex === -1) return;
            
            const key = line.substring(0, eqIndex).trim().toLowerCase();
            let value = line.substring(eqIndex + 1).trim();
            
            if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('"') && value.endsWith('"'))) {
                value = value.substring(1, value.length - 1).trim();
            }
            value = value.replace(/[\{\}]/g, '').replace(/~/g, ' ');
            if (key) fields[key] = value;
        });
        
        fields.type = entryType;
        fields.key = citationKey;
        
        const fallbackCitations = {
            '2023JASTP.24806081N': 31, '2018ApJ...853...72N': 28, '2023MNRAS.525.4801D': 13,
            '2013AIPC.1536.1290S': 11, '2020ApJ...890...37D': 6,  '2019RNAAS...3...86D': 4,
            '2024ApJ...975..288D': 1
        };
        
        fields.citations = fields.citation_count ? parseInt(fields.citation_count) : (fallbackCitations[citationKey] || 0);
        if (fields.year) fields.year = fields.year.trim();
        
        compiledEntries.push(fields);
    }
    return compiledEntries;
}

// ==========================================
// 2. IMMUTABLE CORE RENDERING ENGINE
// ==========================================
function renderBibliography(entries) {
    const journalsContainer = document.getElementById('journal-papers-target');
    const conferencesContainer = document.getElementById('conference-papers-target');
    if (!journalsContainer || !conferencesContainer) return;

    journalsContainer.innerHTML = '';
    conferencesContainer.innerHTML = '';

    const journalMacros = {
        '\\apj': 'The Astrophysical Journal',
        '\\mnras': 'Monthly Notices of the Royal Astronomical Society',
        '\\grl': 'Geophysical Research Letters',
        'rnaas': 'Research Notes of the AAS'
    };

    let journalCount = 0;
    let conferenceCount = 0;
    let totalCitations = 0;

    const processingCopy = [...entries];

    if (activeSortField === 'chrono') {
        processingCopy.sort((a, b) => {
            const yearA = parseInt(a.year) || 0;
            const yearB = parseInt(b.year) || 0;
            return sortDirections.chrono === 'desc' ? (yearB - yearA) : (yearA - yearB);
        });
    } else if (activeSortField === 'citations') {
        processingCopy.sort((a, b) => {
            const citeA = a.citations || 0;
            const citeB = b.citations || 0;
            return sortDirections.citations === 'desc' ? (citeB - citeA) : (citeA - citeB);
        });
    }

    processingCopy.forEach(entry => {
        if (!entry.title) return;

        if (entry.type === 'ARTICLE') {
            journalCount++;
        } else {
            conferenceCount++;
        }
        totalCitations += entry.citations;

        let authorLine = entry.author || '';
        authorLine = authorLine.replace(/\s+/g, ' ');
        authorLine = authorLine.split(' and ').map(author => {
            const cleanAuthor = author.trim();
            return (cleanAuthor.includes('Dash') || cleanAuthor.includes('S. R.')) ? `<strong>${cleanAuthor}</strong>` : cleanAuthor;
        }).join(', ');

        let venue = entry.journal || entry.booktitle || 'Special Astrophysical Publications';
        const lowVenue = venue.toLowerCase();
        if (journalMacros[lowVenue]) venue = journalMacros[lowVenue];
        else if (journalMacros[venue]) venue = journalMacros[venue];

        const volumeStr = entry.volume ? `Vol. ${entry.volume}` : '';
        const issueStr = entry.number ? `No. ${entry.number}` : '';
        const pageStr = entry.pages ? `pp. ${entry.pages}` : '';
        const metadataString = [venue, entry.year, volumeStr, issueStr, pageStr].filter(Boolean).join(', ');

        const entryPanel = document.createElement('div');
        entryPanel.className = 'publication-item-card pub-item';
        entryPanel.style.marginBottom = '1.8rem';
        entryPanel.style.paddingBottom = '1.5rem';
        entryPanel.style.borderBottom = '1px solid rgba(255,255,255,0.05)';

        const cleanTitle = entry.title.replace(/^\"(.*)\"$/, '$1').replace(/^\{(.*)\}$/, '$1');
        const bibKey = (entry.id || entry.key || cleanTitle.split(' ')[0] + (entry.year || '2026')).replace(/[^a-zA-Z0-9]/g, '');
        const bibType = (entry.type || 'article').toLowerCase();
        
        let reconstructedBibTeX = `@${bibType}{${bibKey},\n`;
        reconstructedBibTeX += `  author    = {${entry.author || ''}},\n`;
        reconstructedBibTeX += `  title     = {${cleanTitle}},\n`;
        if (entry.journal) reconstructedBibTeX += `  journal   = {${entry.journal}},\n`;
        if (entry.booktitle) reconstructedBibTeX += `  booktitle = {${entry.booktitle}},\n`;
        if (entry.year) reconstructedBibTeX += `  year      = {${entry.year}},\n`;
        if (entry.volume) reconstructedBibTeX += `  volume    = {${entry.volume}},\n`;
        if (entry.number) reconstructedBibTeX += `  number    = {${entry.number}},\n`;
        if (entry.pages) reconstructedBibTeX += `  pages     = {${entry.pages}},\n`;
        if (entry.doi) reconstructedBibTeX += `  doi       = {${entry.doi}},\n`;
        reconstructedBibTeX = reconstructedBibTeX.slice(0, -2) + '\n}';

        let actionButtonsHTML = '';
        if (entry.adsurl) actionButtonsHTML += `<a href="${entry.adsurl}" target="_blank" class="text-link" style="margin-right:12px; font-size:0.85rem;"><i class="fas fa-external-link-alt"></i> ADS Link</a>`;
        if (entry.doi) {
            const doiLink = entry.doi.startsWith('http') ? entry.doi : `https://doi.org/${entry.doi}`;
            actionButtonsHTML += `<a href="${doiLink}" target="_blank" class="text-link" style="margin-right:12px; font-size:0.85rem;"><i class="fas fa-fingerprint"></i> DOI</a>`;
        }
        actionButtonsHTML += `<button class="cite-toggle-btn" style="margin-right:12px;"><i class="fa-solid fa-quote-right" style="font-size:0.75rem;"></i> Cite</button>`;

        if (entry.citations > 0) {
            actionButtonsHTML += `<span class="citation-pill" style="font-size:0.75rem; font-weight:600; background:rgba(255,170,0,0.1); color:#ffaa00; padding:0.2rem 0.5rem; border-radius:6px; border:1px solid rgba(255,170,0,0.2); display:inline-flex; align-items:center; gap:0.3rem;"><i class="fas fa-quote-left" style="font-size:0.65rem;"></i> Cited by ${entry.citations}</span>`;
        }

        entryPanel.innerHTML = `
            <h3 style="font-size:1.1rem; margin-bottom:0.4rem; color:var(--text-color); line-height:1.4;">${cleanTitle}</h3>
            <p style="margin-bottom:0.3rem; font-size:0.92rem; color:var(--text-color);">${authorLine}</p>
            <p style="font-style:italic; font-size:0.85rem; color:var(--text-muted); margin-bottom:0.6rem;">${metadataString}</p>
            <div class="actions" style="margin-top:0.4rem; display:flex; align-items:center; flex-wrap:wrap; gap:0.4rem;">${actionButtonsHTML}</div>
            <div class="citation-drawer">
                <div class="citation-actions">
                    <span>BibTeX Format String</span>
                    <button class="copy-citation-btn"><i class="fa-regular fa-copy"></i> Copy</button>
                </div>
                <pre><code class="bibtex-snippet">${reconstructedBibTeX}</code></pre>
            </div>
        `;

        if (entry.type === 'ARTICLE') journalsContainer.appendChild(entryPanel);
        else conferencesContainer.appendChild(entryPanel);
    });

    document.getElementById('metric-journals-count').innerText = journalCount;
    document.getElementById('metric-conferences-count').innerText = conferenceCount;
    document.getElementById('metric-citations-count').innerText = totalCitations;

    if (journalsContainer.children.length === 0) journalsContainer.innerHTML = '<p class="section-desc">No indexed journal items found.</p>';
    if (conferencesContainer.children.length === 0) conferencesContainer.innerHTML = '<p class="section-desc">No indexed conference items found.</p>';
}

// ==========================================
// 3. DIRECTIONAL EVENT CONTROLLERS
// ==========================================
function setupSortEventHandlers() {
    const btnChrono = document.getElementById('sort-chrono');
    const btnCitations = document.getElementById('sort-citations');
    if (!btnChrono || !btnCitations) return;

    function updateButtonVisuals() {
        const activeBg = '#ffaa00';
        const activeText = '#15181f'; 
        const inactiveText = 'var(--text-color)';
        const chronoIcon = btnChrono.querySelector('.sort-icon');
        const citationsIcon = btnCitations.querySelector('.sort-icon');

        if (activeSortField === 'chrono') {
            btnChrono.style.background = activeBg;
            btnChrono.style.color = activeText;
            btnChrono.style.opacity = '1';
            btnChrono.style.fontWeight = '600';
            btnChrono.style.boxShadow = '2px 2px 4px rgba(0,0,0,0.3)';
            if (chronoIcon) {
                chronoIcon.style.display = 'inline-block';
                chronoIcon.className = `sort-icon fas ${sortDirections.chrono === 'desc' ? 'fa-sort-numeric-down' : 'fa-sort-numeric-up-alt'}`;
            }

            btnCitations.style.background = 'transparent';
            btnCitations.style.color = inactiveText;
            btnCitations.style.opacity = '0.5';
            btnCitations.style.fontWeight = '500';
            btnCitations.style.boxShadow = 'none';
            if (citationsIcon) citationsIcon.style.display = 'none';
        } else {
            btnCitations.style.background = activeBg;
            btnCitations.style.color = activeText;
            btnCitations.style.opacity = '1';
            btnCitations.style.fontWeight = '600';
            btnCitations.style.boxShadow = '2px 2px 4px rgba(0,0,0,0.3)';
            if (citationsIcon) {
                citationsIcon.style.display = 'inline-block';
                citationsIcon.className = `sort-icon fas ${sortDirections.citations === 'desc' ? 'fa-sort-amount-down' : 'fa-sort-amount-up'}`;
            }

            btnChrono.style.background = 'transparent';
            btnChrono.style.color = inactiveText;
            btnChrono.style.opacity = '0.5';
            btnChrono.style.fontWeight = '500';
            btnChrono.style.boxShadow = 'none';
            if (chronoIcon) chronoIcon.style.display = 'none';
        }
    }

    btnChrono.addEventListener('click', () => {
        if (activeSortField === 'chrono') sortDirections.chrono = sortDirections.chrono === 'desc' ? 'asc' : 'desc';
        else activeSortField = 'chrono';
        updateButtonVisuals();
        renderBibliography(cachedGlobalEntries);
    });

    btnCitations.addEventListener('click', () => {
        if (activeSortField === 'citations') sortDirections.citations = sortDirections.citations === 'desc' ? 'asc' : 'desc';
        else activeSortField = 'citations';
        updateButtonVisuals();
        renderBibliography(cachedGlobalEntries);
    });

    document.getElementById('theme-toggle')?.addEventListener('click', () => {
        setTimeout(updateButtonVisuals, 50);
    });

    updateButtonVisuals();
}

// ==================================================================
// 4. RESEARCH HUB ROUTING ENGINE
// ==================================================================
function renderViewFromState(targetView) {
    if (!document.getElementById('panel-publications') && !document.getElementById('panel-projects')) return; 

    const rootHub = document.getElementById('view-root-hub');
    const compactNav = document.getElementById('research-compact-nav');
    const panelPubs = document.getElementById('panel-publications');
    const panelProjs = document.getElementById('panel-projects');
    const utilityBar = document.getElementById('research-utility-bar');
    const searchInput = document.getElementById('page-search');
    
    const miniPubs = document.getElementById('mini-tab-publications');
    const miniProjs = document.getElementById('mini-tab-projects');

    if (rootHub) rootHub.style.display = 'none';
    if (compactNav) compactNav.style.display = 'flex';
    if (panelPubs) panelPubs.style.display = 'none';
    if (panelProjs) panelProjs.style.display = 'none';
    if (utilityBar) utilityBar.style.display = 'flex'; 
    
    if (miniPubs) miniPubs.classList.remove('active');
    if (miniProjs) miniProjs.classList.remove('active');

    if (searchInput) searchInput.value = "";
    resetProjectFilters();

    if (targetView === 'publications') {
        if (panelPubs) panelPubs.style.display = 'block';
        if (miniPubs) miniPubs.classList.add('active');
        if (searchInput) searchInput.placeholder = "Search publications (title, co-author, year)...";
    } else if (targetView === 'projects') {
        if (panelProjs) panelProjs.style.display = 'block';
        if (miniProjs) miniProjs.classList.add('active');
        if (searchInput) searchInput.placeholder = "Filter repositories (name, tech)...";
    } else {
        if (rootHub) rootHub.style.display = 'block';
        if (compactNav) compactNav.style.display = 'none';
        if (searchInput) searchInput.placeholder = "Search across entire research space...";
    }
}

function navigateToView(targetView) {
    if (!document.getElementById('panel-publications') && !document.getElementById('panel-projects')) {
        if (typeof renderResourceViewFromState === 'function') {
            const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + (targetView === 'root' ? '' : `?view=${targetView}`);
            window.history.pushState({ path: newUrl }, '', newUrl);
            renderResourceViewFromState(targetView);
        }
        return;
    }
    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + (targetView === 'root' ? '' : `?view=${targetView}`);
    window.history.pushState({ path: newUrl }, '', newUrl);
    renderViewFromState(targetView);
}

function resetProjectFilters() {
    const cards = document.querySelectorAll('.project-grid-card');
    cards.forEach(card => card.style.display = 'flex');
}

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
            ? 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css' 
            : 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css';
    }

    // Initialize BibTeX database parsing workflow
    if (document.getElementById('journal-papers-target')) {
        initializeBibtexEngine();
    }

    // Integrated Search Bar Logic
    const searchInput = document.getElementById('page-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const urlParamsNow = new URLSearchParams(window.location.search);
            const currentView = urlParamsNow.get('view') || 'root';

            if (currentView === 'projects' && document.getElementById('panel-projects')) {
                const query = e.target.value.toLowerCase().trim();
                const cards = document.querySelectorAll('.project-grid-card');
                cards.forEach(card => {
                    const title = card.querySelector('h3').textContent.toLowerCase();
                    const description = card.querySelector('p').textContent.toLowerCase();
                    card.style.display = (title.includes(query) || description.includes(query)) ? 'flex' : 'none';
                });
            } else {
                // Global/Publication fallback text searching matrix filter
                const query = e.target.value.toLowerCase();
                const itemCards = document.querySelectorAll('.publication-item-card');
                itemCards.forEach(card => {
                    const text = card.innerText.toLowerCase();
                    card.style.opacity = text.includes(query) ? '1' : '0.15';
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

    // Direct routing initialization pass run
    if (document.getElementById('panel-publications') || document.getElementById('panel-projects')) {
        const urlParams = new URLSearchParams(window.location.search);
        const viewQuery = urlParams.get('view') || 'root';
        renderViewFromState(viewQuery);
    }
});

// ==========================================
// 6. GLOBAL STATE POPS & DELEGATORS
// ==========================================
window.addEventListener('popstate', () => {
    if (document.getElementById('panel-publications') || document.getElementById('panel-projects')) {
        const urlParams = new URLSearchParams(window.location.search);
        const viewQuery = urlParams.get('view') || 'root';
        renderViewFromState(viewQuery);
    }
});

function toggleMobileSidebar() {
    const body = document.body;
    const toggleIcon = document.querySelector('#mobile-menu-toggle i');
    body.classList.toggle('sidebar-open');
    if (toggleIcon) {
        toggleIcon.className = body.classList.contains('sidebar-open') ? 'fas fa-xmark' : 'fas fa-bars';
    }
}

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