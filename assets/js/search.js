/**
 * Site-wide search, as a command palette.
 *
 * Searches everything: articles, publications, proceedings, software, data
 * sources, simulation codes, references, journals, courses and the pages
 * themselves. The index is built by Jekyll into /search.json and fetched once,
 * on first open, so it costs nothing to anyone who never searches.
 *
 * It is a palette rather than a field in the header because the two get used
 * by different people. A box you type into is only reached by someone who has
 * already decided to look something up; a keyboard shortcut is reached by
 * anyone curious enough to try one. The header keeps a trigger for people who
 * would never guess the shortcut exists.
 */
(function () {
    const scrim = document.getElementById('search-scrim');
    const input = document.getElementById('page-search');
    const panel = document.getElementById('search-results');
    const status = document.getElementById('search-status');
    const trigger = document.getElementById('search-trigger');
    if (!scrim || !input || !panel) return;

    // Kinds appear in this order when several match equally well; anything
    // absent here sorts last, so a new kind in search.json still renders.
    const KIND_ORDER = ['Publication', 'Proceedings', 'Article', 'Software',
        'Data source', 'Simulation code', 'Reference', 'Journal', 'Course', 'Page'];

    let index = null;
    let loading = null;
    let cursor = -1;
    let restoreFocus = null;

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

    function search(terms) {
        if (!terms.length) return [];
        const scored = index
            .map((item) => ({ item, s: score(item, terms) }))
            .filter((r) => r.s > 0)
            .sort((a, b) => b.s - a.s)
            .slice(0, 14);

        // Group by kind, ordering the groups by their best hit so the closest
        // match still leads. Within a group, score order is preserved.
        const groups = new Map();
        scored.forEach((r) => {
            if (!groups.has(r.item.kind)) groups.set(r.item.kind, []);
            groups.get(r.item.kind).push(r.item);
        });
        return [...groups.entries()].sort((a, b) => {
            const ai = KIND_ORDER.indexOf(a[0]), bi = KIND_ORDER.indexOf(b[0]);
            return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
        });
    }

    function esc(text) {
        return text.replace(/[&<>"]/g, (c) =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    }

    function mark(text, terms) {
        const safe = esc(text);
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
        input.removeAttribute('aria-activedescendant');

        if (!terms.length) {
            panel.innerHTML = '<p class="search-empty">Start typing to search '
                + index.length + ' entries across the site.</p>';
            input.setAttribute('aria-expanded', 'false');
            status.textContent = '';
            return;
        }

        const groups = search(terms);
        if (!groups.length) {
            panel.innerHTML = '<p class="search-empty">Nothing matches <b>'
                + esc(query) + '</b></p>';
            input.setAttribute('aria-expanded', 'true');
            status.textContent = 'No results';
            return;
        }

        let html = '', n = 0, total = 0;
        groups.forEach(([kind, items]) => {
            html += '<p class="search-group">' + esc(kind) + '</p>';
            items.forEach((item) => {
                html += '<a class="search-hit" role="option" id="search-hit-' + n + '"'
                     +  ' aria-selected="false" href="' + esc(item.url) + '">'
                     +  '<span class="search-hit-kind">' + esc(item.kind) + '</span>'
                     +  '<span class="search-hit-title">' + mark(item.title, terms) + '</span>'
                     +  (item.detail
                         ? '<span class="search-hit-detail">' + mark(item.detail, terms) + '</span>'
                         : '')
                     +  '</a>';
                n++; total++;
            });
        });
        panel.innerHTML = html;
        panel.scrollTop = 0;
        input.setAttribute('aria-expanded', 'true');
        status.textContent = total + ' result' + (total === 1 ? '' : 's');
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

    // ---- index -------------------------------------------------------------
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

    // ---- open / close ------------------------------------------------------
    function open() {
        if (!scrim.hidden) return;
        restoreFocus = document.activeElement;
        scrim.hidden = false;
        input.value = '';
        panel.innerHTML = '';
        load().then(() => { if (!scrim.hidden) render(''); });
        input.focus();
    }

    function close() {
        if (scrim.hidden) return;
        scrim.hidden = true;
        input.setAttribute('aria-expanded', 'false');
        input.removeAttribute('aria-activedescendant');
        cursor = -1;
        status.textContent = '';
        // preventScroll matters: closing after a jump to a #pub- anchor would
        // otherwise scroll straight back up to the trigger.
        if (restoreFocus && document.contains(restoreFocus)) {
            restoreFocus.focus({ preventScroll: true });
        }
        restoreFocus = null;
    }

    if (trigger) {
        trigger.addEventListener('click', open);
        // Show the shortcut the reader's own keyboard actually uses.
        const key = document.getElementById('search-trigger-key');
        if (key && /Mac|iPhone|iPad/.test(navigator.platform || '')) key.textContent = '⌘ K';
    }

    scrim.addEventListener('mousedown', (e) => { if (e.target === scrim) close(); });

    // Following a hit has to close the palette explicitly. A publication link
    // is a #pub- anchor on a page the reader may already be on, so it changes
    // the hash without a navigation, and the palette would otherwise stay open
    // over the entry it just jumped to.
    panel.addEventListener('click', (e) => { if (e.target.closest('.search-hit')) close(); });

    let debounce;
    input.addEventListener('input', () => {
        const query = input.value.trim();
        window.clearTimeout(debounce);
        debounce = window.setTimeout(() => {
            load().then(() => render(query));
        }, 90);
    });

    document.addEventListener('keydown', (e) => {
        // Open from anywhere.
        if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            scrim.hidden ? open() : close();
            return;
        }
        // "/" is the other convention, but only when the reader is not typing.
        if (e.key === '/' && scrim.hidden && !e.metaKey && !e.ctrlKey) {
            const el = document.activeElement;
            const typing = el && (el.isContentEditable
                || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
            if (!typing) { e.preventDefault(); open(); }
            return;
        }
        if (scrim.hidden) return;

        if (e.key === 'Escape') { e.preventDefault(); close(); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
        else if (e.key === 'Enter' && cursor >= 0) {
            e.preventDefault();
            panel.querySelectorAll('.search-hit')[cursor].click();
        } else if (e.key === 'Tab') {
            // aria-modal claims focus is contained, so contain it: the input is
            // the only tab stop, and the hits are reached with the arrow keys.
            e.preventDefault();
            input.focus();
        }
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
