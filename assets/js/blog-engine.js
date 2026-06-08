let articlesData = [];
let currentCategory = '';
let currentView = 'hub'; // States: 'hub', 'feed', 'article'

// Fetch JSON dataset immediately on document load
document.addEventListener("DOMContentLoaded", () => {
    fetch('./assets/data/articles.json')
        .then(res => res.json())
        .then(data => {
            articlesData = data;
        })
        .catch(err => {
            console.error("Failed to populate article stream:", err);
            document.getElementById('blog-feed').innerHTML = `<p style="color:red; text-align:center;">Dataset ingestion failure.</p>`;
        });
});

// TIER 1: Hub view reset
function resetToHome() {
    currentView = 'hub';
    currentCategory = '';
    document.getElementById('page-search').value = ''; 
    document.getElementById('page-intro').style.display = 'block';
    document.getElementById('large-series-grid').style.display = 'grid';
    document.getElementById('compact-nav').style.display = 'none';
    document.getElementById('blog-feed').style.display = 'none';
    document.getElementById('back-to-feed-btn').style.display = 'none';
}

// TIER 2: Open category preview feed
function openCategory(seriesType) {
    currentCategory = seriesType;
    currentView = 'feed';
    
    document.getElementById('page-intro').style.display = 'none';
    document.getElementById('large-series-grid').style.display = 'none';
    document.getElementById('compact-nav').style.display = 'flex';
    document.getElementById('blog-feed').style.display = 'flex';
    document.getElementById('back-to-feed-btn').style.display = 'none';

    // Highlight tab headers
    document.querySelectorAll('.compact-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-target') === seriesType) tab.classList.add('active');
    });

    renderFeedList();
}

// Generate the preview list layout
function renderFeedList() {
    const feedContainer = document.getElementById('blog-feed');
    feedContainer.innerHTML = '';

    let filtered = articlesData;
    if (currentCategory) {
        filtered = articlesData.filter(item => item.series === currentCategory);
    }

    const searchQuery = document.getElementById('page-search').value.toLowerCase().trim();
    if (searchQuery) {
        filtered = filtered.filter(item => 
            item.title.toLowerCase().includes(searchQuery) ||
            item.summary.toLowerCase().includes(searchQuery) ||
            item.tags.some(t => t.toLowerCase().includes(searchQuery))
        );
    }

    if (filtered.length === 0) {
        feedContainer.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:3rem; width:100%;">No articles indexed matching criteria.</p>`;
        return;
    }

    // Locate this loop inside your renderFeedList() function:
    filtered.forEach(article => {
        const card = document.createElement('article');
        card.className = 'blog-post nm-panel preview-mode';
        const tagChips = article.tags.map(t => `<span class="post-tag">${t}</span>`).join('');
        
        // MODIFIED HERE: Changed titles and buttons to standard anchors pointing to article.url
        card.innerHTML = `
            <div class="post-header">
                <h2 class="post-title">
                    <a href="${article.url}" style="color: inherit; text-decoration: none;">${article.title}</a>
                </h2>
                <div class="post-meta">
                    <span><i class="far fa-calendar-alt"></i> ${article.date}</span>
                    <span><i class="fas fa-folder-open"></i> ${formatFolderName(article.series)}</span>
                    <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">${tagChips}</div>
                </div>
            </div>
            <div class="post-content">
                <p>${article.summary}</p>
            </div>
            <a class="read-more-btn" href="${article.url}" style="text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem;">
                Read Full Article <i class="fas fa-arrow-right"></i>
            </a>
        `;
        feedContainer.appendChild(card);
    });
}


function backToFeed() {
    openCategory(currentCategory);
}

function formatFolderName(key) {
    if (key === 'concepts') return 'Solar Concepts';
    if (key === 'methods') return 'Methods & Models';
    if (key === 'research') return 'Research Summaries';
    return key;
}

function compileLatexEquations() {
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise();
    }
}

// Reactive search handler mapping
document.getElementById('page-search').addEventListener('input', () => {
    const val = document.getElementById('page-search').value.trim();
    if (val !== '') {
        if (currentView === 'hub') {
            currentView = 'feed';
            currentCategory = ''; 
            document.getElementById('page-intro').style.display = 'none';
            document.getElementById('large-series-grid').style.display = 'none';
            document.getElementById('compact-nav').style.display = 'flex';
            document.getElementById('blog-feed').style.display = 'flex';
            document.querySelectorAll('.compact-tab').forEach(t => t.classList.remove('active'));
        }
        renderFeedList();
    } else {
        if (currentView === 'feed' && currentCategory === '') {
            resetToHome();
        } else {
            renderFeedList();
        }
    }
});


/**
 * State Router Engine for blog.html
 * Safely manages states using tracking queries to prevent data state breakages.
 */
function evaluateBlogUrlState() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryQuery = urlParams.get('category');

    if (categoryQuery && ['concepts', 'methods', 'research'].includes(categoryQuery)) {
        // Safely falls back on your core engine variables to draw arrays
        if (typeof openCategory === "function") {
            openCategory(categoryQuery);
        }
    } else {
        // Reverts layout rendering to show primary hub grid
        if (typeof resetToHome === "function") {
            resetToHome();
        }
    }
}

function routeToCategory(targetCategory) {
    let relativePath = window.location.pathname;
    let queryLine = (targetCategory === 'root') ? '' : `?category=${targetCategory}`;
    
    // Push structured window changes into tracking matrix
    window.history.pushState({ category: targetCategory }, '', relativePath + queryLine);
    
    // Evaluate states
    evaluateBlogUrlState();
}

// Intercept native popstate actions (browser back/forward button clicks)
window.addEventListener('popstate', evaluateBlogUrlState);

// Run validation layout configurations on load completion
document.addEventListener("DOMContentLoaded", () => {
    // Short delay lets blog-engine.js fetch and assemble feed arrays safely first
    setTimeout(evaluateBlogUrlState, 60);
});
