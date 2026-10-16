// ============================================================
// real-exam.js - CET6 真实真题模块
// 数据来源：guojiya.cn 官方 API（63套真题 + 6门课程）
// ============================================================

const RX = {
  index: null,        // 真题索引
  exams: {},          // examId -> 完整试卷
  courses: null,      // 课程列表
  cards: null,        // 课程卡片
  exam: null,         // 当前考试
  answers: {},        // 答案
  blankSel: null,     // 选词填空当前选中的空
  timer: null,
  timeRemaining: 0,
  tts: { playing: false, group: null, line: 0, stopped: true },
  vocab: {},
  wordPopup: null,
  dict: {},
  pronouncing: null,
  struct: null,
  sentences: {},
  sentenceSeq: 0,
  pron: {
    accent: "en-GB",   // 默认英音
    voice: null,
    voiceName: "",     // 用户手动指定的音色（空=自动优选）
    rate: 0.95,        // 语速
    speaking: null,    // 正在朗读的按钮 id
  },
};

// 朗读偏好持久化（音色 + 口音 + 语速）
const RX_PRON_KEY = "rxPronPrefs";
function rxLoadPronPrefs() {
  try {
    const p = JSON.parse(localStorage.getItem(RX_PRON_KEY) || "{}");
    if (p.accent === "en-GB" || p.accent === "en-US") RX.pron.accent = p.accent;
    if (p.voiceName) RX.pron.voiceName = p.voiceName;
    if (typeof p.rate === "number") RX.pron.rate = p.rate;
  } catch (e) { /* 忽略：本地存储不可用时用默认值 */ }
}
function rxSavePronPrefs() {
  try {
    localStorage.setItem(RX_PRON_KEY, JSON.stringify({
      accent: RX.pron.accent, voiceName: RX.pron.voiceName, rate: RX.pron.rate,
    }));
  } catch (e) { /* 忽略 */ }
}
rxLoadPronPrefs();

const RX_DATA = "data/cet6-exams";
const RX_COURSE_DATA = "data/cet6-courses";

function rxFetch(path) {
  return fetch(path).then(r => {
    if (!r.ok) throw new Error("加载失败: " + path);
    return r.json();
  });
}

function rxLoadIndex() {
  if (RX.index) return Promise.resolve(RX.index);
  return rxFetch(RX_DATA + "/index.json").then(d => (RX.index = d));
}

function rxLoadExam(examId) {
  if (RX.exams[examId]) return Promise.resolve(RX.exams[examId]);
  return rxFetch(RX_DATA + "/" + examId + ".json").then(d => (RX.exams[examId] = d));
}

function rxLoadCourses() {
  if (RX.courses) return Promise.resolve();
  return Promise.all([
    rxFetch(RX_COURSE_DATA + "/courses.json"),
    rxFetch(RX_COURSE_DATA + "/cards.json"),
  ]).then(([c, cards]) => {
    RX.courses = c;
    RX.cards = cards;
  });
}

// 判断是否为真实六级真题 ID（cet6_2026_06_1）
function rxIsRealExam(id) {
  return /^cet6_\d{4}_\d{2}_\d+$/.test(id || "");
}

// 按 examDate "2026年06月" → "2026上半年" 分组（倒序）
function rxPeriods(index) {
  const periods = {};
  const order = [];
  index.forEach(e => {
    const m = e.examDate.match(/^(\d{4})年(\d{2})月$/);
    let label = e.examDate;
    if (m) {
      label = m[1] + (Number(m[2]) <= 6 ? "上半年" : "下半年");
    }
    if (!periods[label]) { periods[label] = []; order.push(label); }
    periods[label].push(e);
  });
  // 排序：标签倒序
  order.sort((a, b) => b.localeCompare(a, "zh"));
  const newest = index.reduce((a, b) => (a.examDate > b.examDate ? a : b)).examDate;
  return order.map(label => ({
    period: label,
    exams: periods[label].map(e => ({
      id: e.examId,
      title: e.title,
      isLatest: e.examDate === newest,
      totalTime: e.totalTime,
      requiredTier: e.requiredTier,
    })),
  }));
}

// ---------- 真题列表页 ----------
function rxRenderExamList(container) {
  container.innerHTML = '<div class="exam-page"><div class="container" id="rxExamListWrap"><p style="color:var(--text-light);padding:40px 0;text-align:center;">正在加载真题列表…</p></div></div>';
  rxLoadIndex().then(index => {
    const wrap = document.getElementById("rxExamListWrap");
    if (!wrap) return;
    const periods = rxPeriods(index);
    wrap.innerHTML = `
      <div class="exam-header">
        <div class="breadcrumb">
          <a onclick="route('/app')">首页</a> /
          <a onclick="route('/app/course/CET6')">大学英语六级</a> /
          历年真题
        </div>
        <h1>大学英语六级历年真题</h1>
        <p style="color:var(--text-light);font-size:15px;margin-top:8px;">完整收录 2016–2026 年 63 套六级真题，在线练习 · 智能评分 · 逐题解析 · 真题下载</p>
      </div>
      ${periods.map(p => `
        <div class="exam-period">
          <div class="exam-period-title">${p.period}</div>
          <div class="exam-grid">
            ${p.exams.map(exam => `
              <div class="exam-card">
                ${exam.isLatest ? '<div class="latest-tag">最新</div>' : ""}
                <div class="exam-title">${exam.title}</div>
                <div class="exam-actions">
                  <button class="btn btn-primary btn-sm" onclick="route('/practice/${exam.id}')">在线练习</button>
                  <button class="btn btn-outline btn-sm" onclick="rxDownload('${exam.id}')">真题下载</button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `).join("")}
    `;
  }).catch(() => {
    const wrap = document.getElementById("rxExamListWrap");
    if (wrap) wrap.innerHTML = '<p style="color:var(--text-light);padding:40px 0;text-align:center;">真题数据加载失败，请刷新重试。</p>';
  });
}

// ---------- 在线考试页 ----------
function rxRenderExam(container, examId) {
  container.innerHTML = '<div class="practice-page"><div class="container"><p style="color:var(--text-light);padding:40px 0;text-align:center;">正在加载试卷内容…</p></div></div>';
  rxLoadExam(examId).then(exam => {
    if (!exam || !exam.questionGroups) {
      container.innerHTML = '<div class="practice-page"><div class="container"><p style="padding:40px 0;text-align:center;">试卷加载失败。</p></div></div>';
      return;
    }
    RX.exam = exam;
    RX.answers = {};
    RX.blankSel = null;
    RX.sentences = {};
    RX.sentenceSeq = 0;
    rxBuildVocab(exam);
    RX.timeRemaining = (exam.totalTime || 125) * 60;
    state.examMode = true;

    // 听力组排序：section_a/b/c → passageIndex
    const groups = {};
    groups.listening = exam.questionGroups
      .filter(g => g.type === "listening" && (g.questions || []).length > 0)
      .sort((a, b) => {
        const so = { section_a: 0, section_b: 1, section_c: 2 };
        const d = (so[a.sectionId] ?? 9) - (so[b.sectionId] ?? 9);
        return d !== 0 ? d : (a.passageIndex || 0) - (b.passageIndex || 0);
      });
    groups.writing = exam.questionGroups.filter(g => g.type === "writing");
    groups.reading = exam.questionGroups.filter(g => g.type === "reading")
      .sort((a, b) => {
        const so = { cloze: 0, matching: 1, reading_comprehension: 2 };
        return (so[a.subCategory] ?? 9) - (so[b.subCategory] ?? 9);
      });
    groups.translation = exam.questionGroups.filter(g => g.type === "translation");
    RX.groups = groups;

    container.innerHTML = `
      <div class="practice-page">
        <div class="container">
          <div class="practice-header">
            <div class="exam-info">
              <button class="btn btn-outline btn-sm" onclick="if(confirm('确定要退出练习吗？已答内容将不会保存。')) { rxStopTTS(); route('/app/course/CET6/exams'); }">← 退出</button>
              <span class="exam-name">${exam.title}</span>
            </div>
            <div class="timer" id="rxTimer">${exam.totalTime || 125}:00</div>
          </div>
          <div class="practice-tabs" id="rxTabs">
            <div class="practice-tab active" data-section="writing" onclick="rxSwitch('writing')">✍️ 写作</div>
            <div class="practice-tab" data-section="listening" onclick="rxSwitch('listening')">🎧 听力</div>
            <div class="practice-tab" data-section="reading" onclick="rxSwitch('reading')">📖 阅读</div>
            <div class="practice-tab" data-section="translation" onclick="rxSwitch('translation')">🌏 翻译</div>
          </div>
          <div id="rxSection"></div>
          <div class="practice-footer">
            <div id="rxNav"></div>
            <button class="submit-btn" onclick="rxSubmit()">交卷</button>
          </div>
        </div>
      </div>
    `;
    rxStartTimer();
    rxSwitch("writing");
  });
}

function rxStartTimer() {
  if (RX.timer) clearInterval(RX.timer);
  const el = document.getElementById("rxTimer");
  RX.timer = setInterval(() => {
    RX.timeRemaining--;
    if (RX.timeRemaining <= 0) {
      clearInterval(RX.timer);
      rxStopTTS();
      alert("考试时间已到，自动交卷！");
      rxSubmit(true);
      return;
    }
    if (el) {
      const m = Math.floor(RX.timeRemaining / 60), s = RX.timeRemaining % 60;
      el.textContent = `${m}:${String(s).padStart(2, "0")}`;
      el.classList.toggle("danger", RX.timeRemaining < 300);
    }
  }, 1000);
}

// ---------- 各部分渲染 ----------
function rxSwitch(section) {
  rxStopTTS();
  document.querySelectorAll("#rxTabs .practice-tab").forEach(t =>
    t.classList.toggle("active", t.dataset.section === section));
  const content = document.getElementById("rxSection");
  const nav = document.getElementById("rxNav");
  if (section === "writing") rxSectionWriting(content, nav);
  else if (section === "listening") rxSectionListening(content, nav);
  else if (section === "reading") rxSectionReading(content, nav);
  else if (section === "translation") rxSectionTranslation(content, nav);
  window.scrollTo(0, 0);
}

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ---------- 点词查义 ----------

// 用试卷自带词库 + 课程词汇构建本地词典
function rxBuildVocab(exam) {
  RX.vocab = {};
  const add = (w, m) => {
    const k = String(w || "").toLowerCase().replace(/[^a-z\-]/g, "");
    if (k && m) RX.vocab[k] = String(m);
  };
  (exam?.questionGroups || []).forEach(g => {
    (g.wordBank || []).forEach(w => add(w.word, w.meaning));
  });
  // 课程卡片里的词汇也并入词典
  const cards = RX.cards && Object.values(RX.cards);
  (cards || []).forEach(c => {
    const walk = (o) => {
      if (!o || typeof o !== "object") return;
      if (Array.isArray(o)) return o.forEach(walk);
      if (o.en && o.cn) add(o.en, o.cn);
      if (o.word && (o.meaning || o.cn)) add(o.word, o.meaning || o.cn);
      Object.values(o).forEach(walk);
    };
    walk(c);
  });
  return RX.vocab;
}

function rxWordSpan(w) {
  const key = w.toLowerCase().replace(/[^a-z\-]/g, "");
  if (!key) return esc(w);
  return `<span class="rx-word" onclick="rxWordClick('${key}',this,event)">${esc(w)}</span>`;
}

// 英文正文中的每个单词都可点击；句尾另加“句式”按钮
function rxWrapWords(raw) {
  return String(raw ?? "")
    .split(/([A-Za-z][A-Za-z'\-]*)/)
    .map((part, i) => (i % 2 === 1 ? rxWordSpan(part) : esc(part)))
    .join("");
}

// 句尾操作：句式划分 + 整句朗读按钮，并把句子登记到朗读表（供自定义包装场景复用）
function rxSentenceActions(raw) {
  const id = "s" + (++RX.sentenceSeq);
  RX.sentences[id] = String(raw ?? "");
  return `<span class="rx-sentence-actions">
    <button class="rx-sentence-btn" onclick="rxSentenceClick('${id}',this,event)" title="查看句子结构">句式</button>
    <button class="rx-sentence-play" data-sentence-id="${id}" onclick="rxSpeakSentence('${id}',this,event)" title="英音朗读整句">🔊</button>
  </span>`;
}

function rxWrapSentence(raw) {
  return `<span class="rx-sentence">${rxWrapWords(raw)}${rxSentenceActions(raw)}</span>`;
}

function rxWrapSentences(raw) {
  const parts = SYNSentences(raw);
  return parts.filter(Boolean).map(rxWrapSentence).join("");
}

// 短语/选项：只做点词，不挂句式与朗读按钮（避免选项行过于拥挤）
function rxWrapPhrase(raw) {
  return `<span class="rx-sentence">${rxWrapWords(raw)}</span>`;
}

// 仅当文本确实是英文句子时才挂句式与朗读按钮，避免中文正文出现无意义按钮
function rxWrapSentencesEn(raw) {
  const s = String(raw ?? "");
  if ((s.match(/[A-Za-z]/g) || []).length < 8) return rxWrapWords(s);
  return rxWrapSentences(s);
}

function rxWrapPhraseEn(raw) {
  const s = String(raw ?? "");
  if ((s.match(/[A-Za-z]/g) || []).length < 2) return rxWrapWords(s);
  return rxWrapPhrase(s);
}

// 把雅思/四级词表灌入本地词库，点词即可离线显示中文释义与音标
function rxSeedVocab(list) {
  (list || []).forEach(it => {
    if (!it) return;
    const w = String(it.word || "").toLowerCase().replace(/[^a-z\-]/g, "");
    if (!w) return;
    const meaning = it.meaning || it.cn || "";
    if (meaning && !RX.vocab[w]) RX.vocab[w] = meaning;
    if (it.phonetic && !RX.dict[w]) RX.dict[w] = { ph: it.phonetic, pos: "" };
  });
}

// 整段英文（可含换行）：逐句包装，换行保留
function rxWrapParagraph(raw) {
  return String(raw ?? "")
    .split(/\n+/)
    .map(line => (line.trim() ? rxWrapSentencesEn(line) : ""))
    .join("<br>");
}

function rxWordClick(word, el, ev) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  rxShowWordPopup(word, el, RX.vocab[word] || "");
}

function rxShowWordPopup(word, anchor, knownMeaning) {
  rxCloseWordPopup();
  const rect = anchor.getBoundingClientRect();
  const pop = document.createElement("div");
  pop.className = "rx-popup";
  pop.id = "rxWordPopup";
  pop.dataset.word = word;
  pop.innerHTML = `
    <div class="rx-popup-head">
      <strong>${esc(word)}</strong>
      <span class="rx-popup-close" onclick="rxCloseWordPopup(event)">×</span>
    </div>
    <div class="rx-popup-body" id="rxWordBody">
      ${knownMeaning ? `<div class="rx-word-meaning">${esc(knownMeaning)}</div>` : '<span class="rx-popup-loading">查询释义中…</span>'}
      <div class="rx-pronunciation" id="rxPronunciation"><span class="rx-popup-loading">加载发音…</span></div>
    </div>
  `;
  pop.style.top = Math.min(rect.bottom + 8, window.innerHeight - 210) + "px";
  pop.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - 310)) + "px";
  pop.addEventListener("click", e => e.stopPropagation());
  document.body.appendChild(pop);
  RX.wordPopup = pop;
  rxLookupWord(word);
}

function rxCloseWordPopup(ev) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  const el = document.getElementById("rxWordPopup");
  if (el) el.remove();
  RX.wordPopup = null;
}

// 有道真人发音：type=1 英音（ukspeech），type=2 美音（usspeech），跟随当前口音
function rxYoudaoAudio(word) {
  return "https://dict.youdao.com/dictvoice?audio=" + encodeURIComponent(word) +
    "&type=" + (RX.pron.accent === "en-US" ? 2 : 1);
}

// 查询释义 + 音标 + 真人发音：本地词库先出结果，再用有道词典接口补全
function rxLookupWord(word) {
  const local = RX.vocab[word];
  const cached = RX.dict[word];
  rxRenderWordResult(word, local || "", cached ? cached.ph : "");
  rxFetchYoudao(word);
}

// 释义过长时按义项截断，避免弹窗被撑爆
function rxTrimMeaning(s, max) {
  const t = String(s || "");
  if (t.length <= (max || 110)) return t;
  const cut = t.slice(0, max || 110);
  const idx = cut.lastIndexOf("；");
  return (idx > 40 ? cut.slice(0, idx) : cut) + " …";
}

// 有道词典：一次性拿到中文释义、英/美音标，配合真人发音使用
// 接口跨域受限，走本地服务 /api/yd 转发（server.js）
function rxFetchYoudao(word) {
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), 8000) : null;
  fetch("/api/yd?q=" + encodeURIComponent(word), ctrl ? { signal: ctrl.signal } : undefined)
    .then(r => (r.ok ? r.json() : null))
    .then(d => {
      const isGB = RX.pron.accent !== "en-US";
      const ph = d ? ((isGB ? (d.ukphone || d.usphone) : (d.usphone || d.ukphone)) || "") : "";
      const trs = d ? rxTrimMeaning(d.trs, 110) : "";
      if (trs) RX.vocab[word] = trs;
      if (ph) RX.dict[word] = { ph: ph, pos: "" };
      if (!trs && !ph) return rxLookupFallback(word);
      rxRenderWordResult(word, trs || RX.vocab[word] || "", ph || ((RX.dict[word] || {}).ph || ""));
    })
    .catch(() => rxLookupFallback(word))
    .finally(() => { if (timer) clearTimeout(timer); });
}

// 有道不可用时的在线翻译兜底
function rxLookupFallback(word) {
  if (RX.vocab[word]) return;
  try {
    const url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(word) + '&langpair=en|zh-CN';
    fetch(url).then(r => r.json()).then(d => {
      const t = d && d.responseData ? d.responseData.translatedText : '';
      if (t && !/^[A-Za-z\s.,'\-]+$/.test(t)) {
        RX.vocab[word] = t;
        rxRenderWordResult(word, t, ((RX.dict[word] || {}).ph || ""));
      }
    }).catch(() => {});
  } catch (e) { /* 忽略：已有真人发音可用 */ }
}

function rxRenderWordResult(word, meaning, phonetic) {
  // 快速连续查词时，较早的查询结果不能覆盖当前单词。
  if (RX.wordPopup?.dataset.word !== word) return;
  const body = document.getElementById("rxWordBody");
  if (!body) return;
  const safeWord = encodeURIComponent(word);
  body.innerHTML = `
    ${meaning ? `<div class="rx-word-meaning">${esc(meaning)}</div>` : '<span class="rx-popup-loading">查询释义中…</span>'}
    <div class="rx-phonetic-row">
      ${phonetic ? `<span id="rxWordPhonetic">音标 ${esc(phonetic)}</span>` : '<span id="rxWordPhonetic"></span>'}
      <button class="rx-speak-btn" onclick="rxPronounce('${safeWord}',event)">🔊 朗读单词</button>
    </div>
    <audio class="rx-word-audio" controls preload="auto" src="${esc(rxYoudaoAudio(word))}"></audio>
    <div class="rx-popup-src">释义与音标：有道词典；发音：真人原声（${RX_ACCENT_LABEL[RX.pron.accent] || "英音"}），无声时可点“朗读单词”</div>
  `;
}

// 单词朗读：跟随口音与所选音色，语速比整句略慢，保证音节清晰
function rxPronounce(encodedWord, ev) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  const word = decodeURIComponent(encodedWord);
  if (!("speechSynthesis" in window)) return;
  rxStopSpeak();
  const u = new SpeechSynthesisUtterance(word);
  const accent = RX.pron.accent;
  u.lang = accent;
  u.rate = Math.max(0.6, RX.pron.rate - 0.15);
  u.pitch = 1;
  const voice = rxPickVoice(accent, RX.pron.voiceName);
  if (voice) { u.voice = voice; u.lang = voice.lang || accent; }
  RX.pronouncing = u;
  speechSynthesis.speak(u);
}

// ---------- 整句朗读：默认英音，整句成句朗读以保留弱读、连读与爆破 ----------
const RX_ACCENT_LABEL = { "en-GB": "英音", "en-US": "美音" };
// 音质优先级：Google 神经网络音色（网络合成，最自然） > 系统精选真人音色
const RX_VOICE_PREFER = {
  "en-GB": ["Google UK English Female", "Google UK English Male", "Daniel", "Serena", "Kate", "Oliver", "Arthur", "Stephanie", "Ryan", "Sonia", "Libby"],
  "en-US": ["Google US English", "Samantha", "Alex", "Ava", "Allison", "Aria", "Jenny", "Guy"],
};
// 系统自带的“趣味/变声”音色读句子很怪，一律排除
const RX_VOICE_BLOCK = /^(bad news|good news|bahh|bells|boing|bubbles|cellos|jester|junior|organ|superstar|trinoids|whisper|wobble|zarvox|albert|fred|ralph|kathy|eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley)/i;

function rxAllVoices() {
  if (!("speechSynthesis" in window)) return [];
  return speechSynthesis.getVoices() || [];
}

// 只保留能正经朗读的英文音色
function rxUsableVoices() {
  return rxAllVoices().filter(v =>
    /^en/i.test(String(v.lang || "")) && !RX_VOICE_BLOCK.test(String(v.name || "").trim()));
}

function rxPickVoice(accent, name) {
  const voices = rxAllVoices();
  if (!voices.length) return null;
  const want = String(accent || "").toLowerCase();
  const usable = rxUsableVoices();
  const pool = usable.filter(v => String(v.lang || "").toLowerCase().replace("_", "-").startsWith(want));
  const base = pool.length ? pool : usable;
  // 用户手动指定过音色时优先
  if (name) {
    const hit = base.find(v => v.name === name) || voices.find(v => v.name === name);
    if (hit) return hit;
  }
  for (const nm of (RX_VOICE_PREFER[accent] || [])) {
    const hit = base.find(v => String(v.name || "").includes(nm));
    if (hit) return hit;
  }
  return base[0] || voices.find(v => /^en/i.test(String(v.lang || ""))) || null;
}

// 网络音色不可用时的本机兜底音色
function rxFallbackVoice(accent) {
  const want = String(accent || "").toLowerCase();
  const local = rxUsableVoices().filter(v => v.localService !== false);
  const pool = local.filter(v => String(v.lang || "").toLowerCase().replace("_", "-").startsWith(want));
  const prefer = accent === "en-GB" ? ["Daniel", "Serena", "Kate"] : ["Samantha", "Alex", "Ava"];
  for (const nm of prefer) {
    const hit = pool.find(v => String(v.name || "").includes(nm));
    if (hit) return hit;
  }
  return pool[0] || rxPickVoice(accent, "");
}

function rxVoiceSelectHTML() {
  const voices = rxUsableVoices();
  if (!voices.length) return "";
  const cur = RX.pron.voiceName || "";
  return `<select class="rx-voice-select" data-kind="voice" onchange="rxSetVoice(this.value)" title="选择朗读音色，挑一个你听着最地道的">
      <option value="">音色：自动优选</option>${voices.map(v => `<option value="${esc(v.name)}">${esc(v.name)}${v.localService === false ? "（网络）" : ""}</option>`).join("")}
    </select>`;
}

function rxRateSelectHTML() {
  const list = [[0.7, "0.7× 很慢"], [0.8, "0.8× 慢"], [0.9, "0.9×"], [0.95, "0.95× 标准"], [1, "1.0×"], [1.1, "1.1× 快"]];
  return `<select class="rx-voice-select" data-kind="rate" onchange="rxSetSpeechRate(this.value)" title="整句朗读语速">
    ${list.map(([v, l]) => `<option value="${v}"${Math.abs(v - RX.pron.rate) < 0.011 ? " selected" : ""}>${l}</option>`).join("")}
  </select>`;
}

// 音色列表常异步加载，渲染后再同步一次下拉框的选中项
let rxVoiceSyncTimer = null;
function rxScheduleVoiceSync(delay) {
  clearTimeout(rxVoiceSyncTimer);
  rxVoiceSyncTimer = setTimeout(rxSyncVoiceSelects, delay || 120);
}
function rxSyncVoiceSelects() {
  const voices = rxUsableVoices();
  document.querySelectorAll('.rx-voice-select[data-kind="voice"]').forEach(sel => {
    const cur = RX.pron.voiceName || "";
    const html = `<option value="">音色：自动优选</option>` +
      voices.map(v => `<option value="${esc(v.name)}"${v.name === cur ? " selected" : ""}>${esc(v.name)}${v.localService === false ? "（网络）" : ""}</option>`).join("");
    if (sel.innerHTML !== html) sel.innerHTML = html;
  });
  document.querySelectorAll('.rx-voice-select[data-kind="rate"]').forEach(sel => {
    [...sel.options].forEach(o => { o.selected = Math.abs(parseFloat(o.value) - RX.pron.rate) < 0.011; });
  });
}
if (typeof MutationObserver !== "undefined") {
  new MutationObserver(() => rxScheduleVoiceSync(150)).observe(document.body, { childList: true, subtree: true });
}

// 朗读文本规范化：填空读 blank、缩写与符号展开成完整读法，保留标点以维持停顿与语调
function rxSpeechText(raw) {
  return String(raw || "")
    .replace(/_{2,}\s*\d+\s*_{2,}/g, " blank ")
    .replace(/\d+\s*\.?\s*_{2,}/g, " blank ")
    .replace(/\be\.g\./gi, " for example ")
    .replace(/\bi\.e\./gi, " that is ")
    .replace(/\betc\./gi, " etcetera ")
    .replace(/\bvs\./gi, " versus ")
    .replace(/\bMr\./gi, "Mister ")
    .replace(/\bMrs\./gi, "Misses ")
    .replace(/\bDr\./gi, "Doctor ")
    .replace(/\bSt\./gi, "Saint ")
    .replace(/\$\s?([\d,.]+)/g, "$1 dollars")
    .replace(/£\s?([\d,.]+)/g, "$1 pounds")
    .replace(/([\d,.]+)\s?%/g, "$1 percent")
    .replace(/°C/g, " degrees Celsius")
    .replace(/&/g, " and ")
    .replace(/[–—]/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

function rxSpeakSentence(id, el, ev) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  if (!("speechSynthesis" in window)) { showToast("当前浏览器不支持语音朗读"); return; }
  if (RX.pron.speaking === id) { rxStopSpeak(); return; }   // 再点一次停止
  const text = rxSpeechText(RX.sentences[id] || "");
  if (!text) return;
  rxStopSpeak();
  RX.pron.speaking = id;
  if (el) el.classList.add("playing");
  rxUtter(text, el, false);
}

// 实际发声：整句一次性朗读，弱读、连读、爆破由引擎自然产出；
// 网络音色不可用或长时间不出声时，自动换本机音色重读一遍
function rxUtter(text, el, isRetry) {
  const accent = RX.pron.accent;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = accent;
  u.rate = RX.pron.rate;
  u.pitch = 1;
  u.volume = 1;
  const voice = isRetry ? rxFallbackVoice(accent) : rxPickVoice(accent, RX.pron.voiceName);
  if (voice) { u.voice = voice; u.lang = voice.lang || accent; }
  let started = false;
  let watchdog = null;
  // Chrome 朗读长句会中途停顿，定时 resume 兜底
  const keepAlive = setInterval(() => { if (speechSynthesis.speaking) speechSynthesis.resume(); }, 5000);
  const cleanup = () => { clearInterval(keepAlive); if (watchdog) clearTimeout(watchdog); };
  const retryLocal = () => {
    cleanup();
    if (isRetry) { rxStopSpeak(); return; }
    showToast("该音色不可用，已改用本机音色朗读");
    speechSynthesis.cancel();
    rxUtter(text, el, true);
  };
  u.onstart = () => { started = true; };
  u.onend = () => { cleanup(); rxStopSpeak(); };
  u.onerror = () => { if (started) { cleanup(); rxStopSpeak(); } else retryLocal(); };
  watchdog = setTimeout(() => { if (!started) retryLocal(); }, 2500);
  speechSynthesis.speak(u);
}

function rxStopSpeak() {
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  RX.pron.speaking = null;
  document.querySelectorAll(".rx-sentence-play.playing").forEach(b => b.classList.remove("playing"));
  document.querySelectorAll(".rx-word-audio").forEach(a => { if (!a.paused) a.pause(); });
}

function rxSetAccent(accent) {
  RX.pron.accent = accent;
  RX.pron.voice = rxPickVoice(accent, RX.pron.voiceName);
  rxSavePronPrefs();
  document.querySelectorAll(".rx-accent-btn").forEach(b => b.classList.toggle("active", b.dataset.accent === accent));
  rxScheduleVoiceSync(0);
  showToast("整句朗读已切换为" + (RX_ACCENT_LABEL[accent] || accent));
}

function rxSetVoice(name) {
  RX.pron.voiceName = name || "";
  RX.pron.voice = rxPickVoice(RX.pron.accent, RX.pron.voiceName);
  // 手选了具体音色时，口音跟随该音色语言，避免「选美音却按英音标记」
  const lang = String((RX.pron.voice && RX.pron.voice.lang) || "").toLowerCase().replace("_", "-");
  if (lang.startsWith("en-us") || lang.startsWith("en-gb")) {
    RX.pron.accent = lang.startsWith("en-us") ? "en-US" : "en-GB";
    document.querySelectorAll(".rx-accent-btn").forEach(b => b.classList.toggle("active", b.dataset.accent === RX.pron.accent));
  }
  rxSavePronPrefs();
  rxScheduleVoiceSync(0);
  showToast(RX.pron.voiceName ? "已选择音色：" + RX.pron.voiceName : "音色：自动优选");
}

// 注意：不可命名为 rxSetRate —— 听力倍速函数已占用该名（gi, v），会被后面定义覆盖
function rxSetSpeechRate(r) {
  RX.pron.rate = parseFloat(r) || 0.95;
  rxSavePronPrefs();
  rxScheduleVoiceSync(0);
  showToast("整句朗读语速：" + RX.pron.rate + "×");
}

if (typeof speechSynthesis !== "undefined" && speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = () => {
    RX.pron.voice = rxPickVoice(RX.pron.accent, RX.pron.voiceName);
    rxScheduleVoiceSync(0);
  };
}

// 句子结构辅助分析：切分分句、剥离状语、标注主干与从句类型
const RX_WS = "[ \t\n\r]+";
const RX_VERBS = new RegExp("^(am|is|are|was|were|be|been|being|has|have|had|do|does|did|can|could|may|might|must|shall|should|will|would|" +
  "make|makes|made|help|helps|helped|enable|enables|enabled|offer|offers|allow|allows|bring|brings|create|creates|created|" +
  "provide|provides|play|plays|mean|means|show|shows|suggest|suggests|improve|improves|develop|develops|become|becomes|" +
  "remain|remains|seem|seems|appear|appears|go|goes|use|uses|used|work|works|include|includes|require|requires|" +
  "give|gives|take|takes|see|sees|know|knows|find|finds|say|says|think|thinks|believe|believes|look|looks|" +
  "feel|feels|focus|focuses|support|supports|come|comes|get|gets|put|keep|keeps|let|lead|leads|matter|matters|" +
  "depend|depends|prevent|prevents|reduce|reduces|increase|increases|protect|protects|affect|affects|" +
  "consist|consists|result|results|differ|differs|vary|varies|apply|applies|exist|exists|occur|occurs|" +
  "contribute|contributes|depend|depends|refer|refers|belong|belongs|account|accounts|enable|enables)$", "i");
const RX_SUBORD = /^(although|though|because|since|while|when|if|unless|until|till|after|before|as|that|which|who|whom|whose|where|whether|once|even|so|such|no matter|in case|as if|as long|as soon)$/i;
const RX_COORD = /^(and|but|or|yet|so|nor|for)$/i;
const RX_CLAUSE_TYPE = {
  because: "原因状语从句", since: "原因/时间状语从句", as: "时间/原因状语从句", although: "让步状语从句",
  though: "让步状语从句", while: "时间/对比状语从句", when: "时间状语从句", whenever: "时间状语从句",
  if: "条件状语从句", unless: "条件状语从句", until: "时间状语从句", till: "时间状语从句",
  after: "时间状语从句", before: "时间状语从句", once: "时间状语从句",
  that: "宾语/定语从句", which: "定语从句", who: "定语从句", whom: "定语从句", whose: "定语从句",
  where: "地点状语/定语从句", whether: "主语/宾语从句",
  and: "并列分句", but: "转折并列分句", or: "选择并列分句", yet: "转折并列分句", so: "结果并列分句", nor: "并列否定分句",
};
const RX_PREPS = /^(in|on|at|for|with|by|from|to|as|of|about|into|onto|over|under|during|after|before|between|among|through|across|against|within|without|despite|toward|towards|upon|behind|beyond|beside|throughout|according|due|owing|instead|apart|regardless|regarding|concerning)$/i;

function rxSplitWords(text) {
  return String(text || "").trim().split(new RegExp(RX_WS)).filter(Boolean);
}

function rxIsVerb(word) {
  return RX_VERBS.test(String(word || "").replace(/[^A-Za-z]/g, ""));
}

function rxGuessStructure(sentence) {
  const text = String(sentence || "").replace(/[ \t\n\r]+/g, " ").trim();
  if (!text) return { text: "", type: "", clauses: [] };
  // 两级切分：① 逗号后接从句/分句 → 一定是分句边界 ② 空格前的明确引导词
  const AFTER_COMMA = "although|though|because|while|when|if|unless|since|before|after|until|till|once|that|which|who|whom|whose|where|whether|and|but|so|yet|or|nor";
  const INLINE = "although|though|because|while|when|whenever|if|unless|that|which|who|whom|whose|where|whether|and|but|so|yet|or|nor";
  const rough = text.split(new RegExp("," + RX_WS + "(?=(?:" + AFTER_COMMA + ")" + RX_WS + ")", "i"));
  const parts = [];
  rough.forEach(piece => {
    piece.split(new RegExp(RX_WS + "(?=(?:" + INLINE + ")" + RX_WS + ")", "i"))
      .forEach(x => { if (x.trim()) parts.push(x.trim()); });
  });

  const analyze = (part, idx) => {
    let body = part.trim().replace(/^[,;:]+/, "").trim();
    let connector = "";
    const first = rxSplitWords(body)[0] || "";
    const firstClean = first.toLowerCase().replace(/[^a-z]/g, "");
    if (RX_COORD.test(firstClean) || RX_SUBORD.test(firstClean)) {
      connector = firstClean;
      body = body.slice(first.length).trim();
    }
    // 前置状语（逗号前且不含谓语）
    let adverbial = "";
    const commaAt = body.indexOf(",");
    if (commaAt > 0) {
      const head = body.slice(0, commaAt).trim();
      if (!rxSplitWords(head).some(rxIsVerb)) {
        adverbial = head;
        body = body.slice(commaAt + 1).trim();
      }
    }
    const words = rxSplitWords(body);
    // 存在句 there is / there are
    let existential = false;
    if (/^there$/i.test(words[0] || "") && rxIsVerb(words[1])) existential = true;
    const searchFrom = existential ? 1 : 0;
    let vi = -1;
    for (let i = searchFrom; i < words.length; i++) {
      if (rxIsVerb(words[i])) { vi = i; break; }
    }
    if (vi < 0) vi = words.length > 1 ? 1 : 0;
    let subject = words.slice(searchFrom, vi).join(" ");
    let predicate = words.slice(vi, vi + 1).join(" ");
    let object = words.slice(vi + 1).join(" ");
    // 状语从句继续拆出句末状语
    let tail = "";
    const m = object.match(/,\s+(?=(?:in|on|at|for|with|by|from|to|during|after|before|through|among|between|according|despite|instead|regardless)[ \t\n\r])/i);
    if (m && m.index > 0) {
      tail = object.slice(m.index + m[0].length).trim();
      object = object.slice(0, m.index).trim();
    }
    if (existential) subject = subject || "";
    const type = idx === 0 && !connector ? "主句 / 句子主干" : (RX_CLAUSE_TYPE[connector] || "并列分句");
    return { type, connector, adverbial, subject, predicate, object, tail, existential };
  };

  const clauses = parts.map(analyze);
  const hasCoord = clauses.some(c => c.connector && RX_COORD.test(c.connector));
  const hasSub = clauses.some(c => c.connector && RX_SUBORD.test(c.connector));
  // 单分句：标为主干，句首连词仅作衔接说明
  if (clauses.length === 1) {
    const c = clauses[0];
    c.type = c.connector ? `主句 / 句子主干（句首 ${c.connector} 作衔接）` : "主句 / 句子主干";
  }
  const type = clauses.length < 2 ? "简单句" : hasSub && hasCoord ? "并列复合句" : hasSub ? "复合句" : "并列句";
  return { text, type, clauses };
}

function rxClauseHTML(c, i, total) {
  const rows = [];
  if (c.adverbial) rows.push(`<div class="rx-clause-row"><span class="rx-role adverbial">状语</span>${esc(c.adverbial)}</div>`);
  rows.push(`<div class="rx-clause-row">
      <span class="rx-role subject">主语</span>${esc(c.subject || (c.existential ? "（存在句引导词 there）" : "—"))}
      <span class="rx-role predicate">谓语</span>${esc(c.predicate || "—")}
      ${c.object ? `<span class="rx-role object">宾语/表语</span>${esc(c.object)}` : ""}
    </div>`);
  if (c.tail) rows.push(`<div class="rx-clause-row"><span class="rx-role adverbial">状语</span>${esc(c.tail)}</div>`);
  return `<div class="rx-clause">
      <div class="rx-clause-label">${i + 1}. ${esc(c.type)}${c.existential ? "（there be 存在句）" : ""}</div>
      ${rows.join("")}
    </div>`;
}

async function rxSentenceClick(id, el, ev) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  rxCloseStructPopup();
  const sentence = RX.sentences[id] || "";
  const pop = document.createElement("div");
  pop.className = "rx-popup rx-struct-popup";
  pop.id = "rxStructPopup";
  pop.setAttribute("role", "dialog");
  pop.setAttribute("aria-label", "句式分析");
  pop.setAttribute("aria-busy", "true");
  pop.innerHTML = `<div class="rx-popup-head"><strong>句式分析</strong><button type="button" class="rx-popup-close" aria-label="关闭句式分析" onclick="rxCloseStructPopup(event)">×</button></div>
    <div class="syn-v-host"><div class="rx-struct-body">正在加载本地句法分析…</div></div>
    <div class="rx-popup-src">自动句法分析，供辅助理解；歧义关系需结合语境核对。</div>`;
  pop.addEventListener("click", e => e.stopPropagation());
  document.body.appendChild(pop);
  RX.struct = pop;
  let disposeView = () => {};
  let disposeTranslation = () => {};
  if (el.closest('.result-page') && el.closest('[data-ar-text]')) {
    const translation = document.createElement('div');
    translation.className = 'rx-struct-body ar-translation';
    pop.querySelector('.syn-v-host').after(translation);
    disposeTranslation = AnswerReview.mountSentenceTranslation(translation, sentence, el);
  }
  const position = () => {
    const anchor = el.getBoundingClientRect();
    pop.style.left = Math.max(8, Math.min(anchor.left, window.innerWidth - pop.offsetWidth - 8)) + "px";
    pop.style.top = Math.max(8, Math.min(anchor.bottom + 8, window.innerHeight - pop.offsetHeight - 8)) + "px";
  };
  const keydown = e => { if (e.key === "Escape") rxCloseStructPopup(e); };
  const onRoute = () => rxCloseStructPopup();
  const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(position) : null;
  if (observer) observer.observe(pop);
  window.addEventListener("resize", position);
  window.addEventListener("hashchange", onRoute);
  document.addEventListener("keydown", keydown);
  pop._dispose = () => {
    disposeView();
    disposeTranslation();
    if (observer) observer.disconnect();
    window.removeEventListener("resize", position);
    window.removeEventListener("hashchange", onRoute);
    document.removeEventListener("keydown", keydown);
  };
  pop._trigger = el;
  position();
  pop.querySelector(".rx-popup-close").focus({ preventScroll: true });
  try {
    await SYN.load(sentence);
    if (!pop.isConnected || RX.struct !== pop) return;
    const analysis = SYN.parse(sentence);
    const host = pop.querySelector(".syn-v-host");
    if (analysis.unavailable || !analysis.clauses.length) {
      host.innerHTML = `<div class="rx-struct-sentence">${esc(sentence)}</div><div class="rx-struct-body">此句尚无可靠的结构分析，暂不标注主谓或修饰箭头。</div>`;
      if(analysis.warnings?.length)pop.querySelector('.rx-popup-src').textContent=analysis.warnings.join('；');
    } else {
      disposeView = SYNView.mount(host, analysis);
      pop.querySelector(".rx-popup-src").textContent = analysis.source + " · " + (analysis.warnings.length ? analysis.warnings.join("；") : "歧义关系需结合语境核对。");
    }
  } catch (error) {
    if (!pop.isConnected || RX.struct !== pop) return;
    pop.querySelector(".syn-v-host").innerHTML = `<div class="rx-struct-sentence">${esc(sentence)}</div><div class="rx-struct-body">本地句式数据加载失败，请重试。<button type="button" class="rx-speak-btn" id="rxStructRetry">重新加载</button></div>`;
    pop.querySelector("#rxStructRetry").addEventListener("click", e => rxSentenceClick(id, el, e));
  } finally {
    if (pop.isConnected && RX.struct === pop) { pop.setAttribute("aria-busy", "false"); position(); }
  }
}

function rxCloseStructPopup(ev) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  const el = document.getElementById("rxStructPopup");
  if (el) {
    if (el._dispose) el._dispose();
    if (ev && el._trigger && el._trigger.isConnected) el._trigger.focus({ preventScroll: true });
    el.remove();
  }
  RX.struct = null;
}

document.addEventListener("click", () => { rxCloseWordPopup(); rxCloseStructPopup(); });

// 段落译文展开 / 收起
function rxToggleCn(el) {
  const box = el.closest(".rx-cn-wrap")?.querySelector(".rx-para-cn");
  if (!box) return;
  const hidden = box.classList.toggle("rx-cn-hidden");
  el.textContent = hidden ? "译文" : "收起译文";
}

function rxToggleAllCn(btn) {
  const all = document.querySelectorAll("#rxSection .rx-para-cn");
  if (!all.length) return;
  const show = btn.dataset.on !== "1";
  btn.dataset.on = show ? "1" : "0";
  all.forEach(b => b.classList.toggle("rx-cn-hidden", !show));
  document.querySelectorAll("#rxSection .rx-cn-btn").forEach(b => {
    if (b.classList.contains("rx-cn-all")) b.textContent = show ? "收起全部译文" : "显示全部译文";
    else b.textContent = show ? "收起译文" : "译文";
  });
}

// --- 写作 ---
function rxSectionWriting(content, nav) {
  const g = RX.groups.writing[0];
  const c = g.content || {};
  const saved = RX.answers.writing || "";
  content.innerHTML = `
    <div class="question-panel">
      <div class="q-direction">Part I &nbsp;Writing &nbsp;(30 minutes)</div>
      <div class="q-topic" style="line-height:2;">${rxWrapSentences(c.directions)}</div>
      ${c.topic ? `<div style="margin:12px 0;padding:10px 14px;background:var(--accent-light,#eef6ff);border-radius:8px;font-size:14px;">💬 话题：<strong>${rxWrapPhraseEn(c.topic)}</strong></div>` : ""}
      ${rxSectionTools(g)}
      <textarea class="answer-textarea" id="rxWriting" placeholder="在此输入你的作文..." oninput="rxUpdateWordCount()">${esc(saved)}</textarea>
      <div class="word-count" id="rxWordCount"></div>
    </div>
  `;
  rxUpdateWordCount();
  nav.innerHTML = `<span style="font-size:14px;color:var(--text-light);">写作部分 · 建议 30 分钟 · ${c.word_count ? c.word_count.min + "–" + c.word_count.max + " 词" : "至少 150 词"}</span>`;
}

function rxUpdateWordCount() {
  const ta = document.getElementById("rxWriting");
  if (!ta) return;
  RX.answers.writing = ta.value;
  const n = ta.value.trim().split(/\s+/).filter(Boolean).length;
  const min = RX.groups.writing[0].content?.word_count?.min || 150;
  const max = RX.groups.writing[0].content?.word_count?.max || 200;
  const el = document.getElementById("rxWordCount");
  if (el) el.textContent = `词数：${n} / ${min}–${max}` + (n >= min ? " ✓" : "");
}

// --- 听力 ---
const RX_PASSAGE_NAME = { long_conversation: "长对话", passage: "短文", lecture: "讲座/报道" };

function rxSectionListening(content, nav) {
  const groups = RX.groups.listening;
  content.innerHTML = rxInlineTools() + groups.map((g, gi) => `
    <div class="question-panel">
      <div class="q-direction">
        <strong>${esc(g.sectionName || "Listening")} · ${RX_PASSAGE_NAME[g.passageType] || "听力"} ${g.passageIndex || ""}</strong>
      </div>
      ${rxAudioPlayerHTML(g, gi)}
      ${g.questions.map(q => `
        <div class="choice-question">
          ${q.passageTopic ? `<div class="rx-q-topic">📌 ${rxWrapPhraseEn(q.passageTopic)}</div>` : ""}
          <div class="q-text">${q.questionNumber}. ${rxWrapSentences(q.questionText)}</div>
          <div class="choice-options">
            ${(q.options || []).map(o => `
              <div class="choice-option ${RX.answers["L" + q.questionNumber] === o.label ? "selected" : ""}"
                   onclick="rxChoose('L${q.questionNumber}','${o.label}',${q.questionNumber})">
                <span class="option-letter">${o.label}</span>
                <span class="option-text">${rxWrapSentences(o.text)}</span>
              </div>
            `).join("")}
          </div>
        </div>
      `).join("")}
    </div>
  `).join("");
  nav.innerHTML = `<span style="font-size:14px;color:var(--text-light);">听力部分 · 录音只播放一遍 · ${groups.reduce((a, g) => a + g.questions.length, 0)} 题</span>`;
}

function rxTTSPlayerHTML(g, gi) {
  const dur = Math.round((g.transcript || []).reduce((a, t) => Math.max(a, t.end || 0), 0));
  const mm = Math.floor(dur / 60), ss = String(dur % 60).padStart(2, "0");
  return `
    <div class="rx-audio" id="rxAudio${gi}">
      <div class="rx-audio-bar">
        <button class="rx-audio-btn" id="rxPlayBtn${gi}" onclick="rxToggleTTS(${gi})">▶ 播放</button>
        <span class="rx-audio-time" id="rxTime${gi}">${mm}:${ss}</span>
        <span class="rx-audio-hint">🔊 语音由浏览器 TTS 实时合成（仿真录音）</span>
        <button class="btn btn-outline btn-sm" style="margin-left:auto;" onclick="rxToggleTranscript(${gi})">听力原文</button>
      </div>
      <div class="rx-transcript" id="rxScript${gi}" style="display:none;">
        ${(g.transcript || []).map((t, i) => `
          <div class="rx-transcript-line" id="rxLine${gi}_${i}">
            <span class="rx-speaker">${esc(t.speaker || "")}</span>
            <span class="rx-line-text">${rxWrapSentences(t.text)}</span>
            <span class="rx-line-cn">${esc(t.translation || "")}</span>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function rxToggleTranscript(gi) {
  const el = document.getElementById("rxScript" + gi);
  if (el) el.style.display = el.style.display === "none" ? "block" : "none";
}

// ---------- 考试原声播放器（本地 mp3，失败回退 TTS） ----------
function rxAudioPlayerHTML(g, gi) {
  if (g.audioUrl) {
    const src = "data/cet6-audio/" + encodeURIComponent(g.audioUrl);
    return `
    <div class="rx-audio" id="rxAudio${gi}">
      <div class="rx-audio-bar">
        <button class="rx-audio-btn" id="rxPlayBtn${gi}" onclick="rxToggleAudio(${gi})">▶ 播放</button>
        <span class="rx-audio-time" id="rxTime${gi}">--:--</span>
        <div class="rx-audio-progress" id="rxProg${gi}" onclick="rxSeekAudio(${gi}, event)" title="点击进度条跳转">
          <div class="rx-audio-progress-fill" id="rxProgFill${gi}"></div>
        </div>
        <select class="rx-audio-rate" id="rxRate${gi}" onchange="rxSetRate(${gi}, this.value)" title="播放速度">
          <option value="0.75">0.75×</option>
          <option value="1" selected>1×</option>
          <option value="1.25">1.25×</option>
        </select>
        <span class="rx-audio-hint">🎧 考试原声录音</span>
        <button class="btn btn-outline btn-sm" style="margin-left:auto;" onclick="rxToggleTranscript(${gi})">听力原文</button>
      </div>
      <audio id="rxNative${gi}" src="${src}" preload="metadata"
        onloadedmetadata="rxAudioTime(${gi})"
        ontimeupdate="rxAudioTime(${gi})"
        onended="rxAudioState(${gi}, false)"
        onplay="rxAudioState(${gi}, true)"
        onpause="rxAudioState(${gi}, false)"
        onerror="rxAudioFail(${gi})"></audio>
      <div class="rx-transcript" id="rxScript${gi}" style="display:none;">
        ${(g.transcript || []).map((t, i) => `
          <div class="rx-transcript-line" id="rxLine${gi}_${i}">
            <span class="rx-speaker">${esc(t.speaker || "")}</span>
            <span class="rx-line-text">${rxWrapSentences(t.text)}</span>
            <span class="rx-line-cn">${esc(t.translation || "")}</span>
          </div>
        `).join("")}
      </div>
    </div>
  `;
  }
  return rxTTSPlayerHTML(g, gi);
}

function rxToggleAudio(gi) {
  const a = document.getElementById("rxNative" + gi);
  if (!a) return;
  if (a.paused) {
    rxStopTTS(); // 停掉其它组的朗读
    a.play().catch(() => {});
  } else {
    a.pause();
  }
}

function rxAudioState(gi, playing) {
  const btn = document.getElementById("rxPlayBtn" + gi);
  if (btn) btn.textContent = playing ? "⏸ 暂停" : "▶ 播放";
}

function rxAudioTime(gi) {
  const a = document.getElementById("rxNative" + gi);
  const t = document.getElementById("rxTime" + gi);
  const fill = document.getElementById("rxProgFill" + gi);
  if (!a) return;
  const fmt = s => { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  if (t) t.textContent = (a.duration ? fmt(a.currentTime) + " / " + fmt(a.duration) : "--:--");
  if (fill) fill.style.width = (a.duration ? (a.currentTime / a.duration) * 100 : 0) + "%";
}

function rxSeekAudio(gi, e) {
  const a = document.getElementById("rxNative" + gi);
  const bar = document.getElementById("rxProg" + gi);
  if (!a || !bar || !a.duration) return;
  const r = bar.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  a.currentTime = ratio * a.duration;
  rxAudioTime(gi);
}

function rxSetRate(gi, v) {
  const a = document.getElementById("rxNative" + gi);
  if (a) a.playbackRate = parseFloat(v) || 1;
}

function rxAudioFail(gi) {
  const box = document.getElementById("rxAudio" + gi);
  if (!box || box.dataset.fallback) return;
  box.dataset.fallback = "1";
  const g = RX.groups.listening[gi];
  const tmp = document.createElement("div");
  tmp.innerHTML = rxTTSPlayerHTML(g, gi);
  if (tmp.firstElementChild) box.replaceWith(tmp.firstElementChild);
  showToast("原声加载失败，已切换为浏览器朗读");
}


// TTS 播放器：逐句朗读，跟读高亮
function rxToggleTTS(gi) {
  if (RX.tts.playing && RX.tts.group === gi) { rxStopTTS(); return; }
  rxStopTTS();
  const g = RX.groups.listening[gi];
  const lines = g.transcript || [];
  if (!lines.length || !("speechSynthesis" in window)) {
    showToast("当前浏览器不支持语音合成");
    return;
  }
  RX.tts = { playing: true, group: gi, line: 0, stopped: false };
  const btn = document.getElementById("rxPlayBtn" + gi);
  if (btn) btn.textContent = "⏸ 暂停";
  speechSynthesis.cancel();

  function speakLine(i) {
    if (RX.tts.stopped || RX.tts.group !== gi) return;
    if (i >= lines.length) { rxStopTTS(); return; }
    RX.tts.line = i;
    const lineEl = document.getElementById(`rxLine${gi}_${i}`);
    document.querySelectorAll(".rx-transcript-line.active").forEach(e => e.classList.remove("active"));
    if (lineEl) lineEl.classList.add("active");
    const u = new SpeechSynthesisUtterance(lines[i].text);
    const sp = (lines[i].speaker || "").toUpperCase();
    u.pitch = sp === "M" ? 0.8 : sp === "W" ? 1.2 : 1;
    u.rate = 0.9;
    u.lang = "en-US";
    u.onend = () => {
      if (RX.tts.stopped) return;
      setTimeout(() => speakLine(i + 1), 350);
    };
    u.onerror = () => { if (!RX.tts.stopped) setTimeout(() => speakLine(i + 1), 350); };
    speechSynthesis.speak(u);
  }
  speakLine(0);
}

function rxStopTTS() {
  RX.tts.stopped = true;
  RX.tts.playing = false;
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  document.querySelectorAll("audio[id^='rxNative']").forEach(a => { if (a && !a.paused) a.pause(); });
  document.querySelectorAll(".rx-audio-btn").forEach(b => { if (b) b.textContent = "▶ 播放"; });
}

// --- 阅读 ---
function rxSectionReading(content, nav) {
  const groups = RX.groups.reading;
  const secNames = { cloze: "Section A 选词填空", matching: "Section B 段落匹配", reading_comprehension: "Section C 仔细阅读" };
  content.innerHTML = groups.map((g, gi) => {
    const body = g.subCategory === "cloze" ? rxClozeHTML(g)
      : g.subCategory === "matching" ? rxMatchingHTML(g)
      : rxPassageHTML(g);
    return `
      <div class="question-panel">
        <div class="q-direction"><strong>${esc(g.sectionName || secNames[g.subCategory])} · ${secNames[g.subCategory] || ""}</strong><br>${rxWrapSentences(g.directions || "")}</div>
        ${body}
      </div>
    `;
  }).join("");
  const total = groups.reduce((a, g) => a + (g.questions || []).length, 0);
  nav.innerHTML = `<span style="font-size:14px;color:var(--text-light);">阅读部分 · 建议 40 分钟 · ${total} 题</span>`;
}

// Section A：选词填空
function rxClozeHTML(g) {
  const bank = g.wordBank || [];
  const paras = (g.material?.paragraphs || []).map(p => {
    let text = rxWrapSentences(p.text);
    text = text.replace(/__(\d+)__/g, (m, num) => {
      const sel = RX.answers["B" + num];
      const word = sel ? bank.find(w => w.letter === sel)?.word : null;
      return `<span class="rx-blank ${RX.blankSel === Number(num) ? "sel" : ""} ${word ? "filled" : ""}"
                   id="rxBlank${num}" onclick="rxSelectBlank(${num})">${word ? esc(word) : "&nbsp;" + num + "&nbsp;"}</span>`;
    });
    return `<div class="rx-cn-wrap"><p style="margin:0 0 6px;line-height:2.2;font-size:15px;">${text}</p>
      ${p.translation ? `<button class="rx-cn-btn" onclick="rxToggleCn(this)">译文</button>
      <div class="rx-para-cn rx-cn-hidden">${esc(p.translation)}</div>` : ""}</div>`;
  }).join("");
  return `
    <div class="word-bank rx-wordbank">
      ${bank.map(w => `
        <span class="word-bank-item rx-bankword ${Object.keys(RX.answers).some(k => k.startsWith("B") && RX.answers[k] === w.letter) ? "used" : ""}"
              id="rxBank${w.letter}" onclick="rxFillBlank('${w.letter}')">
          <strong>${w.letter}</strong> ${rxWrapPhrase(w.word)}${w.meaning ? `<em class="rx-bankcn">${esc(w.meaning)}</em>` : ""}
        </span>
      `).join("")}
    </div>
    ${rxSectionTools(g)}
    <div style="margin-top:14px;">${paras}</div>
    <p style="font-size:12px;color:var(--text-light);">点击文中空格选中，再点击上方词库中的单词填入；点击英文单词可查看中文释义。</p>
  `;
}

// 口音切换条：可单独使用，也嵌入在 rxSectionTools 里
function rxAccentToolsHTML() {
  const isGB = RX.pron.accent !== "en-US";
  return `<span class="rx-accent-switch">
      <span class="rx-tools-label">整句朗读</span>
      <button class="rx-accent-btn${isGB ? " active" : ""}" data-accent="en-GB" onclick="rxSetAccent('en-GB')">🇬🇧 英音</button>
      <button class="rx-accent-btn${isGB ? "" : " active"}" data-accent="en-US" onclick="rxSetAccent('en-US')">🇺🇸 美音</button>
    </span>`;
}

function rxToolsHint() {
  return "正文、题干和选项均可点词查义 · 点选项字母作答 · 句尾 🔊 朗读 · 句式看结构";
}

// 常驻工具条：供雅思/四级等使用 app.js 渲染器的板块复用
function rxInlineTools() {
  return `<div class="rx-section-tools">${rxAccentToolsHTML()}${rxVoiceSelectHTML()}${rxRateSelectHTML()}<span class="rx-tools-hint">${rxToolsHint()}</span></div>`;
}

// 阅读区工具条：一键展开译文 + 发音口音切换
function rxSectionTools(g) {
  const hasCn = (g.material?.paragraphs || []).some(p => p.translation);
  return `<div class="rx-section-tools">
      ${hasCn ? `<button class="rx-cn-btn rx-cn-all" onclick="rxToggleAllCn(this)">显示全部译文</button>` : ""}
      ${rxAccentToolsHTML()}
      ${rxVoiceSelectHTML()}${rxRateSelectHTML()}
      <span class="rx-tools-hint">${rxToolsHint()}</span>
    </div>`;
}

function rxSelectBlank(num) {
  RX.blankSel = num;
  document.querySelectorAll(".rx-blank").forEach(e => e.classList.remove("sel"));
  const el = document.getElementById("rxBlank" + num);
  if (el) el.classList.add("sel");
}

function rxFillBlank(letter) {
  if (Object.keys(RX.answers).some(k => k.startsWith("B") && RX.answers[k] === letter)) return;
  if (RX.blankSel == null) { showToast("请先点击文中的空格"); return; }
  const num = RX.blankSel;
  RX.answers["B" + num] = letter;
  RX.blankSel = null;
  rxRefreshReading();
}

function rxRefreshReading() {
  const content = document.getElementById("rxSection");
  const nav = document.getElementById("rxNav");
  const scrollY = window.scrollY;
  rxSectionReading(content, nav);
  window.scrollTo(0, scrollY);
}

// Section B：段落匹配
function rxMatchingHTML(g) {
  const paras = (g.material?.paragraphs || []).map(p => `
    <div class="reading-passage rx-matchpara rx-cn-wrap">
      <strong class="rx-para-label">${esc(p.id)}</strong>
      <div style="flex:1;">
        <span>${rxWrapSentences(p.text)}</span>
        ${p.translation ? `<button class="rx-cn-btn" onclick="rxToggleCn(this)">译文</button>
        <div class="rx-para-cn rx-cn-hidden">${esc(p.translation)}</div>` : ""}
      </div>
    </div>
  `).join("");
  const letters = (g.material?.paragraphs || []).map(p => p.id);
  return `
    <h3 style="font-size:17px;margin:16px 0 12px;">${rxWrapPhraseEn(g.title || "")}</h3>
    ${rxSectionTools(g)}
    <div>${paras}</div>
    <div style="margin-top:20px;border-top:1px solid var(--border,#e5e7eb);padding-top:16px;">
      ${(g.questions || []).map(q => `
        <div class="choice-question">
          <div class="q-text">${q.questionNumber}. ${rxWrapSentences(q.statementText)}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${letters.map(L => `
              <div class="choice-option rx-letter-opt ${RX.answers["M" + q.questionNumber] === L ? "selected" : ""}"
                   style="flex:0 0 auto;padding:6px 14px;" onclick="rxChoose('M${q.questionNumber}','${L}',${q.questionNumber})">
                <span class="option-letter">${L}</span>
              </div>
            `).join("")}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

// Section C：仔细阅读
function rxPassageHTML(g) {
  const paras = (g.material?.paragraphs || []).map(p =>
    `<div class="rx-cn-wrap">
      <p style="margin:0 0 6px;line-height:2.1;font-size:15px;">${rxWrapSentences(p.text)}</p>
      ${p.translation ? `<button class="rx-cn-btn" onclick="rxToggleCn(this)">译文</button>
      <div class="rx-para-cn rx-cn-hidden">${esc(p.translation)}</div>` : ""}
    </div>`).join("");
  return `
    <h3 style="font-size:17px;margin:16px 0 12px;">${rxWrapPhraseEn(g.title || g.material?.title || "")}</h3>
    ${rxSectionTools(g)}
    <div>${paras}</div>
    <div style="margin-top:8px;">
      ${(g.questions || []).map(q => `
        <div class="choice-question">
          <div class="q-text">${q.questionNumber}. ${rxWrapSentences(q.questionText)}</div>
          <div class="choice-options">
            ${(q.options || []).map(o => `
              <div class="choice-option ${RX.answers["R" + q.questionNumber] === o.label ? "selected" : ""}"
                   onclick="rxChoose('R${q.questionNumber}','${o.label}',${q.questionNumber})">
                <span class="option-letter">${o.label}</span>
                <span class="option-text">${rxWrapSentences(o.text)}</span>
              </div>
            `).join("")}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

// 选择题作答
function rxChoose(key, label, qn) {
  RX.answers[key] = RX.answers[key] === label ? null : label;
  // 仅刷新该题的选项状态
  document.querySelectorAll(".choice-question").forEach(cq => {
    if (cq.querySelector(".q-text")?.textContent.startsWith(qn + ".")) {
      cq.querySelectorAll(".choice-option").forEach(op => {
        op.classList.toggle("selected", op.querySelector(".option-letter").textContent === RX.answers[key]);
      });
    }
  });
}

// --- 翻译 ---
function rxSectionTranslation(content, nav) {
  const g = RX.groups.translation[0];
  content.innerHTML = `
    <div class="question-panel">
      ${rxInlineTools()}
      <div class="q-direction">Part IV &nbsp;Translation &nbsp;(30 minutes)</div>
      <div class="q-direction" style="margin-top:10px;">${rxWrapSentencesEn(g.directions || "Directions: For this part, you are allowed 30 minutes to translate a passage from Chinese into English.")}</div>
      <div class="reading-passage" style="background:var(--accent-light,#eef6ff);font-size:16px;line-height:2.4;margin-top:12px;">
        ${esc(g.sourceText)}
      </div>
      <textarea class="answer-textarea" id="rxTranslation" placeholder="在此输入你的英文翻译..." style="min-height:240px;" oninput="RX.answers.translation=this.value">${esc(RX.answers.translation || "")}</textarea>
      <div class="word-count" id="rxTransCount"></div>
    </div>
  `;
  rxUpdateTransCount();
  nav.innerHTML = `<span style="font-size:14px;color:var(--text-light);">翻译部分 · 建议 30 分钟</span>`;
}

function rxUpdateTransCount() {
  const ta = document.getElementById("rxTranslation");
  if (!ta) return;
  RX.answers.translation = ta.value;
  const el = document.getElementById("rxTransCount");
  if (el) el.textContent = `词数：${ta.value.trim().split(/\s+/).filter(Boolean).length}`;
}

// ---------- 交卷与评分 ----------
function rxSubmit(auto) {
  if (!auto && !confirm("确定要交卷吗？交卷后将无法修改答案。")) return;
  rxStopTTS();
  if (RX.timer) clearInterval(RX.timer);
  const w = document.getElementById("rxWriting"); if (w) RX.answers.writing = w.value;
  const t = document.getElementById("rxTranslation"); if (t) RX.answers.translation = t.value;

  const exam = RX.exam;
  let listenTotal = 0, listenCorrect = 0, listenWrong = 0, listenUnanswered = 0;
  let readScore = 0, readFull = 0, readCorrect = 0, readWrong = 0, readUnanswered = 0;
  const wrongList = [];
  const allList = [];

  // 听力：每题分值 = 248.5 / 总题数
  RX.groups.listening.forEach(g => g.questions.forEach(q => {
    listenTotal++;
    const a = RX.answers["L" + q.questionNumber];
    allList.push({ q, g, a, part: "听力", section: g.sectionName });
    if (!a) listenUnanswered++;
    else if (a === q.correctAnswer) listenCorrect++;
    else { listenWrong++; wrongList.push({ q, a, part: "听力", section: g.sectionName }); }
  }));
  const listenScore = listenTotal ? (listenCorrect / listenTotal) * 248.5 : 0;

  // 阅读：按每题 score 字段
  RX.groups.reading.forEach(g => (g.questions || []).forEach(q => {
    const key = g.subCategory === "cloze" ? "B" + q.questionNumber : g.subCategory === "matching" ? "M" + q.questionNumber : "R" + q.questionNumber;
    const a = RX.answers[key];
    const sc = q.score || 7.1;
    readFull += sc;
    allList.push({ q, g, a, part: "阅读", section: g.sectionName });
    if (!a) readUnanswered++;
    else if (a === q.correctAnswer) { readCorrect++; readScore += sc; }
    else { readWrong++; wrongList.push({ q, a, part: "阅读", section: g.sectionName }); }
  }));

  const objective = listenScore + readScore;         // 客观题（听力+阅读）满分 497
  const rate = readFull + listenTotal ? (listenCorrect + readCorrect) / (listenTotal + (RX.groups.reading.reduce((a, g) => a + g.questions.length, 0))) : 0;
  const subjective = rate * 213;                       // 作文+翻译按客观正确率估算
  const estimated = objective + subjective;

  const wg = RX.groups.writing[0];
  const tg = RX.groups.translation[0];
  const wAns = (RX.answers.writing || "").trim();
  const tAns = (RX.answers.translation || "").trim();
  const wCount = wAns ? wAns.split(/\s+/).filter(Boolean).length : 0;

  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="practice-page">
      <div class="container">
        <div class="result-page">
          <div style="font-size:15px;color:var(--text-light);margin-bottom:6px;">${esc(exam.title)} · 成绩报告</div>
          <div class="result-score">${Math.round(estimated)}</div>
          <div class="result-label">预估总分 / 710 分（客观题实测 + 主观题按正确率估算）</div>
          <div class="result-detail">
            <div class="result-item"><div class="label">听力</div><div class="value">${Math.round(listenScore)}<span class="rx-sub">/248.5</span></div></div>
            <div class="result-item"><div class="label">阅读</div><div class="value">${readScore.toFixed(1)}<span class="rx-sub">/248.5</span></div></div>
            <div class="result-item"><div class="label">客观题得分</div><div class="value">${(objective).toFixed(1)}<span class="rx-sub">/497</span></div></div>
            <div class="result-item"><div class="label">答对 / 答错 / 未答</div><div class="value">${listenCorrect + readCorrect} / ${listenWrong + readWrong} / ${listenUnanswered + readUnanswered}</div></div>
          </div>

          <div class="question-panel rx-result-panel">
            <h3>✍️ 写作答案详解</h3>
            ${wAns ? `<div class="rx-user-text">你的作文（${wCount} 词）：${esc(wAns)}</div>` : '<p class="rx-empty-answer">本次未作答</p>'}
            ${wg.answer?.modelEssay ? `
            <div class="rx-model">
              <strong>📝 参考范文：${esc(wg.answer.modelEssay.title || "")}</strong>
              <div class="rx-user-text">${esc(wg.answer.modelEssay.content)}</div>
            </div>` : ""}
            ${wg.answer?.structureAnalysis ? `
            <div class="rx-analysis"><strong>🧩 结构分析</strong>
              ${Object.values(wg.answer.structureAnalysis).map(s => `<p>· ${esc(s)}</p>`).join("")}
            </div>` : ""}
            ${wg.answer?.keyVocabulary?.length ? `
            <div class="rx-analysis"><strong>🔑 核心表达</strong>
              <p>${wg.answer.keyVocabulary.map(kv => `<span class="rx-chip">${esc(kv.en)}</span><span class="rx-chip-cn">${esc(kv.cn)}</span>`).join(" ")}</p>
            </div>` : ""}
          </div>

          <div class="question-panel rx-result-panel">
            <h3>🌏 翻译答案详解</h3>
            ${tAns ? `<div class="rx-user-text">你的翻译：${esc(tAns)}</div>` : '<p class="rx-empty-answer">本次未作答</p>'}
            ${tg.answer?.modelTranslation ? `
            <div class="rx-model">
              <strong>📌 参考译文</strong>
              <div class="rx-user-text">${esc(tg.answer.modelTranslation)}</div>
            </div>` : ""}
          </div>

          <div class="question-panel rx-result-panel">
            <h3>🔎 全部题目答案与详解</h3>
            <p class="rx-report-tip">共 ${allList.length} 道客观题。绿色表示答对，红色表示答错，点击英文单词可查看释义。</p>
            ${rxAllListHTML(allList)}
          </div>

          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="route('/app/course/CET6/exams')">返回真题列表</button>
            <button class="btn btn-outline" onclick="route('/practice/${exam.examId}')">再做一遍</button>
            <button class="btn btn-outline" onclick="rxDownload('${exam.examId}')">下载本套真题</button>
          </div>
        </div>
      </div>
    </div>
  `;
  state.examMode = false;
}

// 全部题目答案与详解（含筛选）
function rxAllListHTML(list) {
  if (!list.length) return '<p style="color:var(--text-light);">本卷暂无客观题。</p>';
  AnswerReview.reset();
  const items = list.map(it => rxAnswerItemHTML(it)).join("");
  return `
    <div class="rx-filter-bar">
      <button class="rx-filter-btn active" data-filter="all" onclick="rxFilterDetail(this)">全部</button>
      <button class="rx-filter-btn" data-filter="wrong" onclick="rxFilterDetail(this)">只看错题</button>
      <button class="rx-filter-btn" data-filter="todo" onclick="rxFilterDetail(this)">只看未答</button>
      <button class="rx-filter-btn" data-filter="right" onclick="rxFilterDetail(this)">只看答对</button>
    </div>
    <div class="rx-detail-list">${items}</div>
  `;
}

function rxAnswerItemHTML(it) {
  const q = it.q;
  const correctWord = q.correctWord || (it.g?.wordBank || []).find(w => w.letter === q.correctAnswer)?.word || '';
  const chosenWord = (it.g?.wordBank || []).find(w => w.letter === it.a)?.word || '';
  const status = !it.a ? "todo" : String(it.a) === String(q.correctAnswer) ? "right" : "wrong";
  const badge = status === "right"
    ? '<span class="rx-badge right">答对</span>'
    : status === "wrong" ? '<span class="rx-badge wrong">答错</span>' : '<span class="rx-badge todo">未答</span>';
  const stem = q.statementText || q.questionText;
  const opts = (q.options || []).length ? `<div class="rx-opt-review">${q.options.map(o => {
    const isC = String(o.label) === String(q.correctAnswer);
    const isMine = it.a && String(o.label) === String(it.a);
    return `<div class="rx-opt-line${isC ? " correct" : ""}${isMine && !isC ? " mine" : ""}">
      <strong>${esc(o.label)}.</strong> ${AnswerReview.textHTML(o.text, it, o.translation || '', rxWrapWords(o.text))}
      ${isC ? '<span class="rx-tag rx-tag-correct">正确答案</span>' : ""}
      ${isMine && !isC ? '<span class="rx-tag rx-tag-mine">你的选择</span>' : ""}
    </div>`;
  }).join("")}</div>` : "";
  return `
    <div class="rx-wrong-item" data-status="${status}" data-part="${esc(it.part)}">
      <div class="rx-wrong-head">
        ${badge}<span class="rx-qno">${esc(it.part)} · 第 ${q.questionNumber} 题</span>
        · 正确答案 <strong class="rx-correct">${esc(q.correctAnswer)}</strong>${correctWord && correctWord !== q.correctAnswer ? `（${rxWrapPhraseEn(correctWord)}）` : ""}
        ${it.a ? ` · 你的答案 <strong class="${status === "right" ? "rx-correct" : "rx-mine-wrong"}">${esc(it.a)}</strong>${chosenWord && chosenWord !== it.a ? `（${rxWrapPhraseEn(chosenWord)}）` : ""}` : ""}
      </div>
      ${stem ? `<div class="rx-wrong-stem">${AnswerReview.textHTML(stem, it, q.translation || '')}</div>` : ""}
      ${opts}
      ${q.keySentence ? `<div class="rx-keysent">关键句：${AnswerReview.textHTML(q.keySentence, it)}</div>` : ""}
      <div class="rx-wrong-analysis">${esc(q.analysis || "暂无解析")}</div>
      ${AnswerReview.render(it)}
    </div>
  `;
}

// 选词填空题：把所选字母还原成单词
function rxWordOfCloze(q) {
  const g = (RX.groups.reading || []).find(x => x.subCategory === "cloze");
  const letter = RX.answers["B" + q.questionNumber];
  const w = (g?.wordBank || []).find(x => x.letter === letter);
  return w ? w.word : "";
}

function rxFilterDetail(btn) {
  const f = btn.dataset.filter || "all";
  document.querySelectorAll(".rx-filter-btn").forEach(b => b.classList.toggle("active", b === btn));
  let shown = 0;
  document.querySelectorAll(".rx-detail-list .rx-wrong-item").forEach(it => {
    const s = it.dataset.status;
    const show = f === "all" || s === f;
    it.style.display = show ? "" : "none";
    if (show) shown++;
  });
  const tip = document.querySelector(".rx-report-tip");
  if (tip) tip.dataset.shown = shown;
}

// ---------- 真题下载（打印视图） ----------
function rxDownload(examId) {
  rxLoadExam(examId).then(exam => {
    const win = window.open("", "_blank");
    if (!win) { showToast("请允许弹出窗口以下载真题"); return; }
    const groups = exam.questionGroups;
    const parts = [];

    // 写作
    const w = groups.find(g => g.type === "writing");
    if (w) parts.push(`
      <h2>Part I Writing (30 minutes)</h2>
      <p class="dir">${esc(w.content?.directions || "")}</p>`);

    // 听力
    parts.push(`<h2>Part II Listening Comprehension (30 minutes)</h2>
      <p class="dir">Section A/B/CDirections: 略。听力音频请在网站在线练习中播放。</p>`);
    groups.filter(g => g.type === "listening" && (g.questions || []).length).forEach(g => {
      parts.push(`<h3>${esc(g.sectionName || "")} · ${RX_PASSAGE_NAME[g.passageType] || ""} ${g.passageIndex || ""}</h3>`);
      parts.push(g.questions.map(q => `
        <p class="q">${q.questionNumber}. ${esc(q.questionText)}</p>
        ${(q.options || []).map(o => `<p class="opt">${o.label}) ${esc(o.text)}</p>`).join("")}`).join(""));
    });

    // 阅读
    parts.push(`<h2>Part III Reading Comprehension (40 minutes)</h2>`);
    groups.filter(g => g.type === "reading").forEach(g => {
      parts.push(`<h3>${esc(g.sectionName || "")}</h3><p class="dir">${esc(g.directions || "")}</p>`);
      if (g.subCategory === "cloze") {
        parts.push(`<p class="bank"><strong>Word Bank:</strong> ${(g.wordBank || []).map(w2 => `${w2.letter}) ${esc(w2.word)}`).join("  ")}</p>`);
        parts.push((g.material?.paragraphs || []).map(p => `<p>${esc(p.text)}</p>`).join(""));
      } else if (g.subCategory === "matching") {
        parts.push(`<h4>${esc(g.title || "")}</h4>`);
        parts.push((g.material?.paragraphs || []).map(p => `<p><strong>${esc(p.id)}</strong> ${esc(p.text)}</p>`).join(""));
        parts.push((g.questions || []).map(q => `<p class="q">${q.questionNumber}. ${esc(q.statementText)}</p>`).join(""));
      } else {
        parts.push(`<h4>${esc(g.title || "")}</h4>`);
        parts.push((g.material?.paragraphs || []).map(p => `<p>${esc(p.text)}</p>`).join(""));
        parts.push((g.questions || []).map(q => `
          <p class="q">${q.questionNumber}. ${esc(q.questionText)}</p>
          ${(q.options || []).map(o => `<p class="opt">${o.label}) ${esc(o.text)}</p>`).join("")}`).join(""));
      }
    });

    // 翻译
    const tr = groups.find(g => g.type === "translation");
    if (tr) parts.push(`<h2>Part IV Translation (30 minutes)</h2><p class="cn">${esc(tr.sourceText)}</p>`);

    // 答案速查
    parts.push(`<h2>参考答案（速查）</h2><p class="ans">${groups.filter(g => g.type === "listening").flatMap(g => g.questions || []).map(q => q.questionNumber + "." + q.correctAnswer).join(" &nbsp; ")}</p>`);
    groups.filter(g => g.type === "reading").forEach(g => {
      parts.push(`<p class="ans">${esc(g.sectionName || "Reading")}：${(g.questions || []).map(q => q.questionNumber + "." + q.correctAnswer).join(" &nbsp; ")}</p>`);
    });

    win.document.write(`<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>${esc(exam.title)}</title>
      <style>
        body{font-family:"Times New Roman",Georgia,serif;max-width:800px;margin:0 auto;padding:40px 30px;line-height:1.8;color:#111;}
        h1{font-size:20px;text-align:center;} .sub{text-align:center;color:#555;font-size:13px;margin-bottom:30px;}
        h2{font-size:16px;border-bottom:2px solid #111;padding-bottom:4px;margin-top:28px;}
        h3{font-size:14px;margin-top:18px;} h4{font-size:13.5px;margin-top:14px;}
        .dir{font-size:13px;color:#444;font-style:italic;}
        .q{margin:10px 0 2px;} .opt{margin:2px 0 2px 24px;font-size:14px;}
        .bank{background:#f4f6f8;padding:8px 12px;font-size:13px;}
        .cn{font-size:16px;line-height:2.2;background:#f8f8f4;padding:12px 16px;}
        .ans{font-size:13px;letter-spacing:1px;}
        .hint{position:fixed;bottom:16px;right:16px;background:#111;color:#fff;padding:8px 14px;border-radius:6px;font-size:12px;font-family:sans-serif;}
        @media print{.hint{display:none;}}
      </style></head><body>
      <h1>${esc(exam.title)}</h1>
      <p class="sub">六级全真试题 · 总时长 ${exam.totalTime} 分钟 · 满分 ${exam.totalScore} 分 · 过级鸭</p>
      ${parts.join("\n")}
      <div class="hint">按 Ctrl/Cmd + P 保存为 PDF</div>
      </body></html>`);
    win.document.close();
  });
}

// ---------- 六级真实课程 ----------
function rxRenderCourseList(container) {
  container.innerHTML = '<div class="course-list-page"><div class="container" id="rxCourseWrap"><p style="color:var(--text-light);padding:40px 0;text-align:center;">正在加载课程…</p></div></div>';
  rxLoadCourses().then(() => {
    const wrap = document.getElementById("rxCourseWrap");
    if (!wrap) return;
    const courses = RX.courses;
    const MODULES = { strategy: "考场策略", listening: "听力专项", reading: "阅读专项", writing: "写作专项", translation: "翻译专项", grammar: "词汇语法" };
    wrap.innerHTML = `
      <div class="breadcrumb" style="font-size:14px;color:var(--text-light);margin-bottom:16px;">
        <a onclick="route('/app')" style="color:var(--primary)">首页</a> / CET6 / 课程
      </div>
      <h1>六级备考课程</h1>
      <p class="subtitle">来自过级鸭官方课程库：${courses.reduce((a, c) => a + c.lessons.length, 0)} 节课 · ${Object.keys(RX.cards).length} 张知识卡片，逐课精讲。</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;margin-top:28px;">
        ${courses.map((c, i) => `
          <div class="course-card" onclick="route('/app/course/CET6/course-detail?id=${encodeURIComponent(c.course.id)}')">
            <div class="icon">${["🗺️", "🎧", "📖", "✍️", "🌏", "🔤"][i % 6]}</div>
            <div class="title">${esc(c.course.title)}</div>
            <div class="desc">${esc(c.course.description)}</div>
            <div class="meta">${c.lessons.length} 节课 · ${MODULES[c.course.module] || "综合"}</div>
          </div>
        `).join("")}
      </div>
    `;
  });
}

function rxRenderCourseDetail(container) {
  const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
  const courseId = params.get("id");
  container.innerHTML = '<div class="course-detail-page"><div class="container" id="rxCourseDetailWrap"><p style="color:var(--text-light);padding:40px 0;text-align:center;">正在加载课程…</p></div></div>';
  rxLoadCourses().then(() => {
    const wrap = document.getElementById("rxCourseDetailWrap");
    if (!wrap) return;
    const c = RX.courses.find(x => x.course.id === courseId);
    if (!c) { wrap.innerHTML = "<p>课程不存在。</p>"; return; }
    wrap.innerHTML = `
      <div class="course-detail-header">
        <div class="breadcrumb" style="font-size:14px;color:var(--text-light);margin-bottom:14px;">
          <a onclick="route('/app')" style="color:var(--primary)">首页</a> /
          <a onclick="route('/app/course/CET6/course-list')" style="color:var(--primary)">课程</a> /
          ${esc(c.course.title)}
        </div>
        <h1>${esc(c.course.title)}</h1>
        <p class="subtitle">${esc(c.course.description)}</p>
      </div>
      <div class="lesson-list">
        ${c.lessons.map((l, i) => `
          <div class="lesson-item" onclick="rxOpenLesson('${esc(l.id)}', this)">
            <div class="lesson-num">${i + 1}</div>
            <div class="lesson-body">
              <div class="lesson-title">${esc(l.title)}</div>
              <div class="lesson-summary">${esc(l.summary || "")}</div>
              <div class="lesson-meta">${(l.cards || []).length} 张知识卡片 · 约 ${(l.cards || []).reduce((a, cd) => a + ((RX.cards[cd.cardId]?.content?.pages || []).reduce((s, p) => s + (p.config?.durationHint || 1), 0)), 0)} 分钟</div>
            </div>
            <div class="lesson-arrow">›</div>
          </div>
        `).join("")}
      </div>
      <div id="rxLessonContent"></div>
    `;
  });
}

function rxOpenLesson(lessonId, el) {
  const c = RX.courses.find(x => x.lessons.some(l => l.id === lessonId));
  const lesson = c.lessons.find(l => l.id === lessonId);
  const cards = (lesson.cards || []).map(cd => RX.cards[cd.cardId]).filter(Boolean);
  const wrap = document.getElementById("rxLessonContent");
  document.querySelectorAll(".lesson-item").forEach(e => e.classList.remove("active"));
  if (el) el.classList.add("active");

  wrap.innerHTML = `
    <div class="rx-lesson-panel">
      <div class="rx-lesson-head">
        <h2>${esc(lesson.title)}</h2>
        <button class="btn btn-outline btn-sm" onclick="document.getElementById('rxLessonContent').innerHTML=''">收起</button>
      </div>
      ${cards.map((card, ci) => `
        <div class="rx-card">
          <div class="rx-card-title">${ci + 1}. ${esc(card.title)} <span class="rx-card-kp">${esc(card.knowledgePoint || "")}</span></div>
          ${card.content?.meta?.objectives?.length ? `<div class="rx-objectives">🎯 ${card.content.meta.objectives.map(o => esc(o)).join(" · ")}</div>` : ""}
          ${(card.content?.pages || []).map((p, pi) => rxRenderCardPage(p, ci + "_" + pi)).join("")}
        </div>
      `).join("")}
    </div>
  `;
  wrap.scrollIntoView({ behavior: "smooth", block: "start" });
}

function rxRenderCardPage(p, uid) {
  const c = p.config || {};
  switch (p.pageType) {
    case "hook":
      return `<div class="rx-page hook"><p class="rx-hook-text">${esc(c.text)}</p>${c.stat ? `<div class="rx-stat"><span class="num">${esc(String(c.stat.value))}</span><span class="label">${esc(c.stat.label || "")}</span></div>` : ""}</div>`;
    case "rule":
      return `<div class="rx-page rule"><div class="rx-rule">${esc(c.rule)}</div>${c.formula ? `<div class="rx-formula">${esc(c.formula)}</div>` : ""}${c.bullets ? `<ul>${c.bullets.map(b => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}</div>`;
    case "text":
    case "summary":
      return `<div class="rx-page text">${c.title ? `<h4>${esc(c.title)}</h4>` : ""}${c.markdown ? `<div class="rx-md">${esc(c.markdown).replace(/\n/g, "<br>")}</div>` : ""}<p>${esc(c.text || "")}</p>${c.takeaway ? `<div class="rx-takeaway">💡 ${esc(c.takeaway)}</div>` : ""}</div>`;
    case "example":
      return `<div class="rx-page example">${c.title ? `<h4>${esc(c.title)}</h4>` : ""}${(c.examples || []).map(e => `<div class="rx-example-item">${esc(typeof e === "string" ? e : e.text || JSON.stringify(e))}</div>`).join("")}</div>`;
    case "choice": {
      const opts = c.options || [];
      RX.quiz = RX.quiz || {};
      RX.quiz[uid] = { correct: [].concat(c.correct || []).map(String), ids: opts.map(o => String(o.id ?? "")) };
      return `<div class="rx-page quiz">
        ${c.title ? `<h4>${esc(c.title)}</h4>` : ""}
        <div class="rx-quiz-stem">${rxWrapPhraseEn(c.stem || "")}</div>
        ${opts.map((o, i) => `<div class="rx-quiz-opt" onclick="rxQuizPick(this,'${uid}',${i})"><strong>${esc(o.id || String.fromCharCode(65 + i))}.</strong> ${rxWrapPhraseEn(o.text)}</div>`).join("")}
        ${c.explanation ? `<div class="rx-quiz-expl">💡 ${esc(c.explanation)}</div>` : ""}
      </div>`;
    }
    case "fillBlank": {
      RX.quiz = RX.quiz || {};
      RX.quiz["fb_" + uid] = (c.blanks || []).map(b => (typeof b === "string" ? b : (b.answer ?? ""))).join(" / ");
      return `<div class="rx-page quiz"><div class="rx-quiz-stem">${rxWrapPhraseEn(c.stem || "")}</div>
        <div class="rx-fill-answer">答案：<span class="rx-fill-ans" onclick="this.textContent=RX.quiz['fb_${uid}']">点击查看</span></div>
        ${c.explanation ? `<div class="rx-quiz-expl">💡 ${esc(c.explanation)}</div>` : ""}</div>`;
    }
    case "table":
      return `<div class="rx-page text"><pre class="rx-table">${esc(typeof c.markdown === "string" ? c.markdown : JSON.stringify(c, null, 1))}</pre></div>`;
    case "audio":
      return `<div class="rx-page text"><p>🔊 ${esc(c.text || c.title || "音频讲解（请到官网收听）")}</p>${c.transcript ? `<div class="rx-md">${esc(c.transcript).replace(/\n/g, "<br>")}</div>` : ""}</div>`;
    default:
      return `<div class="rx-page text"><p>${esc(c.text || c.title || c.takeaway || JSON.stringify(c).slice(0, 200))}</p></div>`;
  }
}

function rxQuizPick(el, uid, idx) {
  const box = el.parentElement;
  const meta = RX.quiz?.[uid];
  if (!meta) return;
  const myId = meta.ids[idx];
  const isRight = meta.correct.includes(myId);
  box.querySelectorAll(".rx-quiz-opt").forEach(o => o.classList.remove("selected", "right", "wrong"));
  el.classList.add("selected", isRight ? "right" : "wrong");
  if (!isRight) {
    const rightIdx = meta.ids.findIndex(id => meta.correct.includes(id));
    if (rightIdx >= 0) box.querySelectorAll(".rx-quiz-opt")[rightIdx]?.classList.add("right");
  }
}
