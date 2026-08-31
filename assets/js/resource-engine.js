/**
 * Resource portal view controller.
 *
 * The tables, cards and literature entries are rendered by Jekyll from
 * _data/*.yml at build time, so they are in the HTML before any script runs.
 * This file switches between the category panels and filters the pre-rendered
 * rows; it no longer fetches or builds any markup.
 */

const RESOURCE_META_TITLES = {
    root: { title: "Solar Physics Directory", desc: "A curated compilation of open-source simulation frameworks, telemetry databases, and foundational literature." },
    data: { title: "Data Sources & Archives", desc: "Spaceborne telemetry databases, ground observatories, live solar indices, and synoptic magnetograms." },
    simulations: { title: "Simulation Packages", desc: "Open-source MHD solvers, surface flux transport codes, magnetic optimization, and event catalogs." },
    literature: { title: "Books & Papers", desc: "Essential reference literature, historical solar physics papers, and classic textbooks." },
    academicjournals: { title: "Academic Journals", desc: "Leading journals in solar physics and astrophysics for research dissemination." }
};

/**
 * Core Structural Interface Router State Orchestrator
 */
function renderResourceViewFromState(targetView) {
    const elements = {
        rootHub: document.getElementById('view-root-hub'),
        compactNav: document.getElementById('resources-compact-nav'),
        utilityBar: document.getElementById('resources-utility-bar'),
        searchInput: document.getElementById('page-search'),
        introHeading: document.querySelector('#page-intro h2'),
        introDescription: document.getElementById('directory-description-text'),
        panelData: document.getElementById('panel-resource-data'),
        panelSimulations: document.getElementById('panel-resource-simulations'),
        panelLiterature: document.getElementById('panel-resource-literature'),
        panelAcademicJournals: document.getElementById('panel-resource-academicjournals'),
        miniData: document.getElementById('mini-tab-data'),
        miniSimulations: document.getElementById('mini-tab-simulations'),
        miniLiterature: document.getElementById('mini-tab-literature'),
        miniAcademicJournals: document.getElementById('mini-tab-academicjournals')
    };

    // 1. Uniform Global structural view state reset commands
    if (elements.rootHub) {
        elements.rootHub.classList.remove('hidden-view');
        elements.rootHub.style.setProperty('display', 'none', 'important');
    }
    if (elements.compactNav) elements.compactNav.style.setProperty('display', 'flex', 'important');
    if (elements.utilityBar) elements.utilityBar.style.setProperty('display', 'flex', 'important');
    
    if (elements.panelData) elements.panelData.style.setProperty('display', 'none', 'important');
    if (elements.panelSimulations) elements.panelSimulations.style.setProperty('display', 'none', 'important');
    if (elements.panelLiterature) elements.panelLiterature.style.setProperty('display', 'none', 'important');
    if (elements.panelAcademicJournals) elements.panelAcademicJournals.style.setProperty('display', 'none', 'important');
    
    if (elements.miniData) elements.miniData.classList.remove('active');
    if (elements.miniSimulations) elements.miniSimulations.classList.remove('active');
    if (elements.miniLiterature) elements.miniLiterature.classList.remove('active');
    if (elements.miniAcademicJournals) elements.miniAcademicJournals.classList.remove('active');

    if (elements.searchInput) elements.searchInput.value = "";
    resetGlobalResourceFilters();

    // 2. Tab Route Determinations with Lazy-Fetch Triggers
    if (targetView === 'data') {
        if (elements.panelData) elements.panelData.style.setProperty('display', 'block', 'important');
        if (elements.miniData) elements.miniData.classList.add('active');
        if (elements.searchInput) elements.searchInput.placeholder = "Search data sources (mission, scope, instruments)...";

    } else if (targetView === 'simulations') {
        if (elements.panelSimulations) elements.panelSimulations.style.setProperty('display', 'block', 'important');
        if (elements.miniSimulations) elements.miniSimulations.classList.add('active');
        if (elements.searchInput) elements.searchInput.placeholder = "Filter simulation frameworks (solver, utility, code)...";

    } else if (targetView === 'literature') {
        if (elements.panelLiterature) elements.panelLiterature.style.setProperty('display', 'block', 'important');
        if (elements.miniLiterature) elements.miniLiterature.classList.add('active');
        if (elements.searchInput) elements.searchInput.placeholder = "Search literature index (author, textbook, key papers)...";

    } else if (targetView === 'academicjournals') {
        if (elements.panelAcademicJournals) elements.panelAcademicJournals.style.setProperty('display', 'block', 'important');
        if (elements.miniAcademicJournals) elements.miniAcademicJournals.classList.add('active');
        if (elements.searchInput) elements.searchInput.placeholder = "Search academic journals (title, publisher, scope)..."; 
    } else {
        // Fallback Base Category Landing Grid Execution Block
        if (elements.rootHub) {
            elements.rootHub.style.removeProperty('display');
            elements.rootHub.style.setProperty('display', 'grid', 'important'); 
        }
        if (elements.compactNav) elements.compactNav.style.setProperty('display', 'none', 'important');
        if (elements.utilityBar) elements.utilityBar.style.setProperty('display', 'none', 'important');
    }

    if (elements.introHeading && RESOURCE_META_TITLES[targetView || 'root']) {
        elements.introHeading.textContent = RESOURCE_META_TITLES[targetView || 'root'].title;
        elements.introDescription.textContent = RESOURCE_META_TITLES[targetView || 'root'].desc;
    }
}

function navigateToResourceView(targetView) {
    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + 
                   (targetView === 'root' ? '' : `?view=${targetView}`);
    window.history.pushState({ path: newUrl }, '', newUrl);
    renderResourceViewFromState(targetView);
}

function resetGlobalResourceFilters() {
    document.querySelectorAll('.resource-row-item').forEach(element => {
        element.style.display = ''; 
    });
}

function initializeResourcePortal() {
    const urlParams = new URLSearchParams(window.location.search);
    const initialView = urlParams.get('view') || 'root';
    renderResourceViewFromState(initialView);
}

document.addEventListener("DOMContentLoaded", initializeResourcePortal);
window.addEventListener("load", initializeResourcePortal);

// Real-Time Search Filtering Engine
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById('page-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const activeItems = document.querySelectorAll('.resource-row-item');

        activeItems.forEach(element => {
            const searchPool = element.getAttribute('data-search-pool') || element.textContent.toLowerCase();
            
            if (searchPool.includes(query)) {
                if (element.tagName === 'TR') {
                    element.style.setProperty('display', 'table-row', 'important');
                } else if (element.classList.contains('project-grid-card')) {
                    element.style.setProperty('display', 'flex', 'important');
                } else {
                    element.style.setProperty('display', 'block', 'important');
                }
            } else {
                element.style.setProperty('display', 'none', 'important');
            }
        });
    });
});

window.addEventListener('popstate', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewQuery = urlParams.get('view') || 'root';
    renderResourceViewFromState(viewQuery);
});