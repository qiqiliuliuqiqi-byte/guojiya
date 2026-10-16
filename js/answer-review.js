/* 交卷后的原文、译文与AI 服务 讲解；题库答案保持独立。 */
const AnswerReview = (() => {
  let entries = [], serial = 0;
  const cache = new Map(), pending = new Map();
  const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = value => String(value || '').toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
  const sentences = value => SYNSentences(value).map(s => s.trim());
  function paragraphs(g = {}) {
    if (Array.isArray(g.transcript)) return g.transcript.filter(p => p.text).map(p => ({text:p.text, translation:p.translation || ''}));
    if (g.material?.paragraphs?.length) return g.material.paragraphs;
    return g.material?.text ? [{text:g.material.text, translation:g.material.translation || ''}] : [];
  }
  function context(it) {
    const {q, g = {}} = it, ps = paragraphs(g);
    const num = String(q.blankNumber || q.questionNumber).replace(/[^0-9]/g, '');
    const blank = new RegExp('(?:__' + num + '__|\\b' + num + '\\._+)');
    const quotes = [q.keySentence || '', ...(q.analysis || '').match(/[A-Za-z][A-Za-z0-9\s,.;:!?()’'\-]+/g) || []].filter(s => s.trim().split(/\s+/).length >= 5).map(s => norm(s).replace(/^'+|'+$/g, ''));
    let selected = [];
    if (g.subCategory === 'cloze') {
      selected = ps.filter(p => blank.test(p.text)).map(p => {
        const en = sentences(p.text), cn = (p.translation || '').match(/[^。！？]+[。！？]+[”’]?|[^。！？]+$/g) || [];
        const index = en.findIndex(s => blank.test(s));
        if (index >= 0 && en.length === cn.length) return {text:en[index], translation:cn[index].trim(), label:'完整题句与译文'};
        return {...p, label:'所在段落与译文'};
      });
    } else if (g.subCategory === 'matching') {
      selected = ps.filter(p => String(p.id || p.label) === String(q.correctAnswer)).map(p => ({...p, label:'对应段落与译文'}));
    } else if (quotes.length) {
      selected = ps.filter(p => quotes.some(s => norm(p.text).includes(s))).map(p => ({...p, label:g.type === 'listening' ? '听力原句与译文' : '依据所在段落与译文'}));
    }
    return {all:ps, selected};
  }
  function reset() {
    translationPending.forEach(ctrl => ctrl.abort()); translationPending.clear(); texts.clear();
    pending.forEach(p => p.abort()); pending.clear(); entries = []; serial++;
  }
  function sourceHTML(p, it) {
    return `<div class="ar-source"><div class="ar-original">${textHTML(p.text, it, p.translation || '')}</div></div>`;
  }
  function render(it) {
    const id = serial + '-' + entries.length;
    const ctx = context(it); entries.push({id, it, ctx, history:[]});
    const wrong = Object.entries(it.q.wrongOptions || {});
    return `<div class="ar-review" id="ar-${id}">
      ${ctx.selected.map(p => `<div class="rx-analysis"><strong>${safe(p.label)} <small>· 题库原有</small></strong>${sourceHTML(p, it)}</div>`).join('')}
      ${ctx.all.length ? `<details class="ar-full"><summary>查看完整原文与译文</summary>${ctx.all.map(p => sourceHTML(p, it)).join('')}</details>` : '<p class="ar-note">此题缺少原文，AI 无法核对原文依据。</p>'}
      ${wrong.length ? `<div class="rx-analysis"><strong>其他选项为什么不对 · 题库解析</strong>${wrong.map(([key, reason]) => `<p><b>${safe(key)}：</b>${safe(reason)}</p>`).join('')}</div>` : ''}
      <div class="ar-controls"><button class="btn btn-outline" type="button" data-ar-start onclick="AnswerReview.ask('${id}')">AI 讲清楚这题</button><button class="btn btn-outline" type="button" onclick="AnswerReview.ask('${id}', 'translate')">AI 整句翻译</button><button class="btn btn-outline" type="button" data-ar-cancel hidden onclick="AnswerReview.cancel('${id}')">停止</button></div>
      <div class="ar-output" role="status" aria-live="polite"></div>
      <details class="ar-follow"><summary>我还有疑问，继续问</summary><form onsubmit="event.preventDefault(); AnswerReview.ask('${id}', 'followup')"><input aria-label="对这道题的疑问" maxlength="500" placeholder="例如：B 和 D 都说得通，为什么不能选 D？"><button class="btn btn-outline" type="submit">追问</button></form></details>
      <p class="ar-note">开源模型服务 · AI 内容供理解参考，题库答案与解析保留在上方。</p>
    </div>`;
  }
  function payload(entry, mode, question) {
    const {it, ctx} = entry, {q,g = {}} = it;
    return {mode, question, history:mode === 'followup' ? entry.history || [] : [], stem:q.statementText || q.questionText || `第 ${q.questionNumber} 题：选择填空词`, number:q.questionNumber,
      type:g.subCategory || g.type || it.part, options:q.options?.length ? q.options : (g.wordBank || []).map(w => ({label:w.letter, text:w.word})),
      answer:String(q.correctAnswer || ''), chosen:String(it.a || ''), analysis:q.analysis || '', wrongOptions:q.wrongOptions || {},
      blankAnswers:g.subCategory === 'cloze' ? (g.questions || [q]).map(item => ({number:item.blankNumber || item.questionNumber, word:item.correctWord || (g.wordBank || []).find(w => w.letter === item.correctAnswer)?.word || item.correctAnswer})) : [],
      focus:ctx.selected.map(p => p.text).join('\n'), source:ctx.all.map(p => p.text).join('\n'), sourceTranslation:ctx.selected.map(p => p.translation || '').join('\n')};
  }
  function resultHTML(data) {
    return `<div class="rx-analysis"><strong>${data.mode === 'translate' ? 'AI 整句翻译' : 'AI 讲解'} · AI 生成</strong>
      ${(data.translations || []).map(t => `<div class="ar-source"><div>${safe(t.text)}</div><div class="ar-translation">${safe(t.translation)}</div></div>`).join('')}
      ${data.evidence?.quote ? `<div class="rx-keysent"><b>原文依据</b><p>${safe(data.evidence.quote)}</p><p>${safe(data.evidence.translation)}</p></div>` : ''}
      ${data.explanation ? `<p class="ar-prose">${safe(data.explanation)}</p>` : ''}
      ${(data.options || []).map(o => `<p><b>${safe(o.label)}：</b>${safe(o.reason)}</p>`).join('')}
      ${data.takeaway ? `<p><b>下次怎么判断：</b>${safe(data.takeaway)}</p>` : ''}
      ${data.caution ? `<p class="ar-note">${safe(data.caution)}</p>` : ''}
    </div>`;
  }
  async function ask(id, mode = 'explain') {
    const entry = entries.find(e => e.id === id), root = document.getElementById('ar-' + id);
    if (!entry || !root || pending.has(id)) return;
    const question = mode === 'followup' ? root.querySelector('input').value.trim() : '';
    if (mode === 'followup' && !question) { root.querySelector('input').focus(); return; }
    const body = payload(entry, mode, question), key = JSON.stringify(body), out = root.querySelector('.ar-output');
    if (cache.has(key)) {
      const cached = cache.get(key); out.innerHTML = cached.html;
      remember(entry, cached.data, question, mode); return;
    }
    const ctrl = new AbortController(); pending.set(id, ctrl);
    root.querySelectorAll('.ar-controls button:not([data-ar-cancel]), form button').forEach(b => b.disabled = true);
    root.querySelector('[data-ar-cancel]').hidden = false;
    out.textContent = '正在通过 AI 服务阅读原文并组织讲解…首次加载模型会稍慢。';
    const timer = setTimeout(() => ctrl.abort(), 150000);
    try {
      const response = await fetch('/api/tutor/explain', {method:'POST', headers:{'Content-Type':'application/json'}, body:key, signal:ctrl.signal});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI 讲解暂不可用');
      const html = resultHTML({...data, mode});
      remember(entry, data, question, mode);
      if (cache.size >= 60) cache.delete(cache.keys().next().value);
      cache.set(key, {html, data});
      if (root.isConnected) out.innerHTML = html;
    } catch (error) {
      if (root.isConnected) out.textContent = error.name === 'AbortError' ? '讲解已停止或等待超时，可以重试。' : error.message;
    } finally {
      clearTimeout(timer); pending.delete(id);
      root.querySelectorAll('.ar-controls button, form button').forEach(b => b.disabled = false);
      root.querySelector('[data-ar-cancel]').hidden = true;
    }
  }
  function remember(entry, data, question, mode) {
    entry.history.push({question:question || (mode === 'translate' ? '请翻译这道题' : '请解释这道题为什么这样选'), reply:JSON.stringify(data).slice(0,5000)});
    if (entry.history.length > 3) entry.history.shift();
  }
  function cancel(id) { pending.get(id)?.abort(); }
  // 四级/雅思旧版练习数据统一为相同的讲解上下文，不生成或更改题目。
  function legacy(questions, answers) {
    const items = [];
    const convert = (q, a, g, part) => ({a, g, part, q:{questionNumber:(q.q || '').split('.')[0], questionText:q.q, correctAnswer:q.answer,
      options:(q.options || []).map((text, i) => ({label:String.fromCharCode(65+i), text:text.replace(/^[A-Z][).]\s*/, '')})), analysis:q.analysis || q.explanation || ''}});
    (questions.listening.sections || []).forEach((sec, si) => (sec.questions || []).forEach((p, pi) => (p.questions || []).forEach((q, qi) => {
      items.push(convert(q, answers[`listen_${si}-${pi}-${qi}`], {type:'listening',material:{text:p.passage || '',translation:p.translation || ''}}, '听力'));
    })));
    (questions.reading.sections || []).forEach((sec, si) => {
      if (sec.wordBank) Object.entries(sec.answers || {}).forEach(([n, answer]) => {
        items.push({a:answers[si + '_blank_' + n],part:'阅读',q:{questionNumber:n,blankNumber:n,correctAnswer:answer},g:{subCategory:'cloze',material:{text:sec.passage,translation:sec.translation || ''},wordBank:sec.wordBank.map(w => ({letter:w,word:w}))}});
      });
      if (sec.statements) sec.statements.forEach((q, i) => {
        const ps = (sec.paragraphs || []).map(p => ({id:p.slice(0,1),text:p,translation:''}));
        items.push({a:answers['match_' + q.id],part:'阅读',q:{questionNumber:i+1,statementText:q.text,correctAnswer:q.answer,options:sec.options ? sec.options.map(label => ({label,text:({T:'TRUE',F:'FALSE',NG:'NOT GIVEN'})[label] || label})) : []},g:{subCategory:sec.options ? 'true-false-not-given' : 'matching',material:{paragraphs:ps}}});
      });
      (sec.passages || []).forEach((p, pi) => (p.questions || []).forEach(q => {
        items.push(convert(q, answers['read_' + si + '_' + pi + '_' + q.q.split('.')[0]], {type:'reading',material:{text:p.content || p.text || '',translation:p.translation || ''}}, '阅读'));
      }));
    });
    return items;
  }
  // 答案页每一块英文保留自己的语境，弹窗不会误取相邻题目的译文。
  let textSerial = 0;
  const texts = new Map(), translationCache = new Map(), translationPending = new Set();
  function textHTML(text, it, translation = '', originalHTML) {
    const id = serial + '-t' + textSerial++;
    texts.set(id, {text:String(text || ''), translation, it});
    const original = originalHTML ?? (typeof rxWrapSentences === 'function' ? rxWrapSentences(text) : safe(text));
    return `<span data-ar-text="${id}">${original} <button type="button" class="rx-cn-btn" aria-expanded="false" aria-controls="ar-cn-${id}" onclick="AnswerReview.toggleTranslation(this)">点击译文</button><span id="ar-cn-${id}" class="ar-translation ar-inline-translation" hidden></span></span>`;
  }
  function knownTranslation(record, text) {
    const ps = [{text:record.text, translation:record.translation}, ...paragraphs(record.it?.g)];
    for (const p of ps) {
      if (!p.translation) continue;
      if (norm(p.text) === norm(text)) return p.translation;
      const en = sentences(p.text), cn = p.translation.match(/[^。！？]+[。！？]+[”’]?|[^。！？]+$/g) || [];
      const index = en.findIndex(s => norm(s) === norm(text));
      if (index >= 0 && en.length === cn.length) return cn[index].trim();
    }
    return '';
  }
  function translationBody(record, text) {
    const it = record.it;
    const body = it ? payload({it, ctx:context(it)}, 'translate', '') : {};
    const stem = it?.q?.questionText || it?.q?.statementText || '';
    const question = '只翻译 stem 中的英文，不解题。保留原句动作的发出者、接受者、否定和条件。省略主语的选项也省略主语，不得把宾语改成主语，不添加原文没有的“请某人/让某人”。' + (stem ? '\n原题题干（仅用于明确人物关系）：' + stem.slice(0,250) : '');
    return {...body, mode:'translate', question, stem:text, options:[], focus:'', source:body.source || record.text || text};
  }
  function mountTranslation(host, record, text, title = '译文') {
    const known = knownTranslation(record, text);
    let disposed = false, controller = null;
    host.innerHTML = `<strong>${safe(title)} · ${known ? '题库原有' : 'AI 服务'}</strong><span class="ar-inline-translation" data-ar-cn-content role="status" aria-live="polite"></span><button type="button" class="rx-cn-btn" data-ar-cn-retry hidden>重试翻译</button>`;
    const content = host.querySelector('[data-ar-cn-content]'), retry = host.querySelector('[data-ar-cn-retry]');
    const run = async () => {
      if (known) { content.textContent = known; return; }
      const body = translationBody(record, text), key = JSON.stringify(body);
      if (translationCache.has(key)) { content.textContent = translationCache.get(key); return; }
      controller = new AbortController();
      const ctrl = controller;
      translationPending.add(ctrl);
      retry.hidden = true;
      content.textContent = '正在通过 AI 服务翻译…首次加载模型会稍慢。';
      const timer = setTimeout(() => ctrl.abort(), 150000);
      try {
        const response = await fetch('/api/tutor/explain', {method:'POST', headers:{'Content-Type':'application/json'}, body:key, signal:ctrl.signal});
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '暂时无法翻译，请重试。');
        const item = (data.translations || []).find(t => norm(t.text) === norm(text));
        if (!item || !/[\u3400-\u9fff]/.test(item.translation || '')) throw new Error('未返回此句的完整译文，请重试。');
        if (translationCache.size >= 200) translationCache.delete(translationCache.keys().next().value);
        translationCache.set(key, item.translation);
        if (!disposed && host.isConnected) content.textContent = item.translation;
      } catch (error) {
        if (!disposed && host.isConnected) {
          content.textContent = error.name === 'AbortError' ? '翻译已停止或等待超时，请重试。' : error.message;
          retry.hidden = false;
        }
      } finally {
        clearTimeout(timer); translationPending.delete(ctrl);
      }
    };
    retry.addEventListener('click', run);
    run();
    return () => { disposed = true; controller?.abort(); retry.removeEventListener('click', run); };
  }
  function toggleTranslation(button) {
    const wrapper = button.closest('[data-ar-text]');
    const record = texts.get(wrapper?.dataset.arText), host = wrapper?.querySelector('.ar-translation');
    if (!record || !host) return;
    const show = host.hidden;
    host.hidden = !show;
    button.textContent = show ? '收起译文' : '点击译文';
    button.setAttribute('aria-expanded', String(show));
    host._disposeTranslation?.();
    host._disposeTranslation = show ? mountTranslation(host, record, record.text) : null;
  }
  function mountSentenceTranslation(host, sentence, trigger) {
    const wrapper = trigger.closest('[data-ar-text]');
    const record = texts.get(wrapper?.dataset.arText);
    if (!record) return () => {};
    return mountTranslation(host, record, sentence, '整句译文');
  }

  if (typeof window !== 'undefined') window.addEventListener('hashchange', reset);
  return {reset, render, context, payload, ask, cancel, legacy, textHTML, toggleTranslation, mountSentenceTranslation, knownTranslation, translationBody};
})();
