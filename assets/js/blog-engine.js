/**
 * Article hub view controller.
 *
 * The article cards are rendered by Jekyll at build time, so they are present
 * in the HTML before any script runs. This file only switches between the
 * category hub and the filtered feed, and hides cards that do not match the
 * search box. There is no fetch, and therefore no race between the data
 * arriving and the URL being routed.
 */

const CATEGORIES = ['concepts', 'methods', 'research'];

let currentCategory = '';
let currentView = 'hub'; // 'hub' | 'feed'

const el = (id) => document.getElementById(id);
const cards = () => document.querySelectorAll('.blog-post[data-series]');

// ---------------------------------------------------------------------------
// View switching
// ---------------------------------------------------------------------------

function showHub() {
    currentView = 'hub';
    currentCategory = '';

    el('page-intro').style.display = 'block';
    el('large-series-grid').style.display = 'grid';
    el('compact-nav').style.display = 'none';
    el('blog-feed').style.display = 'none';

    const back = el('back-to-feed-btn');
    if (back) back.style.display = 'none';
}

function showFeed(category) {
    currentView = 'feed';
    currentCategory = category || '';

    el('page-intro').style.display = 'none';
    el('large-series-grid').style.display = 'none';
    el('compact-nav').style.display = 'flex';
    el('blog-feed').style.display = 'flex';

    const back = el('back-to-feed-btn');
    if (back) back.style.display = 'none';

    document.querySelectorAll('.compact-tab').forEach((tab) => {
        tab.classList.toggle('active', tab.getAttribute('data-target') === currentCategory);
    });

    applyFilters();
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

function applyFilters() {
    let visible = 0;

    cards().forEach((card) => {
        const show = !currentCategory || card.dataset.series === currentCategory;
        card.style.display = show ? '' : 'none';
        if (show) visible++;
    });

    const empty = el('feed-empty');
    if (empty) empty.style.display = visible === 0 ? 'block' : 'none';
}

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

function evaluateBlogUrlState() {
    const category = new URLSearchParams(window.location.search).get('category');
    if (category && CATEGORIES.includes(category)) {
        showFeed(category);
    } else {
        showHub();
    }
}

function routeToCategory(target) {
    const query = target === 'root' ? '' : `?category=${target}`;
    window.history.pushState({ category: target }, '', window.location.pathname + query);
    evaluateBlogUrlState();
}

window.addEventListener('popstate', evaluateBlogUrlState);

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    if (!el('blog-feed')) return;


    evaluateBlogUrlState();
});
