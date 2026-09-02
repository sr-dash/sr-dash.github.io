/**
 * Site-wide search.
 *
 * Replaces the per-page filter boxes, which narrowed whatever list happened to
 * be on screen and — on the home page — did nothing at all. This searches
 * everything: articles, publications, proceedings, software, data sources,
 * simulation codes, references, journals, courses and the pages themselves.
 *
 * The index is built by Jekyll into /search.json and fetched once, on the first
 * keystroke, so it costs nothing to anyone who never uses the box.
 */
(function () {
    const input = document.getElementById('page-search');
    if (!input) return;

    const container = input.closest('.search-container');
    let index = null;
    let loading = null;
    let results = [];
    let cursor = -1;

    // ---- results panel -----------------------------------------------------
    const panel = document.createElement('div');
    panel.className = 'search-results';
    panel.id = 'search-results';
    panel.hidden = true;
    panel.setAttribute('role', 'listbox');
    container.appendChild(panel);

    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', 'search-results');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('autocomplete', 'off');

    const status = document.createElement('p');
    status.className = 'visually-hidden';
    status.setAttribute('role', 'status');
    container.appendChild(status);

    // ---- matching ----------------------------------------------------------
    function score(item, terms) {
        const title = item.title.toLowerCase();
        const hay = (item.title + ' ' + item.detail + ' ' + item.body).toLowerCase();
        let total = 0;
        for (const t of terms) {
            if (!hay.includes(t)) return 0;          // every term must appear
            if (title.startsWith(t)) total += 12;
            else if (title.includes(t)) total += 6;
            else total += 1;
        }
        return total;
    }

    function search(query) {
        const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
        if (!terms.length) return [];
        return index
            .map((item) => ({ item, s: score(item, terms) }))
            .filter((r) => r.s > 0)
            .sort((a, b) => b.s - a.s)
            .slice(0, 12)
            .map((r) => r.item);
    }

    function mark(text, terms) {
        const safe = text.replace(/[&<>"]/g, (c) =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        if (!terms.length) return safe;
        const rx = new RegExp('(' + terms
            .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('|') + ')', 'ig');
        return safe.replace(rx, '<mark>$1</mark>');
    }

    // ---- rendering ---------------------------------------------------------
    function render(query) {
        const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
        cursor = -1;

        if (!results.length) {
            panel.innerHTML =
                '<p class="search-empty">Nothing matches <b>' + mark(query, []) + '</b></p>';
            panel.hidden = false;
            input.setAttribute('aria-expanded', 'true');
            status.textContent = 'No results';
            return;
        }

        panel.innerHTML = results.map((r, i) =>
            '<a class="search-hit" role="option" id="search-hit-' + i + '"' +
            ' aria-selected="false" href="' + r.url + '">' +
            '<span class="search-hit-kind">' + r.kind + '</span>' +
            '<span class="search-hit-title">' + mark(r.title, terms) + '</span>' +
            (r.detail ? '<span class="search-hit-detail">' + mark(r.detail, terms) + '</span>' : '') +
            '</a>'
        ).join('');

        panel.hidden = false;
        input.setAttribute('aria-expanded', 'true');
        status.textContent = results.length + ' result' + (results.length === 1 ? '' : 's');
    }

    function close() {
        panel.hidden = true;
        input.setAttribute('aria-expanded', 'false');
        input.removeAttribute('aria-activedescendant');
        cursor = -1;
    }

    function move(step) {
        const hits = panel.querySelectorAll('.search-hit');
        if (!hits.length) return;
        if (cursor >= 0) hits[cursor].setAttribute('aria-selected', 'false');
        cursor = (cursor + step + hits.length) % hits.length;
        const hit = hits[cursor];
        hit.setAttribute('aria-selected', 'true');
        input.setAttribute('aria-activedescendant', hit.id);
        hit.scrollIntoView({ block: 'nearest' });
    }

    // ---- wiring ------------------------------------------------------------
    function load() {
        if (index) return Promise.resolve(index);
        if (!loading) {
            loading = fetch('/search.json')
                .then((r) => r.json())
                .then((data) => (index = data))
                .catch(() => (index = []));
        }
        return loading;
    }

    let debounce;
    input.addEventListener('input', () => {
        const query = input.value.trim();
        window.clearTimeout(debounce);
        if (query.length < 2) { close(); return; }
        debounce = window.setTimeout(() => {
            load().then(() => {
                results = search(query);
                render(query);
            });
        }, 90);
    });

    // Warm the index on focus so the first result feels instant.
    input.addEventListener('focus', load, { once: true });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { close(); input.blur(); return; }
        if (panel.hidden) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
        else if (e.key === 'Enter' && cursor >= 0) {
            e.preventDefault();
            panel.querySelectorAll('.search-hit')[cursor].click();
        }
    });

    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) close();
    });

    // A publication link carries a #pub- anchor; highlight the row it lands on.
    function highlightTarget() {
        if (!location.hash.startsWith('#pub-')) return;
        const el = document.querySelector(location.hash);
        if (!el) return;
        el.classList.add('is-target');
        window.setTimeout(() => el.classList.remove('is-target'), 2400);
    }
    window.addEventListener('hashchange', highlightTarget);
    highlightTarget();
})();
