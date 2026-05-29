/**
 * Advanced Async Resource Portal Engine
 * Dynamically loads and parses split-file JSON catalogs on active tab routing states.
 */

const RESOURCE_META_TITLES = {
    root: { title: "Solar Physics Directory", desc: "A curated compilation of open-source simulation frameworks, telemetry databases, and foundational literature." },
    data: { title: "Data Sources & Archives", desc: "Spaceborne telemetry databases, ground observatories, live solar indices, and synoptic magnetograms." },
    simulations: { title: "Simulation Packages", desc: "Open-source MHD solvers, surface flux transport codes, magnetic optimization, and event catalogs." },
    literature: { title: "Books & Papers", desc: "Essential reference literature, historical solar physics papers, and classic textbooks." }
};

// Global Runtime Memory Repositories
let LOCAL_RESOURCE_CACHE = {
    data: null,
    simulations: null,
    literature: null
};

/**
 * Robust async multi-file engine pipeline
 */
async function fetchAndRenderCategory(category, targetElementId, compilerCallback) {
    const targetContainer = document.getElementById(targetElementId);
    if (!targetContainer) return;

    // Show safe background spinner metrics while resolving asset chains
    targetContainer.innerHTML = `<tr><td colspan="4" class="text-center" style="padding: 3rem; opacity: 0.5;"><i class="fas fa-spinner fa-spin"></i> Retrieving registry data...</td></tr>`;

    try {
        // Only trigger network fetches if cache object profile reads empty
        if (!LOCAL_RESOURCE_CACHE[category]) {
            const response = await fetch(`./assets/data/${category}.json`);
            if (!response.ok) throw new Error(`HTTP network error context status: ${response.status}`);
            LOCAL_RESOURCE_CACHE[category] = await response.json();
        }
        
        // Execute template render bindings
        compilerCallback(LOCAL_RESOURCE_CACHE[category], targetContainer);
    } catch (error) {
        console.error(`Registry compilation failure associated with resource parameters [${category}]:`, error);
        targetContainer.innerHTML = `<tr><td colspan="4" class="text-center" style="color: #ff5555; padding: 2rem;"><i class="fas fa-circle-exclamation"></i> Error parsing source metadata module.</td></tr>`;
    }
}

/**
 * Front-end HTML Rendering Templates
 */
function compileObservationalData(dataSet, container) {
    container.innerHTML = "";
    dataSet.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'resource-row-item';
        const tokenPool = [item.entity, item.domain, item.metric, ...(item.searchTokens || [])].join(' ').toLowerCase();
        row.setAttribute('data-search-pool', tokenPool);
        
        row.innerHTML = `
            <td class="entity-title">${item.entity}</td>
            <td>${item.domain}</td>
            <td>${item.metric}</td>
            <td class="text-center">
                <a href="${item.link}" target="_blank" class="${item.highlight ? 'interactive-chip highlight-chip' : 'interactive-chip'}">
                    <i class="${item.icon || 'fas fa-link'}"></i> ${item.buttonText}
                </a>
            </td>
        `;
        container.appendChild(row);
    });
}

function compileSimulationsGrid(dataSet, container) {
    // Isolate targets inside the clean container structure
    const gridTarget = document.getElementById('dynamic-simulations-grid-target');
    const catalogTarget = document.getElementById('dynamic-catalogs-matrix-target');
    
    if (gridTarget) gridTarget.innerHTML = "";
    if (catalogTarget) catalogTarget.innerHTML = "";

    dataSet.forEach(item => {
        const tokenPool = [item.title, item.category, item.description, ...(item.searchTokens || [])].join(' ').toLowerCase();

        if (item.isSubcard) {
            // Renders to lower catalog container element
            const subcard = document.createElement('div');
            subcard.className = 'nm-panel catalog-subcard resource-row-item';
            subcard.setAttribute('data-search-pool', tokenPool);
            subcard.innerHTML = `
                <h3 class="catalog-card-title"><i class="${item.icon || 'fas fa-database'}"></i> ${item.title}</h3>
                <p class="catalog-card-desc">${item.description}</p>
                <a href="${item.link}" target="_blank" class="interactive-chip"><i class="fas fa-link"></i> ${item.buttonText || 'Access Catalog'}</a>
            `;
            if (catalogTarget) catalogTarget.appendChild(subcard);
        } else {
            // Renders standard main repository grid cards
            const card = document.createElement('div');
            card.className = 'project-grid-card resource-row-item';
            card.setAttribute('data-search-pool', tokenPool);
            card.innerHTML = `
                <div class="project-card-header">
                    <div class="project-mini-icon"><i class="${item.icon || 'fas fa-server'}"></i></div>
                    <h3>${item.title}</h3>
                </div>
                <p>${item.description}</p>
                <div class="project-card-actions">
                    <a href="${item.link}" target="_blank" class="btn-primary-action"><i class="${item.link.includes('github') ? 'fab fa-github' : 'fas fa-globe'}"></i> ${item.buttonText || 'Source Code'}</a>
                </div>
            `;
            if (gridTarget) gridTarget.appendChild(card);
        }
    });
}

function compileLiteratureLayout(dataSet, container) {
    container.innerHTML = "";
    dataSet.forEach(item => {
        const element = document.createElement('div');
        // Check structural entry type tag parameter dynamically
        element.className = item.type === 'paper' ? 'classic-paper-entry resource-row-item' : 'classic-book-entry resource-row-item';
        
        const tokenPool = [item.title, item.author, item.year, ...(item.searchTokens || [])].join(' ').toLowerCase();
        element.setAttribute('data-search-pool', tokenPool);

        const titlePrefix = item.type === 'paper' ? '<i class="fas fa-bookmark"></i> ' : '';

        element.innerHTML = `
            <h4>${titlePrefix}${item.title}</h4>
            <p><b>${item.author} ${item.year ? `(${item.year})` : ''}</b> &middot; ${item.description}</p>
        `;
        container.appendChild(element);
    });
}

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
        miniData: document.getElementById('mini-tab-data'),
        miniSimulations: document.getElementById('mini-tab-simulations'),
        miniLiterature: document.getElementById('mini-tab-literature')
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
    
    if (elements.miniData) elements.miniData.classList.remove('active');
    if (elements.miniSimulations) elements.miniSimulations.classList.remove('active');
    if (elements.miniLiterature) elements.miniLiterature.classList.remove('active');

    if (elements.searchInput) elements.searchInput.value = "";
    resetGlobalResourceFilters();

    // 2. Tab Route Determinations with Lazy-Fetch Triggers
    if (targetView === 'data') {
        if (elements.panelData) elements.panelData.style.setProperty('display', 'block', 'important');
        if (elements.miniData) elements.miniData.classList.add('active');
        if (elements.searchInput) elements.searchInput.placeholder = "Search data sources (mission, scope, instruments)...";
        fetchAndRenderCategory('observational', 'dynamic-data-table-target', compileObservationalData);

    } else if (targetView === 'simulations') {
        if (elements.panelSimulations) elements.panelSimulations.style.setProperty('display', 'block', 'important');
        if (elements.miniSimulations) elements.miniSimulations.classList.add('active');
        if (elements.searchInput) elements.searchInput.placeholder = "Filter simulation frameworks (solver, utility, code)...";
        fetchAndRenderCategory('simulations', 'dynamic-simulations-grid-target', compileSimulationsGrid);

    } else if (targetView === 'literature') {
        if (elements.panelLiterature) elements.panelLiterature.style.setProperty('display', 'block', 'important');
        if (elements.miniLiterature) elements.miniLiterature.classList.add('active');
        if (elements.searchInput) elements.searchInput.placeholder = "Search literature index (author, textbook, key papers)...";
        fetchAndRenderCategory('literature', 'dynamic-literature-target', compileLiteratureLayout);

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