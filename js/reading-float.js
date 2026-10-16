/* 阅读词库、单题与整组题目：原节点悬浮，保留占位和原有事件。 */
const ReadingFloat = (() => {
  const panels = new Map();
  let storageKey = '', positions = {}, scanFrame = 0, drag = null, moveFrame = 0;

  function raise(panel) {
    for (const p of panels.values()) if (p.floating) p.el.style.zIndex = p === panel ? '92' : '91';
  }

  function bounds() {
    return { width: window.innerWidth, height: window.innerHeight,
      top: Math.max(8, (document.querySelector('.site-header')?.getBoundingClientRect().bottom || 0) + 8) };
  }
  function constrain(x, y, width, height, view) {
    return { x: Math.max(8, Math.min(x, Math.max(8, view.width - width - 8))),
      y: Math.max(view.top, Math.min(y, Math.max(view.top, view.height - height - 8))) };
  }
  function validPosition(p) {
    return p && ['x', 'y', 'width'].every(k => Number.isFinite(p[k])) && p.width > 0;
  }
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(positions)); } catch (_) { /* 无存储权限仍可拖动 */ }
  }
  function load() {
    const next = 'readingFloat_' + location.hash.split('?')[0];
    if (next === storageKey) return;
    storageKey = next;
    try {
      const data = JSON.parse(localStorage.getItem(next) || '{}');
      positions = Object.fromEntries(Object.entries(data || {}).filter(([k, p]) => /^[bgq]\d+-\d+$/.test(k) && validPosition(p)));
    } catch (_) { positions = {}; }
  }
  function place(panel, x, y) {
    const rect = panel.el.getBoundingClientRect(), p = constrain(x, y, rect.width, rect.height, bounds());
    panel.el.style.left = p.x + 'px'; panel.el.style.top = p.y + 'px';
    return { ...p, width: rect.width };
  }
  function remember(panel) {
    const rect = panel.el.getBoundingClientRect();
    positions[panel.key] = { x: rect.left, y: rect.top, width: rect.width }; save();
  }
  function dock(panel, persist = true) {
    delete positions[panel.key];
    if (!panel.floating) { if (persist) save(); return; }
    panel.el.classList.remove('rf-floating');
    for (const prop of ['left', 'top', 'width', 'z-index']) panel.el.style.removeProperty(prop);
    panel.placeholder?.remove(); panel.placeholder = null; panel.floating = false;
    panel.grip.setAttribute('aria-pressed', 'false');
    if (persist) save();
  }
  function float(panel, position) {
    if (panel.floating) return;
    // 整组移动时先收回它里面已移开的单题，避免父子重复悬浮。
    for (const child of panels.values()) if (child !== panel && panel.el.contains(child.el)) dock(child, false);
    const rect = panel.el.getBoundingClientRect(), view = bounds();
    let anchor = panel.el;
    while (anchor && !anchor.nextElementSibling && anchor.id !== 'app') anchor = anchor.parentElement;
    anchor = anchor?.nextElementSibling;
    const anchorTop = anchor?.getBoundingClientRect().top;
    const placeholder = document.createElement('div');
    placeholder.className = 'rf-placeholder'; placeholder.setAttribute('aria-hidden', 'true');
    placeholder.style.height = rect.height + 'px';
    const style = getComputedStyle(panel.el);
    placeholder.style.marginTop = style.marginTop; placeholder.style.marginBottom = style.marginBottom;
    panel.el.before(placeholder); panel.placeholder = placeholder;
    panel.floating = true; panel.el.classList.add('rf-floating');
    // 容纳原来折叠到父元素外的末尾 margin，避免移开整组后正文跳动。
    if (anchor) placeholder.style.height = Math.max(0, rect.height + anchorTop - anchor.getBoundingClientRect().top) + 'px';
    panel.el.style.width = Math.max(160, Math.min(position?.width || rect.width, panel.kind === 'bank' ? 660 : 560, view.width - 16)) + 'px';
    raise(panel);
    panel.grip.setAttribute('aria-pressed', 'true');
    place(panel, position?.x ?? rect.left, position?.y ?? rect.top);
    remember(panel);
  }
  function flushMove() {
    if (!drag?.moved) return;
    place(drag.panel, drag.x, drag.y);
  }
  function begin(event, panel) {
    if (event.button !== 0 || event.isPrimary === false || drag) return;
    event.preventDefault(); event.stopPropagation();
    const rect = panel.el.getBoundingClientRect();
    drag = { panel, id: event.pointerId, startX: event.clientX, startY: event.clientY,
      left: rect.left, top: rect.top, x: rect.left, y: rect.top, moved: false };
    try { panel.grip.setPointerCapture(event.pointerId); } catch (_) { /* 文档级监听兜底 */ }
    panel.grip.classList.add('rf-grabbing');
  }
  function move(event) {
    if (!drag || event.pointerId !== drag.id) return;
    event.preventDefault(); event.stopPropagation();
    const dx = event.clientX - drag.startX, dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    if (!drag.moved) {
      float(drag.panel);
      const rect = drag.panel.el.getBoundingClientRect();
      // 工具条由框外移到框内后，仍让手指抓住原来的拖动把手。
      const grip = drag.panel.grip.getBoundingClientRect();
      drag.left = drag.startX - (grip.left - rect.left) - Math.min(24, grip.width / 2);
      drag.top = drag.startY - (grip.top - rect.top) - grip.height / 2;
      drag.moved = true;
    }
    drag.x = drag.left + dx; drag.y = drag.top + dy;
    if (!moveFrame) moveFrame = requestAnimationFrame(() => { moveFrame = 0; flushMove(); });
  }
  function end(event, cancelled = false) {
    if (!drag || event.pointerId !== drag.id) return;
    event.preventDefault(); event.stopPropagation();
    if (moveFrame) { cancelAnimationFrame(moveFrame); moveFrame = 0; }
    flushMove();
    const current = drag; drag = null;
    current.panel.grip.classList.remove('rf-grabbing');
    try { if (current.panel.grip.hasPointerCapture(event.pointerId)) current.panel.grip.releasePointerCapture(event.pointerId); } catch (_) {}
    if (current.moved) remember(current.panel);
    else if (!cancelled) current.panel.floating ? dock(current.panel) : float(current.panel);
  }
  function abandonDrag() {
    if (!drag) return;
    if (moveFrame) { cancelAnimationFrame(moveFrame); moveFrame = 0; }
    const current = drag; drag = null;
    current.panel.grip.classList.remove('rf-grabbing');
    try { current.panel.grip.releasePointerCapture(current.id); } catch (_) {}
    if (current.panel.floating && current.panel.el.isConnected) remember(current.panel);
  }
  function enhance(el, key, kind) {
    const title = kind === 'bank' ? '词库' : kind === 'group' ? '整组题目' : '本题';
    el.classList.add('rf-panel'); el.dataset.rfKey = key;
    const toolbar = document.createElement('div'); toolbar.className = 'rf-toolbar';
    const grip = document.createElement('button');
    grip.type = 'button'; grip.className = 'rf-grip'; grip.textContent = '↕ ' + title;
    grip.title = '拖动' + title + '；点按可悬浮，方向键微调';
    grip.setAttribute('aria-label', '移动' + title); grip.setAttribute('aria-pressed', 'false');
    const home = document.createElement('button');
    home.type = 'button'; home.className = 'rf-home'; home.textContent = '还原'; home.title = '放回原位置';
    toolbar.append(grip, home); el.prepend(toolbar);
    const panel = { el, key, kind, grip, floating: false, placeholder: null }; panels.set(key, panel);
    grip.addEventListener('pointerdown', e => begin(e, panel));
    grip.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); });
    grip.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); e.stopPropagation(); panel.floating ? dock(panel) : float(panel);
      } else if (panel.floating && /^Arrow(Up|Down|Left|Right)$/.test(e.key)) {
        e.preventDefault(); e.stopPropagation(); const r = el.getBoundingClientRect(), step = e.shiftKey ? 20 : 5;
        place(panel, r.left + (e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0),
          r.top + (e.key === 'ArrowDown' ? step : e.key === 'ArrowUp' ? -step : 0)); remember(panel);
      }
    });
    home.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); dock(panel); });
    el.addEventListener('pointerdown', () => { if (panel.floating) raise(panel); }, { passive: true });
    return panel;
  }
  function scan() {
    scanFrame = 0;
    if (drag && !drag.panel.el.isConnected) abandonDrag();
    const active = document.querySelector('#rxTabs .practice-tab.active, #practiceTabs .practice-tab.active');
    if (!/^#\/practice\//.test(location.hash) || active?.dataset.section !== 'reading') return;
    const root = document.getElementById(active.closest('#rxTabs') ? 'rxSection' : 'sectionContent');
    if (!root) return;
    load();
    for (const [key, panel] of panels) if (!panel.el.isConnected) panels.delete(key);
    // 只把相邻题目编为一组，文章正文始终留在原处。
    for (const question of root.querySelectorAll('.choice-question')) {
      if (question.parentElement.classList.contains('rf-question-group')) continue;
      const group = document.createElement('div'); group.className = 'rf-question-group';
      question.before(group);
      let next = question;
      while (next?.classList.contains('choice-question')) {
        const sibling = next.nextElementSibling; group.append(next); next = sibling;
      }
    }
    let scopeIndex = 0;
    const restore = [];
    for (const scope of root.querySelectorAll('.question-panel')) {
      const scopeKey = scopeIndex++;
      const add = (selector, prefix, kind) => Array.from(scope.querySelectorAll(selector)).forEach((el, i) => {
        const key = prefix + scopeKey + '-' + i;
        if (el.dataset.rfKey === key && panels.get(key)?.el === el) return;
        const panel = enhance(el, key, kind);
        if (positions[key]) restore.push(panel);
      });
      add('.word-bank', 'b', 'bank'); add('.rf-question-group', 'g', 'group'); add('.choice-question', 'q', 'question');
    }
    for (const panel of restore) {
      // 先恢复整组，再决定是否还需要恢复其中单题。
      if (positions[panel.key] && !panel.el.parentElement.closest('.rf-floating')) float(panel, positions[panel.key]);
    }
  }
  function schedule() { if (!scanFrame) scanFrame = requestAnimationFrame(scan); }
  function init() {
    new MutationObserver(schedule).observe(document.getElementById('app') || document.body, { childList: true, subtree: true });
    // 某些触屏在节点改为 fixed 后会丢失捕获，仍由同一指针完成拖动。
    document.addEventListener('pointermove', move, { capture: true, passive: false });
    document.addEventListener('pointerup', e => end(e), true);
    document.addEventListener('pointercancel', e => end(e, true), true);
    window.addEventListener('blur', abandonDrag);
    window.addEventListener('hashchange', schedule);
    window.addEventListener('resize', () => {
      for (const panel of panels.values()) if (panel.floating && panel.el.isConnected) {
        panel.el.style.width = Math.min(panel.el.getBoundingClientRect().width, window.innerWidth - 16) + 'px';
        const p = positions[panel.key]; if (p) { place(panel, p.x, p.y); remember(panel); }
      }
    });
    schedule();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  return { constrain, validPosition };
})();
