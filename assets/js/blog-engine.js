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

    filtered.forEach(article => {
        const card = document.createElement('article');
        card.className = 'blog-post nm-panel preview-mode';
        const tagChips = article.tags.map(t => `<span class="post-tag">${t}</span>`).join('');
        
        card.innerHTML = `
            <div class="post-header">
                <h2 class="post-title" onclick="openSinglePost('${article.id}')">${article.title}</h2>
                <div class="post-meta">
                    <span><i class="far fa-calendar-alt"></i> ${article.date}</span>
                    <span><i class="fas fa-folder-open"></i> ${formatFolderName(article.series)}</span>
                    <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">${tagChips}</div>
                </div>
            </div>
            <div class="post-content">
                <p>${article.summary}</p>
            </div>
            <button class="read-more-btn" onclick="openSinglePost('${article.id}')">Read Full Article <i class="fas fa-arrow-right"></i></button>
        `;
        feedContainer.appendChild(card);
    });

    compileLatexEquations();
}

// TIER 3: Fetch Markdown, Parse, and Inject full text
async function openSinglePost(articleId) {
    currentView = 'article';
    const article = articlesData.find(item => item.id === articleId);
    if (!article) return;

    currentCategory = article.series;
    
    document.getElementById('page-intro').style.display = 'none';
    document.getElementById('large-series-grid').style.display = 'none';
    document.getElementById('compact-nav').style.display = 'flex';
    document.getElementById('blog-feed').style.display = 'flex';
    document.getElementById('back-to-feed-btn').style.display = 'inline-flex';

    document.querySelectorAll('.compact-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-target') === currentCategory) tab.classList.add('active');
    });

    const feedContainer = document.getElementById('blog-feed');
    const tagChips = article.tags.map(t => `<span class="post-tag">${t}</span>`).join('');
    const headerHtml = `
        <div class="post-header">
            <h2 class="post-title">${article.title}</h2>
            <div class="post-meta">
                <span><i class="far fa-calendar-alt"></i> ${article.date}</span>
                <span><i class="fas fa-folder-open"></i> ${formatFolderName(article.series)}</span>
                <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">${tagChips}</div>
            </div>
        </div>
    `;

    feedContainer.innerHTML = `
        <article class="blog-post nm-panel full-mode">
            ${headerHtml}
            <div class="post-content" id="markdown-container">
                <p style="color: var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Fetching article data...</p>
            </div>
        </article>
    `;

    try {
        const response = await fetch(`blogs/${article.id}.md`);
        if (!response.ok) throw new Error('Markdown file not found.');
        
        const markdownText = await response.text();
        const htmlContent = marked.parse(markdownText);
        
        // Inject the parsed HTML
        const container = document.getElementById('markdown-container');
        container.innerHTML = htmlContent;

        // AUTOMATION HOOK: Find all links inside the post and inject your chip design
        container.querySelectorAll('a').forEach(link => {
            link.classList.add('interactive-chip');
            link.setAttribute('target', '_blank'); // Safely open all research references in a new tab
            
            // Optional: Prepend a neat link icon if they don't have one
            if (!link.querySelector('i')) {
                link.insertAdjacentHTML('afterbegin', '<i class="fas fa-link" style="font-size:0.85em;"></i> ');
            }
        });
        
        compileLatexEquations();

    } catch (error) {
        console.error("Error loading article:", error);
        document.getElementById('markdown-container').innerHTML = `
            <p style="color: red;">Error: Could not load the article content. Please ensure <b>blogs/${article.id}.md</b> exists.</p>
        `;
    }
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
