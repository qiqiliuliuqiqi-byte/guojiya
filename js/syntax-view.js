/* 原句关系标注：只读 SYN 分析结果，不修改试题、答题状态或涂鸦存储。 */
const SYNView = (() => {
  const colors = { 'r-subj':'#1d4ed8', 'r-pred':'#15803d', 'r-obj':'#b45309', 'r-pred2':'#0f766e', 'r-attr':'#be185d', 'r-rel':'#4338ca', 'r-adv':'#6d28d9', 'r-noun':'#0369a1', 'r-comp':'#c2410c', 'r-app':'#a21caf' };
  const uniq = a => [...new Set(a)].sort((a, b) => a - b);
  const color = n => colors[SYNRoleClass(n.role)] || '#64748b';
  const clean = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

  // 用原 token 的对象身份定位，禁止用 indexOf(text) 猜测重复单词的位置。
  function model(data) {
    const tokens = data.tokens || [], lookup = new Map(tokens.map((t, i) => [t, i]));
    const nodes = [], roots = [];
    const indices = ts => (ts || []).map(t => lookup.get(t)).filter(Number.isInteger);
    function visit(raw, parent, clause) {
      const n = { id:nodes.length, role:raw.role || '其他成分', phrase:raw.phrase || '', note:raw.note || '', own:indices(raw.tokens), parent, clause, children:[], target:[], relation:'', explicit:!!raw.explicitRelation, declaredTarget:indices(raw.targetTokens), declaredRelation:raw.relation||'' };
      nodes.push(n);
      n.children = (raw.children || []).map(k => visit(k, n.id, clause));
      n.ids = uniq(n.own.concat(...n.children.map(id => nodes[id].ids)));
      return n.id;
    }
    (data.clauses || []).forEach((c, ci) => {
      const ids = (c.parts || []).map(p => visit(p, null, ci));
      if (!['main','main2','cont','coord'].includes(c.kind)) {
        const raw = {role: c.kind === 'adv' ? '状语从句' : c.kind === 'rel' ? '定语从句' : c.nounRole || '名词性从句', phrase:c.label, tokens:c.tokens};
        const id = visit(raw, null, ci), n = nodes[id];
        n.children = ids;
        ids.forEach(i => { nodes[i].parent = id; });
        n.ids = uniq(n.own.concat(...ids.map(i => nodes[i].ids)));
        roots.push(id);
      } else roots.push(...ids);
    });
    const siblings = n => n.parent === null ? roots.filter(id => nodes[id].clause === n.clause) : nodes[n.parent].children;
    const findRole = (n, role) => siblings(n).map(i => nodes[i]).find(k => role.test(k.role));
    const assign = (n, target, relation) => {
      const ids = Array.isArray(target) ? target : target ? target.own : [];
      n.target = uniq(ids.filter(i => !n.ids.includes(i)));
      n.relation = n.target.length ? relation : '';
    };
    nodes.forEach(n => {
      if(n.explicit) { assign(n,n.declaredTarget,n.declaredRelation); return; }
      const p = n.parent === null ? null : nodes[n.parent];
      const head = p && p.children.map(i => nodes[i]).find(k => k.role === '中心词');
      const pred = findRole(n, /^谓语$/), subj = findRole(n, /^主语$/);
      if (/定语|修饰|限定词|数词|同位语/.test(n.role) && head) assign(n, head, /同位语/.test(n.role) ? '解释说明' : '修饰 / 限定');
      // 引擎已有的明确修饰对象优先在父短语或当前分句内解析；歧义时不画猜测箭头。
      const named = n.note.match(/修饰(?:先行词|谓语)?\s+([a-zA-Z][a-zA-Z' -]*?)(?=[，,（(/]|$)/);
      if (!n.target.length && named) {
        const words = named[1].trim().split(/\s+/).map(clean);
        const scope = p ? p.ids : uniq(nodes.filter(k => k.clause === n.clause).flatMap(k => k.own));
        const matches = scope.filter(i => !n.ids.includes(i) && words.every((w, j) => tokens[i+j] && scope.includes(i+j) && !n.ids.includes(i+j) && tokens[i+j].c === w));
        if (matches.length === 1) assign(n, words.map((_, j) => matches[0]+j), '修饰');
      }
      if (n.target.length) return;
      if (n.role === '主语') assign(n, pred, '主谓关系');
      else if (/^(宾语|直接宾语|间接宾语)$/.test(n.role)) assign(n, pred, '动宾关系');
      else if (n.role === '表语') assign(n, subj, '说明主语');
      else if (n.role === '宾语补足语') assign(n, findRole(n, /^(宾语|直接宾语)$/), '补充说明宾语');
      else if (/^(状语|伴随状语)$/.test(n.role)) assign(n, pred || (p && /动名词|不定式/.test(p.phrase) ? head : null), '修饰谓语');
      else if (n.role === '谓语') assign(n, subj, '主谓关系');
      else if (n.role === '状语从句') {
        const mains = roots.map(i => nodes[i]).filter(k => k.role === '谓语' && k.clause !== n.clause);
        if (mains.length === 1) assign(n, mains[0], '修饰主句');
      }
      else if (n.role === '宾语从句') {
        const before = roots.map(i => nodes[i]).filter(k => k.role === '谓语' && k.clause === n.clause-1);
        assign(n, pred || (before.length === 1 ? before[0] : null), '作谓语的宾语');
      }
      else if (n.role === '主语从句') assign(n, pred, '作主语');
      else if (n.role === '表语从句') assign(n, subj, '说明主语');
    });
    // 引擎未覆盖的片段也留在可点击范围内，不把缺失分析伪装成确定关系。
    const covered = new Set(nodes.flatMap(n => n.own));
    const missing = [];
    tokens.forEach((t,i) => {
      if (covered.has(i)) return;
      const last = missing[missing.length-1];
      if (last && last[last.length-1] === i-1) last.push(i); else missing.push([i]);
    });
    missing.forEach(ids => {
      const connector = ids.every(i => ['CONJ','SUB','REL','PUNC','PUNCT','SCONJ','CCONJ'].includes(tokens[i].pos));
      const n = {id:nodes.length, role:connector ? '连接成分' : '待分析片段', phrase:'', note:connector ? '连接分句或并列成分。' : '此处关系需要结合上下文核对。', own:ids, ids, parent:null, clause:-1, children:[], target:[], relation:''};
      nodes.push(n); roots.push(n.id);
    });
    roots.sort((a,b) => (nodes[a].ids[0] ?? Infinity) - (nodes[b].ids[0] ?? Infinity));
    return {data, tokens, nodes, roots};
  }

  function mount(host, data) {
    const m = model(data);
    if (!m.tokens.length) return () => {};
    let selected = m.nodes.find(n => /定语|状语/.test(n.role) && n.target.length) || m.nodes.find(n => n.target.length) || m.nodes[0];
    let disposed = false, frame = 0;
    const textOf = ids => { let last=-2,end=0; return ids.map(i=>{ const t=m.tokens[i], gap=last<0?'':i===last+1?data.text.slice(end,t.start):' '; last=i;end=t.end;return gap+t.w; }).join(''); };
    let cursor = 0;
    const sentence = m.tokens.map((t, i) => {
      const before = data.text.slice(cursor, t.start); cursor = t.end;
      return esc(before) + `<span class="syn-v-word" data-word="${i}">${esc(data.text.slice(t.start, t.end))}</span>`;
    }).join('') + esc(data.text.slice(cursor));
    function chip(id) {
      const n = m.nodes[id];
      if (!n.ids.length) return '';
      return `<button type="button" class="syn-v-chip" data-node="${id}" aria-pressed="false" style="--syn-ink:${color(n)}"><span class="syn-tag ${SYNRoleClass(n.role)}">${esc(n.role)}</span><span>${esc(textOf(n.own.length ? n.own : n.ids))}</span></button>`;
    }
    function branch(id) {
      const n = m.nodes[id];
      return `<div class="syn-v-branch">${chip(id)}${n.children.length ? `<details><summary>展开${esc(n.phrase || '短语')}内部成分</summary>${n.children.map(branch).join('')}</details>` : ''}</div>`;
    }
    host.innerHTML = `<div class="syn-v-toolbar" role="group" aria-label="句式显示方式"><button type="button" data-view="mark" aria-pressed="true">原句标注</button><button type="button" data-view="tree" aria-pressed="false">逐层拆解</button></div>
      <div class="syn-v-mark"><div class="syn-v-help">划线看成分 · 圈出关联对象 · 箭头看关系<br>点击原句或下方成分，可以单独查看。</div>
      <div class="syn-v-canvas"><div class="syn-v-sentence" lang="en">${sentence}</div><svg class="syn-v-svg" aria-hidden="true"></svg></div>
      <div class="syn-v-explain" aria-live="polite"></div>
      <div class="syn-v-parts">${m.roots.map(branch).join('')}</div></div>
      <div class="syn-v-tree" hidden>${SYNRenderHTML(data)}</div>`;
    const canvas = host.querySelector('.syn-v-canvas'), svg = host.querySelector('svg');
    const words = [...host.querySelectorAll('[data-word]')];
    const explain = host.querySelector('.syn-v-explain');
    // 收集每一行的实际字框；跨行、倒装的非连续成分分别划线。
    function boxes(ids) {
      const base = canvas.getBoundingClientRect(), rows = [];
      let previous = -2;
      ids.forEach(i => {
        const el = words[i];
        if (!el) return;
        const range = document.createRange(); range.selectNodeContents(el);
        [...range.getClientRects()].forEach(r => {
          if (!r.width) return;
          const b = {x:r.left-base.left, y:r.top-base.top, w:r.width, h:r.height};
          const last = rows[rows.length-1];
          if (last && i === previous+1 && Math.abs(last.y-b.y)<3) last.w = b.x+b.w-last.x;
          else rows.push(b);
        });
        previous = i;
      });
      return rows;
    }
    function path(d, ink, width, extra='') { return `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`; }
    function draw() {
      frame = 0;
      if (disposed || !canvas.getClientRects().length) return;
      const width = canvas.clientWidth, height = canvas.clientHeight, ink = selected ? color(selected) : '#64748b';
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      let out = `<defs><marker id="syn-v-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 1 1 L 8 5 L 1 9" fill="none" stroke="${ink}" stroke-width="1.6"/></marker></defs>`;
      m.roots.forEach(id => {
        const n = m.nodes[id];
        boxes(n.ids).forEach(b => {
          const y = b.y+b.h+5;
          out += path(`M ${b.x} ${y} Q ${b.x+b.w/2} ${y+2} ${b.x+b.w} ${y}`, color(n), 1.5, 'opacity=".6"');
          if (n.role === '谓语') out += path(`M ${b.x} ${y+4} L ${b.x+b.w} ${y+4}`, color(n), 1.5, 'opacity=".6"');
        });
      });
      if (selected) {
        const from = boxes(selected.ids), to = boxes(selected.target);
        from.forEach(b => { out += path(`M ${b.x} ${b.y+b.h+10} Q ${b.x+b.w/2} ${b.y+b.h+12} ${b.x+b.w} ${b.y+b.h+10}`, ink, 2.4); });
        to.forEach(b => { out += `<rect x="${b.x-4}" y="${b.y-4}" width="${b.w+8}" height="${b.h+8}" rx="${Math.min(14,b.h/2)}" fill="none" stroke="${ink}" stroke-width="1.7"/>`; });
        // 每次只画一条关系箭头，选距离最近的两行，减少长难句的线条交叉。
        let pair;
        from.forEach(a => to.forEach(b => { const dist = Math.abs(a.y-b.y)*10+Math.abs(a.x-b.x); if (!pair || dist<pair.dist) pair={a,b,dist}; }));
        if (pair) {
          const {a,b}=pair, x1=a.x+a.w/2, x2=b.x+b.w/2, y1=a.y-6, y2=b.y-7;
          const d = Math.abs(a.y-b.y)<3
            ? `M ${x1} ${y1} C ${x1} ${y1-24} ${x2} ${y2-24} ${x2} ${y2}`
            : `M ${x1} ${y1} L ${x1} ${y1-19} L ${width-9} ${y1-19} L ${width-9} ${y2-19} L ${x2} ${y2-19} L ${x2} ${y2}`;
          out += path(d,ink,1.8,'marker-end="url(#syn-v-arrow)"');
        }
      }
      svg.innerHTML = out;
    }
    function schedule() { if (!disposed && !frame) frame = requestAnimationFrame(draw); }
    function select(n, reveal) {
      selected = n;
      host.querySelectorAll('[data-node]').forEach(button => {
        const active = Number(button.dataset.node) === n.id;
        button.setAttribute('aria-pressed', String(active));
        if (active && reveal) { let p=button.parentElement; while(p && p!==host) { if(p.tagName==='DETAILS') p.open=true; p=p.parentElement; } }
      });
      words.forEach((w,i) => { w.classList.toggle('is-selected',n.ids.includes(i)); w.style.setProperty('--syn-ink',color(n)); });
      explain.innerHTML = `<span class="syn-tag ${SYNRoleClass(n.role)}">${esc(n.role)}</span> <span class="syn-phrase">${esc(n.phrase)}</span><div>${esc(textOf(n.ids))}${n.target.length ? ` <strong>→ ${esc(n.relation)}</strong> <b>${esc(textOf(n.target))}</b>` : ''}</div>${n.note ? `<div class="syn-note">${esc(n.note)}</div>` : ''}`;
      schedule();
    }
    function click(e) {
      const mode = e.target.closest('[data-view]');
      if (mode) {
        const tree = mode.dataset.view==='tree';
        host.querySelector('.syn-v-mark').hidden=tree;
        host.querySelector('.syn-v-tree').hidden=!tree;
        host.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===mode)));
        schedule(); return;
      }
      const chip = e.target.closest('[data-node]');
      if (chip) {
        select(m.nodes[Number(chip.dataset.node)],false);
        const popup = host.closest('.rx-struct-popup');
        if (popup) popup.scrollTop = 0;
        return;
      }
      const word = e.target.closest('[data-word]');
      if (word) {
        const id=Number(word.dataset.word);
        const candidates=m.nodes.filter(n=>n.ids.includes(id) && !/^(中心词|限定词|数词|不定式标记)$/.test(n.role)).sort((a,b)=>a.ids.length-b.ids.length);
        if (candidates.length) select(candidates[0],true);
      }
    }
    host.addEventListener('click',click);
    const observer = typeof ResizeObserver!=='undefined' ? new ResizeObserver(schedule) : null;
    if (observer) observer.observe(canvas);
    window.addEventListener('resize',schedule);
    if (document.fonts) document.fonts.ready.then(schedule);
    if (selected) select(selected,true); else schedule();
    return () => { disposed=true; cancelAnimationFrame(frame); if(observer) observer.disconnect(); window.removeEventListener('resize',schedule); host.removeEventListener('click',click); };
  }
  return { model, mount };
})();
