/* ============================================================
   sketch.js —— 做题涂鸦标注层
   手写（画笔 / 荧光笔）、橡皮擦、打字便签、撤销、清除
   标注按「试卷 + 板块」存 localStorage，随时可改
   ============================================================ */

const SK = {
  on: false,          // 涂鸦层是否开启
  tool: "pen",        // pen | marker | eraser | text
  color: "#ef4444",
  width: 3,
  rough: true,        // 手绘感：随手涂鸦的笔触（速度变宽 + 微抖动），关掉则是平滑等宽
  strokes: [],        // 笔迹：{t, c, w, pts:[[x,y,dt],...]}
  cur: null,          // 正在绘制的笔迹（含运行时宽度缓存 _W）
  notes: [],          // 文字便签：{id, x, y, c, text}
  key: "",            // 当前存储键
  canvas: null,
  ctx: null,
  baseCanvas: null,   // 已完成笔迹的屏幕缓存，不随每个采样点重画
  baseCtx: null,
  frame: 0,
  dirty: true,
  pointerId: null,
  saveTimer: null,
  layer: null,
  notesBox: null,
  drag: null,         // 正在拖动的便签
  hover: -1,          // 橡皮擦悬停命中的笔迹下标（高亮预告要擦掉哪一条）
  erasing: false,     // 橡皮擦正在拖拽连擦
  trash: [],          // 被整笔擦掉的笔迹，撤销时可原样恢复
};

try {
  const r = localStorage.getItem("skRough");
  if (r !== null) SK.rough = r === "1";
} catch (e) {}

const SK_COLORS = [
  ["#ef4444", "红"], ["#2563eb", "蓝"], ["#16a34a", "绿"],
  ["#f59e0b", "橙"], ["#7c3aed", "紫"], ["#1e293b", "黑"],
];

/* ---------- 存储键：试卷 + 板块 ----------
   试卷 ID 可能异步就绪，初始化时取不到就从路由 hash 兜底，
   否则不同试卷的标注会串到同一个默认键上。 */
function skExamId() {
  let exam = "";
  try {
    if (typeof RX !== "undefined" && RX.exam && RX.exam.id) exam = RX.exam.id;
    else if (typeof state !== "undefined" && state.currentExam) exam = state.currentExam;
  } catch (e) { exam = ""; }
  if (!exam) {
    const h = String(location.hash || "");
    const m = h.match(/#\/practice\/([^/?#]+)/);   // #/practice/cet6_2016_06_1
    if (m) exam = decodeURIComponent(m[1]);
  }
  return exam || "none";
}

function skKey() {
  return "sketch_" + skExamId() + "_" + skSection();
}

// 板块：CET6 的 rxSwitch 只切 DOM class，不写状态字段，
// 因此统一以「当前激活的 tab」为准，最贴近用户实际看到的那一屏。
function skSection() {
  let sec = "";
  try {
    const active = document.querySelector(
      "#rxTabs .practice-tab.active, #practiceTabs .practice-tab.active, .practice-tab.active");
    if (active && active.dataset && active.dataset.section) sec = active.dataset.section;
    if (!sec && typeof state !== "undefined" && state.currentSection !== undefined && state.currentSection !== null) {
      sec = state.currentSection;
    }
  } catch (e) { sec = ""; }
  return sec === "" ? "0" : sec;
}

function skSaveSoon() {
  clearTimeout(SK.saveTimer);
  SK.saveTimer = setTimeout(() => {
    if (SK.cur || SK.erasing) skSaveSoon();
    else skSave();
  }, 200);
}

function skSave() {
  clearTimeout(SK.saveTimer);
  SK.saveTimer = null;
  if (!SK.key) SK.key = skKey();
  try {
    // 只存几何数据，运行时的宽度缓存/绘制进度不落盘，省一半体积
    const s = SK.strokes.map(st => ({ t: st.t, c: st.c, w: st.w, r: st.r, pts: st.pts }));
    localStorage.setItem(SK.key, JSON.stringify({ s, n: SK.notes }));
    return true;
  } catch (e) {
    if (typeof showToast === "function") showToast("标注太多，已超出本地存储容量");
    return false;
  }
}

function skLoad() {
  SK.key = skKey();
  try {
    const raw = localStorage.getItem(SK.key);
    const d = raw ? JSON.parse(raw) : null;
    SK.strokes = (d && Array.isArray(d.s)) ? d.s : [];
    SK.notes = (d && Array.isArray(d.n)) ? d.n : [];
  } catch (e) {
    SK.strokes = [];
    SK.notes = [];
  }
}

/* ---------- 层与画布 ---------- */
function skEnsure() {
  if (SK.layer) return SK.layer;
  const layer = document.createElement("div");
  layer.id = "skLayer";
  layer.className = "sk-layer";

  const cv = document.createElement("canvas");
  cv.id = "skCanvas";
  cv.style.position = "fixed"; // 笔迹仍存文档坐标，画布只分配一屏像素
  layer.appendChild(cv);

  const box = document.createElement("div");
  box.id = "skNotes";
  box.className = "sk-notes";
  layer.appendChild(box);

  document.body.appendChild(layer);
  SK.layer = layer;
  SK.canvas = cv;
  SK.notesBox = box;
  SK.ctx = cv.getContext("2d");
  SK.baseCanvas = document.createElement("canvas");
  SK.baseCtx = SK.baseCanvas.getContext("2d");

  skBindCanvas(cv);
  return layer;
}

// 只按视口分配像素，长试卷不再生成数万像素高的画布。
// 通过平移文档坐标重绘，滚动后标注仍跟随原文，也兼容已保存的笔迹。
function skResize() {
  if (!SK.canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth, h = window.innerHeight;
  const cv = SK.canvas;
  if (cv.dataset.w === String(w) && cv.dataset.h === String(h) && cv.dataset.dpr === String(dpr)) return;
  cv.dataset.w = String(w); cv.dataset.h = String(h); cv.dataset.dpr = String(dpr);
  cv.style.width = w + "px";
  cv.style.height = h + "px";
  for (const canvas of [cv, SK.baseCanvas]) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  skRedraw();
}

function skRequestFrame() {
  if (SK.frame) return;
  SK.frame = requestAnimationFrame(() => {
    SK.frame = 0;
    skPaint();
  });
}

function skRedraw() {
  SK.dirty = true;
  skRequestFrame();
}

function skBounds(st) {
  if (!st._bounds) {
    const b = [Infinity, Infinity, -Infinity, -Infinity];
    for (const p of st.pts) {
      b[0] = Math.min(b[0], p[0]); b[1] = Math.min(b[1], p[1]);
      b[2] = Math.max(b[2], p[0]); b[3] = Math.max(b[3], p[1]);
    }
    st._bounds = b;
  }
  return st._bounds;
}

function skVisible(st, x, y, w, h) {
  const b = skBounds(st), pad = skBaseW(st) * 2 + 12;
  return b[2] + pad >= x && b[0] - pad <= x + w && b[3] + pad >= y && b[1] - pad <= y + h;
}

function skPaint() {
  const ctx = SK.ctx, cv = SK.canvas;
  if (!ctx || !cv) return;
  const dpr = Number(cv.dataset.dpr) || 1;
  const x = window.scrollX, y = window.scrollY;
  const w = Number(cv.dataset.w), h = Number(cv.dataset.h);
  if (SK.viewX !== x || SK.viewY !== y) SK.dirty = true;
  SK.viewX = x; SK.viewY = y;
  if (SK.dirty) {
    const base = SK.baseCtx;
    base.setTransform(1, 0, 0, 1, 0, 0);
    base.clearRect(0, 0, cv.width, cv.height);
    base.setTransform(dpr, 0, 0, dpr, -x * dpr, -y * dpr);
    for (const st of SK.strokes) {
      if (st !== SK.cur && skVisible(st, x, y, w, h)) skDrawStroke(base, st);
    }
    SK.dirty = false;
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.drawImage(SK.baseCanvas, 0, 0);
  ctx.setTransform(dpr, 0, 0, dpr, -x * dpr, -y * dpr);
  // 每帧只重画当前一笔，既能跟到笔尖，也避免荧光笔增量叠色。
  if (SK.cur) skDrawStroke(ctx, SK.cur);
  if (SK.hover >= 0 && SK.strokes[SK.hover]) skHighlight(ctx, SK.strokes[SK.hover]);
}

// 悬停预览：沿笔迹描一条半透明粗线（只做提示，不改动画布内容）
function skHighlight(ctx, st) {
  const p = st.pts;
  if (!p || !p.length) return;
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(239,68,68,.42)";
  ctx.fillStyle = "rgba(239,68,68,.42)";
  ctx.lineWidth = Math.max(st.w + 7, 12);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(p[0][0], p[0][1]);
  for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
  ctx.stroke();
  ctx.restore();
}

/* ---------- 橡皮擦：按笔画整条擦除 ---------- */
function skSegDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0;
  t = t < 0 ? 0 : (t > 1 ? 1 : t);
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// 点到某条笔迹的距离是否够近（容差随笔宽放大，粗笔更好点中）
function skHitStroke(st, x, y) {
  const p = st.pts, n = p.length;
  if (!n || !skVisible(st, x, y, 0, 0)) return false;
  const tol = Math.max(st.w * 0.5 + 8, 10);
  if (n === 1) return Math.hypot(x - p[0][0], y - p[0][1]) <= tol;
  for (let i = 1; i < n; i++) {
    if (skSegDist(x, y, p[i - 1][0], p[i - 1][1], p[i][0], p[i][1]) <= tol) return true;
  }
  return false;
}

// 后画的盖在上面，命中时也先擦最上面那条
function skHitIndex(x, y) {
  for (let i = SK.strokes.length - 1; i >= 0; i--) {
    if (skHitStroke(SK.strokes[i], x, y)) return i;
  }
  return -1;
}

function skEraseAt(x, y) {
  const i = skHitIndex(x, y);
  if (i < 0) return false;
  const st = SK.strokes.splice(i, 1)[0];
  SK.trash.push({ idx: i, st });
  if (SK.trash.length > 60) SK.trash.shift();
  SK.hover = -1;
  skRedraw();
  skSaveSoon();
  return true;
}

// 统一设置画笔状态，供整笔重绘与增量画单段复用
function skApplyStyle(ctx, st) {
  ctx.save();
  if (st.t === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.fillStyle = "rgba(0,0,0,1)";
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = st.t === "marker" ? 0.32 : 1;
    ctx.strokeStyle = st.c;
    ctx.fillStyle = st.c;
  }
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = skBaseW(st);
}

// 笔迹基准宽度（橡皮擦要加粗才擦得干净）
function skBaseW(st) {
  return st.t === "eraser" ? st.w * 3 : st.w;
}

/* ---------- 手绘笔触 ----------
   目标：像真的拿笔在纸上划，而不是用尺子画直线。
   1) 速度变宽：慢下来墨就浓（粗），快速划过就细 —— 书写的轻重感
   2) 起笔渐入 / 收笔渐出：两端不是一刀切的圆头
   3) 曲线平滑：相邻采样点用二次贝塞尔连接，消除折线感
   4) 微抖动：打破鼠标/触控板那种数学上过于完美的直线
   宽度做递推平滑，避免一段粗一段细的跳变。 */
function skWidthFor(st, i, prevW, live) {
  const p = st.pts, base = skBaseW(st);
  if (i === 0) return base;
  const rough = (st.r === undefined ? SK.rough : st.r);   // 每笔沿用自己落笔时的手感
  const dx = p[i][0] - p[i - 1][0], dy = p[i][1] - p[i - 1][1];
  const d = Math.sqrt(dx * dx + dy * dy);
  const dt = (p[i][2] == null ? 16 : p[i][2]);            // 旧标注没有时间戳，按 16ms 估
  const v = d / Math.max(dt, 8);                           // px/ms
  let f = 1;
  if (rough && st.t !== "eraser") {
    if (st.t === "marker") f = 1.09 - 0.20 * Math.min(v, 1.2) / 1.2;   // 荧光笔幅度小，保证涂得匀
    else f = 1.16 - 0.44 * Math.min(v, 1.4) / 1.4;                     // 画笔：慢粗快细
    if (p[i][3]) f *= 0.55 + 0.75 * p[i][3];                            // 触控笔压感
    if (i <= 3) f *= 0.42 + 0.19 * i;                                   // 起笔渐入
    // 收笔渐出只在整笔确定后（松手/重绘）才加，否则绘制途中每个新点都被当成笔尖
    if (!live) {
      const tail = p.length - 1 - i;
      if (tail <= 2) f *= 0.58 + 0.21 * tail;
    }
  }
  const target = base * f;
  const prev = (prevW == null ? target : prevW);
  return prev * 0.55 + target * 0.45;                      // 递推平滑，宽度不会突变
}

// 宽度缓存：增量绘制时只算新点，全量重绘时才整体重算
function skEnsureW(st) {
  const n = st.pts.length;
  if (st._W && st._W.length === n) return st._W;
  const W = new Array(n);
  for (let i = 0; i < n; i++) W[i] = skWidthFor(st, i, i ? W[i - 1] : null, false);
  st._W = W;
  return W;
}

// 第 k 段曲线的两个节点：起点 node(k-1)、控制点 p[k]、终点 node(k)
function skNode(p, k) {
  if (k <= 0) return [p[0][0], p[0][1]];
  if (k >= p.length - 1) return [p[p.length - 1][0], p[p.length - 1][1]];
  return [(p[k][0] + p[k + 1][0]) / 2, (p[k][1] + p[k + 1][1]) / 2];
}

function skDrawStroke(ctx, st) {
  if (!st || !st.pts || !st.pts.length) return;
  skEnsureW(st);
  const p = st.pts, n = p.length;
  skApplyStyle(ctx, st);
  if (n === 1) {
    // 单点：画一个圆点，保证轻点也能留下痕迹
    ctx.beginPath();
    ctx.arc(p[0][0], p[0][1], st._W[0] / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  // 相邻段宽度接近就合并成一条 path，避免几百次 stroke 拖慢重绘
  let cw = st._W[1];
  ctx.lineWidth = cw;
  ctx.beginPath();
  ctx.moveTo(p[0][0], p[0][1]);
  for (let k = 1; k < n; k++) {
    const w = st._W[k];
    if (Math.abs(w - cw) > 0.35) {
      ctx.stroke();
      const a = skNode(p, k - 1);
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      cw = w;
      ctx.lineWidth = cw;
    }
    if (k >= n - 1) {
      ctx.lineTo(p[n - 1][0], p[n - 1][1]);
    } else {
      const e = skNode(p, k);
      ctx.quadraticCurveTo(p[k][0], p[k][1], e[0], e[1]);
    }
  }
  ctx.stroke();
  ctx.restore();
}

// 采样点加一点手抖：鼠标/触控板画出来的线太"数学完美"，抖一下才有纸笔味。
// 用低频正弦漂移而不是纯随机 —— 真人的手抖是一条缓慢起伏的线，不是高频毛刺。
function skJitter(st, x, y, v, i) {
  const rough = (st.r === undefined ? SK.rough : st.r);
  if (!rough || st.t === "eraser") return [x, y];
  if (st._ph === undefined) st._ph = Math.random() * 6.283;
  const amp = (0.35 + st.w * 0.09) * (1 - 0.5 * Math.min(v, 1));
  const p = st._ph;
  const nx = (Math.sin(i * 0.35 + p) * 0.6 + Math.sin(i * 0.11 + p * 2) * 0.4) * amp
           + (Math.random() - 0.5) * 0.3 * amp;
  const ny = (Math.cos(i * 0.31 + p * 1.7) * 0.6 + Math.cos(i * 0.09 + p * 3) * 0.4) * amp
           + (Math.random() - 0.5) * 0.3 * amp;
  return [x + nx, y + ny];
}

/* ---------- 绘制交互 ---------- */
function skPos(e) {
  return [e.clientX + window.scrollX, e.clientY + window.scrollY];
}

// 追加一个采样点：记录与上一点的时间差（用来算速度→粗细），并返回该点速度
function skPushPoint(st, x, y, now, pressure) {
  const p = st.pts;
  const last = p[p.length - 1];
  const dx = x - last[0], dy = y - last[1];
  const d = Math.sqrt(dx * dx + dy * dy);
  const dt = Math.min(255, Math.max(1, Math.round(now - (st._t || now))));
  const v = d / Math.max(dt, 8);
  const j = skJitter(st, x, y, v, p.length);
  st._t = now;
  // 没有压感时只存 3 个数，标注多的时候能省下不少 localStorage
  if (pressure > 0) p.push([Math.round(j[0] * 10) / 10, Math.round(j[1] * 10) / 10, dt, pressure]);
  else p.push([Math.round(j[0] * 10) / 10, Math.round(j[1] * 10) / 10, dt]);
  st._W.push(skWidthFor(st, p.length - 1, st._W[st._W.length - 1], true));
  return v;
}

// 浏览器会把快速移动合并成一条 pointermove，必须取回其中的每个采样点。
function skSamples(e) {
  const samples = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [];
  return samples.length ? [...samples, e] : [e];
}

function skSampleStroke(st, e) {
  const [x, y] = skPos(e);
  const last = st._raw || st.pts[st.pts.length - 1];
  if (Math.hypot(x - last[0], y - last[1]) < 0.35) return;
  const pr = e.pointerType !== "mouse" && e.pressure > 0 ? e.pressure : 0;
  skPushPoint(st, x, y, e.timeStamp, pr);
  st._raw = [x, y];
}

function skFinishStroke(e) {
  if (e && e.pointerId !== SK.pointerId) return;
  if (SK.pointerId === null) return;
  const id = SK.pointerId;
  if (SK.cur) {
    // 松笔也可能带有最后一段移动；cancel/lostcapture 的坐标不能当作笔迹。
    if (e && e.type === "pointerup") {
      for (const sample of skSamples(e)) skSampleStroke(SK.cur, sample);
    }
    SK.cur._W = null; // 完笔后重新计算收笔渐细
    SK.cur = null;
  }
  SK.erasing = false;
  SK.pointerId = null;
  skRedraw();
  skSaveSoon();
  try { SK.canvas.releasePointerCapture(id); } catch (err) {}
}

function skBindCanvas(cv) {
  cv.addEventListener("pointerdown", (e) => {
    if (!SK.on || SK.pointerId !== null || e.button !== 0 || e.isPrimary === false) return;
    if (SK.tool === "text") {
      const wasEditing = !!document.querySelector(".sk-note .sk-note-input");
      skFinishEditing();
      if (!wasEditing) skAddNote(skPos(e));
      return;
    }
    SK.pointerId = e.pointerId;
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
    const [x, y] = skPos(e);
    if (SK.tool === "eraser") {
      SK.erasing = true;
      skEraseAt(x, y);
    } else {
      SK.cur = { t: SK.tool === "marker" ? "marker" : "pen", c: SK.color,
        w: SK.width, r: SK.rough, pts: [[x, y, 0, 0]] };
      SK.cur._t = e.timeStamp;
      SK.cur._raw = [x, y];
      SK.cur._W = [skBaseW(SK.cur)];
      SK.strokes.push(SK.cur);
      skRequestFrame();
    }
    e.preventDefault();
  });

  cv.addEventListener("pointermove", (e) => {
    if (!SK.on) return;
    if (SK.pointerId !== null) {
      if (e.pointerId !== SK.pointerId) return;
      for (const sample of skSamples(e)) {
        if (SK.erasing) skEraseAt(...skPos(sample));
        else if (SK.cur) skSampleStroke(SK.cur, sample);
      }
      skRequestFrame();
      e.preventDefault();
    } else if (SK.tool === "eraser") {
      const i = skHitIndex(...skPos(e));
      if (i !== SK.hover) { SK.hover = i; skRequestFrame(); }
    }
  });

  cv.addEventListener("pointerup", skFinishStroke);
  cv.addEventListener("pointercancel", skFinishStroke);
  cv.addEventListener("lostpointercapture", skFinishStroke);
  cv.addEventListener("pointerleave", (e) => {
    // 捕获成功后，离开边缘仍继续这一笔，不要提前截断曲线。
    if (SK.pointerId === e.pointerId && !cv.hasPointerCapture(e.pointerId)) skFinishStroke(e);
    if (SK.hover !== -1) { SK.hover = -1; skRequestFrame(); }
  });
}

/* ---------- 文字便签 ---------- */
function skAddNote(pos) {
  const id = "n" + Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36);
  SK.notes.push({ id, x: pos[0], y: pos[1], c: SK.color, text: "" });
  skRenderNotes();
  skSave();
  const el = document.querySelector('.sk-note[data-id="' + id + '"]');
  if (el) skEditNote(el, true);
}

function skRenderNotes() {
  if (!SK.notesBox) return;
  skFinishEditing();          // 重建 DOM 前先保存，避免正在输入的内容被抹掉
  SK.notesBox.innerHTML = SK.notes.map(n => `
    <div class="sk-note" data-id="${n.id}" style="left:${n.x}px;top:${n.y}px;--nc:${n.c}">
      <div class="sk-note-bar" title="按住拖动">
        <span class="sk-note-grip">⋮⋮</span>
        <span class="sk-note-del" title="删除">×</span>
      </div>
      <div class="sk-note-text">${skEsc(n.text) || '<span class="sk-note-ph">点击输入…</span>'}</div>
    </div>`).join("");
  skBindNotes();
}

function skEsc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function skBindNotes() {
  if (!SK.notesBox) return;
  SK.notesBox.querySelectorAll(".sk-note").forEach(el => {
    const id = el.dataset.id;
    const txt = el.querySelector(".sk-note-text");

    // 单击正文即可编辑（不必双击），点标题栏才是拖动
    txt.addEventListener("pointerdown", e => e.stopPropagation());
    txt.addEventListener("click", () => skEditNote(el));

    el.querySelector(".sk-note-del").addEventListener("pointerdown", e => {
      e.stopPropagation();
      SK.notes = SK.notes.filter(n => n.id !== id);
      skRenderNotes();
      skSave();
    });

    // 整个标题栏都可拖动（删除按钮自己会 stopPropagation），
    // 只认 .sk-note-grip 那几个像素点时用户根本按不到
    const bar = el.querySelector(".sk-note-bar");
    bar.addEventListener("pointerdown", e => {
      e.stopPropagation();
      skFinishEditing();
      SK.drag = { id, el, ox: e.clientX - el.offsetLeft, oy: e.clientY - el.offsetTop, moved: false };
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
      el.classList.add("dragging");
    });
    el.addEventListener("pointermove", e => {
      if (!SK.drag || SK.drag.id !== id) return;
      const x = Math.max(0, e.clientX - SK.drag.ox + window.scrollX);
      const y = Math.max(0, e.clientY - SK.drag.oy + window.scrollY);
      el.style.left = x + "px";
      el.style.top = y + "px";
      SK.drag.moved = true;
    });
    el.addEventListener("pointerup", e => {
      if (!SK.drag || SK.drag.id !== id) return;
      const n = SK.notes.find(v => v.id === id);
      if (n) { n.x = parseFloat(el.style.left) || n.x; n.y = parseFloat(el.style.top) || n.y; }
      el.classList.remove("dragging");
      SK.drag = null;
      skSave();
      try { el.releasePointerCapture(e.pointerId); } catch (err) {}
    });
  });
}

// 结束正在编辑的便签（存在则保存并收起输入框）；
// 重建 DOM 前必须先调用，否则 textarea 会被销毁导致输入内容丢失
function skFinishEditing() {
  const ta = document.querySelector(".sk-note .sk-note-input");
  if (ta) ta.blur();
}

function skEditNote(el) {
  const id = el.dataset.id;
  const n = SK.notes.find(v => v.id === id);
  if (!n) return;
  if (el.querySelector(".sk-note-input")) return;   // 已在编辑中

  const txt = el.querySelector(".sk-note-text");
  // 用真正的 textarea 而不是 contenteditable：中文输入、光标、换行都更可靠
  const ta = document.createElement("textarea");
  ta.className = "sk-note-input";
  ta.rows = 2;
  ta.placeholder = "输入标注…";
  ta.value = n.text || "";
  txt.innerHTML = "";
  txt.appendChild(ta);
  el.classList.add("editing");
  ta.focus();
  ta.select();

  const done = () => {
    if (!ta.parentNode) return;
    n.text = ta.value.trim();
    ta.remove();
    el.classList.remove("editing");
    txt.innerHTML = n.text ? skEsc(n.text) : '<span class="sk-note-ph">点击输入…</span>';
    skSave();
    ta.removeEventListener("blur", done);
  };
  ta.addEventListener("blur", done);
  ta.addEventListener("pointerdown", e => e.stopPropagation());
  ta.addEventListener("keydown", e => {
    e.stopPropagation();                       // 避免触发全局 Esc 关闭标注层
    if (e.key === "Escape") ta.blur();
  });
}

/* ---------- 工具操作 ---------- */
function skUndo() {
  skFinishStroke();
  // 整笔擦掉的优先"复活"，撤销的意思就是反悔上一次操作
  if (SK.trash && SK.trash.length) {
    const t = SK.trash.pop();
    SK.strokes.splice(Math.min(t.idx, SK.strokes.length), 0, t.st);
    skRedraw();
    skSave();
    if (typeof showToast === "function") showToast("已恢复刚擦掉的那一笔");
    return;
  }
  if (!SK.strokes.length) {
    if (SK.notes.length) { SK.notes.pop(); skRenderNotes(); skSave(); }
    return;
  }
  SK.strokes.pop();
  skRedraw();
  skSave();
}

function skClear() {
  skFinishStroke();
  if (!SK.strokes.length && !SK.notes.length && !(SK.trash && SK.trash.length)) return;
  SK.strokes = [];
  SK.notes = [];
  SK.trash = [];
  SK.hover = -1;
  skRedraw();
  skRenderNotes();
  skSave();
  if (typeof showToast === "function") showToast("已清除本板块全部标注");
}

function skSetTool(t) {
  skFinishStroke();
  SK.tool = t;
  if (t !== "eraser") { SK.hover = -1; skRedraw(); }   // 换工具就把擦除预览收起来
  skSyncBar();
  if (typeof showToast === "function") {
    const name = { pen: "画笔", marker: "荧光笔", eraser: "橡皮擦", text: "文字标注" }[t] || t;
    const tip = {
      pen: "已选画笔",
      marker: "已选荧光笔",
      eraser: "已选橡皮擦：点一下整条笔迹就消失，按住拖动能连擦，撤销可恢复",
      text: "已选文字标注：点击题目任意位置开始输入",
    }[t];
    showToast(tip || ("已选" + name));
  }
}

function skSetColor(c) { SK.color = c; skSyncBar(); }
function skSetWidth(w) { SK.width = parseFloat(w); skSyncBar(); }

// 手绘感开关：只影响之后落笔的笔迹，已经画好的保持原样
function skToggleRough() {
  SK.rough = !SK.rough;
  try { localStorage.setItem("skRough", SK.rough ? "1" : "0"); } catch (e) {}
  skSyncBar();
  if (typeof showToast === "function") {
    showToast(SK.rough ? "手绘笔触：开（随手涂鸦，有轻重变化）" : "手绘笔触：关（平滑等宽）");
  }
}

/* ---------- 开关 ---------- */
function skToggle(force) {
  skEnsure();
  skFinishStroke();
  skSave();
  SK.on = (force === undefined) ? !SK.on : !!force;
  SK.layer.classList.toggle("active", SK.on);
  document.body.classList.toggle("sk-on", SK.on);
  if (SK.on) {
    skLoad();
    skResize();
    skRedraw();
    skRenderNotes();
    if (typeof showToast === "function") showToast("标注已开启：可直接在题目上写画");
  } else {
    SK.hover = -1;
    SK.erasing = false;
    skSave();
    if (typeof showToast === "function") showToast("标注已关闭（已自动保存）");
  }
  skSyncBar();
}

/* ---------- 工具栏 ---------- */
function skBuildBar() {
  if (document.getElementById("skBar")) return;
  const bar = document.createElement("div");
  bar.id = "skBar";
  bar.className = "sk-bar";
  bar.innerHTML = `
    <button class="sk-fab" id="skFab" title="涂鸦标注">✏️</button>
    <div class="sk-panel" id="skPanel">
      <div class="sk-row">
        <button class="sk-tool" data-tool="pen" onclick="skSetTool('pen')" title="画笔">✏️</button>
        <button class="sk-tool" data-tool="marker" onclick="skSetTool('marker')" title="荧光笔">🖍️</button>
        <button class="sk-tool" data-tool="eraser" onclick="skSetTool('eraser')" title="橡皮擦：点一下整条笔迹即删除（按住拖动可连擦）">🧽</button>
        <button class="sk-tool" data-tool="text" onclick="skSetTool('text')" title="文字标注">🔤</button>
        <button class="sk-tool sk-tg" data-tg="rough" onclick="skToggleRough()" title="手绘笔触：开=随手涂鸦（轻重变化），关=平滑等宽">✋</button>
      </div>
      <div class="sk-row sk-colors">
        ${SK_COLORS.map(([c, n]) => `<button class="sk-color" data-color="${c}" onclick="skSetColor('${c}')" title="${n}" style="background:${c}"></button>`).join("")}
      </div>
      <div class="sk-row sk-widths">
        <button class="sk-w" data-w="2" onclick="skSetWidth(2)" title="细"><i style="height:2px"></i></button>
        <button class="sk-w" data-w="4" onclick="skSetWidth(4)" title="中"><i style="height:4px"></i></button>
        <button class="sk-w" data-w="8" onclick="skSetWidth(8)" title="粗"><i style="height:8px"></i></button>
      </div>
      <div class="sk-row">
        <button class="sk-act" onclick="skUndo()" title="撤销">↩️ 撤销</button>
        <button class="sk-act danger" onclick="skClear()" title="清除全部">🗑 清除</button>
      </div>
      <div class="sk-hint">标注自动保存 · 切换板块各自独立</div>
    </div>`;
  document.body.appendChild(bar);
  document.getElementById("skFab").addEventListener("click", () => skToggle());
  skSyncBar();
}

function skSyncBar() {
  const bar = document.getElementById("skBar");
  if (!bar) return;
  bar.classList.toggle("active", SK.on);
  const fab = document.getElementById("skFab");
  if (fab) fab.textContent = SK.on ? "✏️" : "✏️";
  bar.querySelectorAll(".sk-tool").forEach(b => b.classList.toggle("active", b.dataset.tool === SK.tool));
  bar.querySelectorAll(".sk-tg").forEach(b => b.classList.toggle("active", !!SK.rough));
  bar.querySelectorAll(".sk-color").forEach(b => b.classList.toggle("active", b.dataset.color === SK.color));
  bar.querySelectorAll(".sk-w").forEach(b => b.classList.toggle("active", parseFloat(b.dataset.w) === SK.width));
}

/* ---------- 板块切换自动重载 ---------- */
let skSyncTimer = null;
function skSyncSection() {
  if (!SK.on || !SK.key) return;
  const k = skKey();
  if (k === SK.key) return;
  skFinishStroke();
  skSave();
  SK.trash = [];
  SK.hover = -1;
  skLoad();
  skResize();
  skRedraw();
  skRenderNotes();
}

/* ---------- 初始化 ---------- */
function skInit() {
  skEnsure();
  skBuildBar();
  skLoad();
  skResize();
  skRenderNotes();

  // 滚动只申请下一帧，不读取 scrollHeight，不在事件处理里重排或重绘。
  window.addEventListener("scroll", () => { if (SK.on) skRequestFrame(); }, { passive: true });
  window.addEventListener("resize", () => { if (SK.on) skResize(); });
  window.addEventListener("blur", () => skFinishStroke());
  window.addEventListener("pagehide", () => { skFinishStroke(); skSave(); });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { skFinishStroke(); skSave(); }
  });

  // 内容变化时按需切换存储键，视口尺寸不受长文展开影响
  if (typeof MutationObserver !== "undefined") {
    new MutationObserver(() => {
      clearTimeout(skSyncTimer);
      skSyncTimer = setTimeout(() => { skSyncSection(); if (SK.on) skResize(); }, 400);
    }).observe(document.getElementById("app") || document.body, { childList: true, subtree: true });
  }

  // Ctrl/Cmd + Z 撤销；Esc 关闭标注层
  document.addEventListener("keydown", (e) => {
    if (!SK.on) return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); skUndo(); }
    if (e.key === "Escape") { skToggle(false); }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", skInit);
} else {
  skInit();
}
