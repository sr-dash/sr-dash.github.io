/**
 * Live panel beside About Me (_includes/live-lab.html).
 *
 * Mounts one tool at a time in the frame, and only once the section is near
 * the viewport. Switching tools replaces the frame rather than stacking them,
 * so at most one app is running in the background of the page.
 */
(function () {
    const frame = document.getElementById('lab-frame');
    const dataEl = document.getElementById('lab-data');
    if (!frame || !dataEl) return;

    const tools = JSON.parse(dataEl.textContent);
    const picks = document.querySelectorAll('.lab-pick');
    const status = document.getElementById('lab-status');
    const shield = document.getElementById('lab-shield');
    const caption = document.getElementById('lab-caption-text');
    const open = document.getElementById('lab-open');
    const root = document.documentElement;

    let current = tools[0];
    let armed = false;      // true once the section has come into view
    let iframe = null;

    function srcFor(tool) {
        const url = new URL(tool.src);
        const mode = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
        if (tool.themes) url.searchParams.set('theme', tool.themes[mode]);
        if (tool.accent) url.searchParams.set('accent', tool.accent[mode]);
        if (tool.spin && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
            url.searchParams.set('rotate', '1');
        }
        return url.toString();
    }

    function mount() {
        if (iframe) iframe.remove();
        // Most tools fit the panel's shape; one that needs a set height says so.
        frame.style.minHeight = current.min_height ? current.min_height + 'px' : '';
        status.textContent = 'Loading ' + current.title + '…';
        status.hidden = false;
        shield.hidden = true;

        iframe = document.createElement('iframe');
        iframe.className = 'lab-iframe';
        iframe.title = current.frame_title || current.title + ', running live';
        iframe.src = srcFor(current);
        iframe.setAttribute('allow', 'fullscreen');
        iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        // The load event waits for every file the app asks for, three.js and
        // the archive index included, while the apps draw progressively long
        // before that. So the cover lifts at load or after 1.5 s, whichever
        // comes first, and the app's own first paint shows through.
        const reveal = () => {
            if (status.hidden) return;
            status.hidden = true;
            shield.hidden = false;
        };
        iframe.addEventListener('load', reveal, { once: true });
        setTimeout(reveal, 1500);
        frame.appendChild(iframe);
    }

    // The picker: one card in view, moved with the arrows, the arrow keys or a
    // swipe, wrapping round at either end. Quick presses settle before the
    // frame reloads, so passing a tool does not start it.
    const track = document.getElementById('lab-track');
    const viewport = document.getElementById('lab-viewport');
    let index = 0, settle = null;

    function show(i) {
        index = (i + tools.length) % tools.length;
        current = tools[index];
        track.style.transform = 'translateX(calc(' + (-index) + ' * (100% + 10px)))';
        picks.forEach((c, k) => {
            if (k === index) c.removeAttribute('aria-hidden');
            else c.setAttribute('aria-hidden', 'true');
        });
        caption.textContent = current.caption.trim();
        open.href = current.href;
        open.firstChild.textContent = 'Open ' + current.title + ' ';
        clearTimeout(settle);
        if (armed) settle = setTimeout(mount, 350);
    }

    document.getElementById('lab-prev').addEventListener('click', () => show(index - 1));
    document.getElementById('lab-next').addEventListener('click', () => show(index + 1));
    document.querySelector('.lab-picker').addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
    });

    // Swipe, or drag with a mouse: the row follows the pointer, and a move of
    // a sixth of its width, or a quick flick, turns to the next card.
    let x0 = null, t0 = 0, dx = 0;
    viewport.addEventListener('pointerdown', (e) => {
        x0 = e.clientX; t0 = performance.now(); dx = 0;
        viewport.setPointerCapture(e.pointerId);
        viewport.classList.add('dragging');
        track.style.transition = 'none';
    });
    viewport.addEventListener('pointermove', (e) => {
        if (x0 === null) return;
        dx = e.clientX - x0;
        track.style.transform = 'translateX(calc(' + (-index) + ' * (100% + 10px) + ' + dx + 'px))';
    });
    const release = () => {
        if (x0 === null) return;
        x0 = null;
        viewport.classList.remove('dragging');
        track.style.transition = '';
        const fast = Math.abs(dx) > 30 && performance.now() - t0 < 300;
        if (dx < 0 && (fast || -dx > viewport.clientWidth / 6)) show(index + 1);
        else if (dx > 0 && (fast || dx > viewport.clientWidth / 6)) show(index - 1);
        else track.style.transform = 'translateX(calc(' + (-index) + ' * (100% + 10px)))';
    };
    viewport.addEventListener('pointerup', release);
    viewport.addEventListener('pointercancel', release);

    // Page scrolling stays with the page until the visitor chooses the tool.
    shield.addEventListener('click', () => {
        shield.hidden = true;
        if (iframe) iframe.focus();
    });
    frame.addEventListener('mouseleave', () => {
        if (iframe && status.hidden) shield.hidden = false;
    });

    // A themed tool follows the site's light/dark switch.
    new MutationObserver(() => {
        if (armed && (current.themes || current.accent)) mount();
    }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    // Load after the page itself has finished, so the tool never competes
    // with the page's first paint; and only once the panel is near view.
    function arm() {
        if (armed) return;
        armed = true;
        mount();
    }
    function whenLoaded(fn) {
        if (document.readyState === 'complete') fn();
        else window.addEventListener('load', fn, { once: true });
    }
    whenLoaded(() => {
        if (!('IntersectionObserver' in window)) { arm(); return; }
        const io = new IntersectionObserver((entries) => {
            if (!entries.some((e) => e.isIntersecting)) return;
            io.disconnect();
            arm();
        }, { rootMargin: '200px 0px' });
        io.observe(frame);
    });
})();
