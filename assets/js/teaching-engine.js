let globalCourses = [];

document.addEventListener("DOMContentLoaded", () => {
    fetch('assets/data/courses.json')
        .then(res => res.json())
        .then(data => {
            globalCourses = data;
            renderCourseDirectory(globalCourses);
        })
        .catch(err => console.error("Error reading course list metadata:", err));

    // Live directory search mappings
    document.getElementById('course-search').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filtered = globalCourses.filter(c => 
            c.title.toLowerCase().includes(query) || 
            c.description.toLowerCase().includes(query)
        );
        renderCourseDirectory(filtered);
    });
});

function renderCourseDirectory(courses) {
    const grid = document.getElementById('course-directory-grid');
    grid.innerHTML = '';
    
    if(courses.length === 0) {
        grid.innerHTML = `<p style="color:var(--text-muted); padding:2rem; text-align:center; width:100%;">No matches discovered inside course tracks.</p>`;
        return;
    }

    courses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'series-card nm-panel';
        // FIX: Route changes cleanly through history router when user clicks directly on a card
        card.onclick = () => routeToCourse(course.id);
        card.innerHTML = `
            <div class="series-icon"><i class="fas ${course.icon}"></i></div>
            <h3 class="series-title">${course.title}</h3>
            <span class="post-tag" style="display:inline-block; margin-bottom:0.8rem;">${course.level}</span>
            <p class="series-desc">${course.description}</p>
        `;
        grid.appendChild(card);
    });
}

async function loadCourseSyllabus(courseId) {
    const course = globalCourses.find(c => c.id === courseId);
    if (!course) return;

    // Shift interface views
    document.getElementById('teaching-intro').style.display = 'none';
    document.getElementById('course-directory-grid').style.display = 'none';
    document.getElementById('course-workspace-view').style.display = 'block';

    const target = document.getElementById('syllabus-injection-target');
    target.innerHTML = `
        <article class="blog-post nm-panel">
            <div class="post-header">
                <h2 class="post-title">${course.title}</h2>
                <div class="post-meta">
                    <span><i class="fas fa-graduation-cap"></i> ${course.level}</span>
                </div>
            </div>
            <div class="post-content" id="syllabus-markdown-content">
                <p style="color: var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Asynchronously loading curriculum files...</p>
            </div>
        </article>
    `;

    try {
        // Parallel fetch pipeline for course sub-files
        const [overviewRes, modulesRes, capstoneRes] = await Promise.all([
            fetch(`${course.dir}/overview.md`),
            fetch(`${course.dir}/modules.md`),
            fetch(`${course.dir}/capstone.md`)
        ]);

        if (!overviewRes.ok || !modulesRes.ok || !capstoneRes.ok) {
            throw new Error("One or more course files failed to load.");
        }

        const overviewTxt = await overviewRes.text();
        const modulesTxt = await modulesRes.text();
        const capstoneTxt = await capstoneRes.text();

        // Concatenate and parse markdown text to HTML
        const compiledHtml = marked.parse(`${overviewTxt}\n\n${modulesTxt}\n\n${capstoneTxt}`);
        document.getElementById('syllabus-markdown-content').innerHTML = compiledHtml;

        // Trigger Option B styling overrides for course page links
        document.getElementById('syllabus-markdown-content').querySelectorAll('a').forEach(link => {
            link.classList.add('interactive-chip');
            link.setAttribute('target', '_blank');
            if (!link.querySelector('i')) {
                link.insertAdjacentHTML('afterbegin', '<i class="fas fa-link" style="font-size:0.85em;"></i> ');
            }
        });

        // Run MathJax compiling passes
        if (window.MathJax && MathJax.typesetPromise) {
            MathJax.typesetPromise();
        }

    } catch (err) {
        console.error(err);
        document.getElementById('syllabus-markdown-content').innerHTML = `
            <p style="color:red;">Failed to cleanly fetch syllabus markdown components. Please ensure overview.md, modules.md, and capstone.md exist inside the path <b>${course.dir}/</b>.</p>
        `;
    }
}

/**
 * ==================================================================
 * FIXED STATE ROUTER ENGINE
 * ==================================================================
 */
function evaluateTeachingUrlState() {
    const urlParams = new URLSearchParams(window.location.search);
    const courseQuery = urlParams.get('course');

    if (courseQuery && courseQuery !== 'root') {
        // FIXED: Explicitly call your existing syllabus fetch mechanism directly
        loadCourseSyllabus(courseQuery);
    } else {
        // Cleanly bring back the global course catalog selection matrix
        document.getElementById('course-directory-grid').style.display = 'grid';
        document.getElementById('teaching-intro').style.display = 'block';
        document.getElementById('course-workspace-view').style.display = 'none';
        document.getElementById('syllabus-injection-target').innerHTML = '';
        if (document.getElementById('course-search')) {
            document.getElementById('course-search').value = '';
        }
    }
}

function routeToCourse(courseId) {
    let relativePath = window.location.pathname;
    let queryLine = (courseId === 'root') ? '' : `?course=${courseId}`;
    
    window.history.pushState({ course: courseId }, '', relativePath + queryLine);
    evaluateTeachingUrlState();
}

// Bridge back-to-directory elements to browser history
window.resetCourseHub = function() {
    routeToCourse('root');
};

// Listen for standard browser navigation history updates (back/forward button clicks)
window.addEventListener('popstate', evaluateTeachingUrlState);

// Race-Condition Interceptor via Observer pattern
document.addEventListener("DOMContentLoaded", () => {
    const gridContainer = document.getElementById('course-directory-grid');

    const domObserver = new MutationObserver((mutations, observer) => {
        if (gridContainer.children.length > 0) {
            observer.disconnect(); 
            evaluateTeachingUrlState(); 
        }
    });

    if (gridContainer) {
        domObserver.observe(gridContainer, { childList: true });
    }

    // Safety Fallback execution
    setTimeout(() => {
        domObserver.disconnect();
        if (gridContainer && gridContainer.children.length === 0) {
            evaluateTeachingUrlState();
        }
    }, 1500);
});