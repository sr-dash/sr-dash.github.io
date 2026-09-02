---
layout: null
---
/**
 * Teaching page view controller.
 *
 * The course cards are rendered by Jekyll from _data/courses.yml, so the
 * directory is in the HTML before any script runs and the MutationObserver
 * plus 1500 ms fallback timer that used to guard the fetch are both gone.
 * Syllabus markdown is still loaded on demand, since it is only needed once a
 * course is opened.
 */

const COURSE_DIRS = {
{% for course in site.data.courses %}    {{ course.id | jsonify }}: {{ course.dir | jsonify }}{% unless forloop.last %},{% endunless %}
{% endfor %}};

const COURSE_TITLES = {
{% for course in site.data.courses %}    {{ course.id | jsonify }}: { title: {{ course.title | jsonify }}, level: {{ course.level | jsonify }} }{% unless forloop.last %},{% endunless %}
{% endfor %}};

const el = (id) => document.getElementById(id);

function showDirectory() {
    el('course-directory-grid').style.display = 'grid';
    el('teaching-intro').style.display = 'block';
    el('course-workspace-view').style.display = 'none';
    el('syllabus-injection-target').innerHTML = '';
}

async function loadCourseSyllabus(courseId) {
    const dir = COURSE_DIRS[courseId];
    const meta = COURSE_TITLES[courseId];
    if (!dir) return showDirectory();

    el('teaching-intro').style.display = 'none';
    el('course-directory-grid').style.display = 'none';
    el('course-workspace-view').style.display = 'block';

    el('syllabus-injection-target').innerHTML = `
        <article class="blog-post nm-panel">
            <div class="post-header">
                <h2 class="post-title">${meta.title}</h2>
                <div class="post-meta">
                    <span><i class="fas fa-graduation-cap" aria-hidden="true"></i> ${meta.level}</span>
                </div>
            </div>
            <div class="post-content" id="syllabus-markdown-content">
                <p style="color: var(--text-muted);"><i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Loading course material...</p>
            </div>
        </article>`;

    try {
        const parts = await Promise.all(
            ['overview.md', 'modules.md', 'capstone.md'].map(async (name) => {
                const res = await fetch(`/${dir}/${name}`);
                if (!res.ok) throw new Error(`${name} returned ${res.status}`);
                return res.text();
            })
        );

        const target = el('syllabus-markdown-content');
        target.innerHTML = marked.parse(parts.join('\n\n'));

        target.querySelectorAll('a').forEach((link) => {
            link.classList.add('interactive-chip');
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener');
            if (!link.querySelector('i')) {
                link.insertAdjacentHTML('afterbegin', '<i class="fas fa-link" style="font-size:0.85em;" aria-hidden="true"></i> ');
            }
        });

        if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([target]);
        if (window.Prism) Prism.highlightAllUnder(target);
    } catch (err) {
        console.error(err);
        el('syllabus-markdown-content').innerHTML =
            `<p class="load-error">Could not load the course material (${err.message}). Please try again.</p>`;
    }
}

function evaluateTeachingUrlState() {
    const course = new URLSearchParams(window.location.search).get('course');
    if (course && course !== 'root' && COURSE_DIRS[course]) {
        loadCourseSyllabus(course);
    } else {
        showDirectory();
    }
}

function routeToCourse(courseId) {
    const query = courseId === 'root' ? '' : `?course=${courseId}`;
    window.history.pushState({ course: courseId }, '', window.location.pathname + query);
    evaluateTeachingUrlState();
}

window.resetCourseHub = () => routeToCourse('root');
window.addEventListener('popstate', evaluateTeachingUrlState);

document.addEventListener('DOMContentLoaded', () => {
    if (!el('course-directory-grid')) return;

    // Course cards are real links, so a plain click still works with JS off,
    // with middle-click, and with "open in new tab". Intercept only the plain
    // left click so the in-page route is used when scripting is available.
    document.querySelectorAll('[data-course]').forEach((card) => {
        card.addEventListener('click', (e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            e.preventDefault();
            routeToCourse(card.dataset.course);
        });
    });


    evaluateTeachingUrlState();
});
