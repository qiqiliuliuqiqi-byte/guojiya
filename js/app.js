// ============================================================
// app.js - Main application: router + page renderers
// ============================================================

// --- State ---
const state = {
  currentCourse: "CET6",
  currentExam: null,
  answers: {},
  currentQuestionIndex: 0,
  currentSection: 0,
  timer: null,
  timeRemaining: 0,
  examMode: false,
  wordBankUsed: {},
  flashcardIndex: 0,
  typingIndex: 0,
  typingCorrect: 0,
  typingTotal: 0,
  typingStartTime: 0,
};

// --- Course dataset helper ---
function getDatasets() {
  if (state.currentCourse === "IELTS") {
    return {
      exams: ieltsExamData,
      courses: ieltsCourseData,
      qTypes: ieltsQuestionTypeData,
      vocab: ieltsVocabularyData,
      questions: ieltsExamQuestions,
      isIELTS: true,
    };
  }
  return {
    exams: examData,
    courses: courseData,
    qTypes: questionTypeData,
    vocab: vocabularyData,
    questions: examQuestions,
    isIELTS: false,
  };
}

function getVocab() {
  return getDatasets().vocab;
}

// --- Router ---
const routes = {};

function route(path) {
  // Navigate to a route
  window.location.hash = path;
}

function getRoute() {
  const hash = window.location.hash.slice(1) || "/";
  return hash;
}

function handleRoute() {
  const path = getRoute().split("?")[0];
  const [base, ...rest] = path.split("/").filter(Boolean);

  // Close mobile menu
  document.querySelector(".nav-menu")?.classList.remove("open");

  // Find matching route handler
  let handler = null;
  if (path === "/" || path === "") handler = "home";
  else if (path === "/app") handler = "courseCenter";
  else if (path.startsWith("/app/course/")) {
    const course = rest[1]; // CET4, CET6, etc.
    state.currentCourse = course || "CET6";
    const sub = rest.slice(2).join("/"); // 支持 vocabulary/book 这类多段子路由
    if (!sub) handler = "courseCenter";
    else if (sub === "exams") handler = "examList";
    else if (sub === "course-list") handler = "courseList";
    else if (sub === "course-detail") handler = "courseDetail";
    else if (sub === "question-types") handler = "questionTypes";
    else if (sub === "mock-exam") handler = "mockExam";
    else if (sub === "vocabulary/book") handler = "vocabBook";
    else if (sub === "vocabulary/typing") handler = "vocabTyping";
    else if (sub === "vocabulary/practice") handler = "vocabPractice";
    else handler = "courseCenter";
  }
  else if (path.startsWith("/practice/")) {
    // "/practice/<examId>" → rest = [examId]（兼容旧三段式 /practice/<course>/<examId>）
    state.currentExam = rest[1] || rest[0];
    handler = "practice";
  }
  else handler = "home";

  // Render
  const app = document.getElementById("app");
  app.innerHTML = "";
  app.className = "page-enter";

  const renderer = pageRenderers[handler] || pageRenderers.home;
  renderer(app);

  window.scrollTo(0, 0);
  updateNavActive();
}

// --- Page Renderers ---
const pageRenderers = {};

// Home page
pageRenderers.home = (container) => {
  container.innerHTML = `
    <section class="hero">
      <div class="container">
        <div class="hero-inner">
          <h1>四级真题 · 六级真题 · 雅思剑桥真题<br><span class="highlight">免费在线练习</span></h1>
          <p class="subtitle">英语四六级真题 + 剑桥雅思 9–19 真题，按你的节奏练<br>支持整套模考、AI 智能组卷、Band 评分估算与单题型专项突破。</p>
          <div class="hero-cta">
            <button class="btn btn-primary btn-lg" onclick="route('/app')">进入真题库</button>
            <button class="btn btn-outline btn-lg" onclick="route('/app/course/CET6/exams')">CET6 真题列表</button>
          </div>
          <div class="hero-stats">
            <div class="hero-stat"><div class="num">190+</div><div class="label">历年真题套卷</div></div>
            <div class="hero-stat"><div class="num">30+</div><div class="label">备考技巧课程</div></div>
            <div class="hero-stat"><div class="num">5000+</div><div class="label">核心词汇</div></div>
            <div class="hero-stat"><div class="num">729</div><div class="label">听力题组</div></div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-title">
          <span class="pill">PILLAR 01 · 真题</span>
          <h2>190+ 套真题，<span class="highlight">按你的节奏练</span></h2>
          <p class="desc">完整收录 2013–2025 年 CET4/CET6 真题 + 剑桥雅思 9–19 真题，支持整套模考、AI 智能组卷与单题型专项突破。</p>
        </div>
        <div class="feature-cards">
          <div class="feature-card">
            <div class="icon">📝</div>
            <div class="tag">真题库</div>
            <h3>历年真题套卷</h3>
            <p>2013–2025 年 CET4/CET6 完整套卷 + 剑桥雅思 9–19，听力、阅读、写作、翻译/口语全题型，无缺页无水印一键下载。</p>
            <div style="display:flex;gap:8px;margin-bottom:16px;">
              <span class="link" onclick="route('/app/course/CET4/exams')">CET-4</span>
              <span style="color:var(--border);">|</span>
              <span class="link" onclick="route('/app/course/CET6/exams')">CET-6</span>
              <span style="color:var(--border);">|</span>
              <span class="link" onclick="route('/app/course/IELTS/exams')">IELTS</span>
            </div>
            <a class="link" onclick="route('/app')">进入真题库 →</a>
          </div>
          <div class="feature-card">
            <div class="icon">🎲</div>
            <div class="tag">AI 模拟卷</div>
            <h3>AI 智能组卷</h3>
            <p>基于真题题库智能组卷，每次都是新题，模考实战感拉满。</p>
            <a class="link" onclick="route('/app/course/CET4/mock-exam')">生成模拟卷 →</a>
          </div>
          <div class="feature-card">
            <div class="icon">🎯</div>
            <div class="tag">专项练习</div>
            <h3>题型专项练习</h3>
            <p>听力 / 阅读 / 写作 / 翻译 / 选词填空 分题型靶向突破薄弱项。</p>
            <a class="link" onclick="route('/app/course/CET4/question-types')">选择题型 →</a>
          </div>
        </div>
      </div>
    </section>

    <section class="section" style="background:var(--bg-white);">
      <div class="container">
        <div class="section-title">
          <span class="pill">PILLAR 02 · 课程</span>
          <h2>备考技巧课，<span class="highlight">少走两年弯路</span></h2>
          <p class="desc">听力、阅读、写作、翻译、词汇五大方向，由短视频技巧卡组成，碎片化学，3 分钟见效。</p>
        </div>
        <div class="course-showcase">
          <div class="course-card" onclick="route('/app/course/CET6/course-list')">
            <div class="card-icon">🎧</div>
            <div class="card-body">
              <div class="card-tag">CET-4</div>
              <h3>听力满分技巧</h3>
              <p>短对话 / 长对话 / 短文听写，每个题型的解题路径与高频陷阱。</p>
              <span class="card-link">查看课程 →</span>
            </div>
          </div>
          <div class="course-card" onclick="route('/app/course/CET6/course-list')">
            <div class="card-icon">✍️</div>
            <div class="card-body">
              <div class="card-tag">CET-4</div>
              <h3>写作模板速成</h3>
              <p>12 类常考话题模板，开头-展开-结尾三段式，套用就能拿基础分。</p>
              <span class="card-link">查看课程 →</span>
            </div>
          </div>
          <div class="course-card" onclick="route('/app/course/CET6/course-list')">
            <div class="card-icon">📖</div>
            <div class="card-body">
              <div class="card-tag">CET-6</div>
              <h3>阅读长难句拆解</h3>
              <p>六级阅读高频长难句结构图解，从主干识别到考点定位。</p>
              <span class="card-link">查看课程 →</span>
            </div>
          </div>
        </div>
        <div style="text-align:center;margin-top:32px;">
          <button class="btn btn-outline" onclick="route('/app/course/CET6/course-list')">查看全部 30+ 节课程 →</button>
        </div>
      </div>
    </section>

    <section class="section vocab-section">
      <div class="container">
        <div class="section-title">
          <span class="pill">PILLAR 03 · 词汇</span>
          <h2>5000+ 核心词汇，三种方式背</h2>
          <p class="desc">CET4/CET6 高频词书 + 打字训练 + 智能生词本，从被动认识到主动产出，词汇量稳步上台阶。</p>
        </div>
        <div class="vocab-cards">
          <div class="vocab-card" onclick="route('/app/course/CET6/vocabulary/book')">
            <div class="icon">📖</div>
            <div class="tag">词书</div>
            <h3>核心词书</h3>
            <p>按词频/词根分组，每天 20 词，配例句与真题用法，进度自动同步。</p>
            <span class="link">开始背单词 →</span>
          </div>
          <div class="vocab-card" onclick="route('/app/course/CET6/vocabulary/typing')">
            <div class="icon">⌨️</div>
            <div class="tag">训练</div>
            <h3>单词打字训练</h3>
            <p>边听边敲，强化拼写记忆，WPM / 准确率 实时追踪，告别"看一眼忘一秒"。</p>
            <span class="link">开始训练 →</span>
          </div>
          <div class="vocab-card" onclick="route('/app/course/CET6/vocabulary/practice')">
            <div class="icon">🧠</div>
            <div class="tag">复习</div>
            <h3>智能生词本</h3>
            <p>做题中一键收藏生词，系统按艾宾浩斯曲线安排间隔复习，记得牢。</p>
            <span class="link">查看生词本 →</span>
          </div>
        </div>
      </div>
    </section>

    <section class="section" style="background:var(--bg-white);">
      <div class="container">
        <div class="section-title">
          <span class="pill">核心功能</span>
          <h2>让每一次练习都<span class="highlight">有效</span></h2>
          <p class="desc">真题 / 课程 / 词汇 之外，这些底层能力让备考更高效。</p>
        </div>
        <div class="features-grid">
          ${coreFeatures.map(f => `
            <div class="feature-item">
              ${f.badge ? `<div class="badge">${f.badge}</div>` : ""}
              <div class="icon">${f.icon}</div>
              <h3>${f.title}</h3>
              <p>${f.desc}</p>
            </div>
          `).join("")}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-title">
          <span class="pill">使用流程</span>
          <h2>三步开始<span class="highlight">高效备考</span></h2>
        </div>
        <div class="flow-steps">
          <div class="flow-step">
            <div class="step-num">01</div>
            <h3>选内容</h3>
            <p>真题、备考课程、词汇训练三选一，按当下最需要的能力切入。</p>
          </div>
          <div class="flow-step">
            <div class="step-num">02</div>
            <h3>学 / 练</h3>
            <p>模考真题、看技巧课、背高频词，碎片时间也能高质量推进。</p>
          </div>
          <div class="flow-step">
            <div class="step-num">03</div>
            <h3>AI 深度复盘</h3>
            <p>即时评分 + 逐题解析 + 生词回流，找准薄弱点，下一步练什么一目了然。</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section pricing-section" style="background:var(--bg);">
      <div class="container">
        <div class="section-title">
          <span class="pill">会员方案</span>
          <h2>选择适合你的<span class="highlight">计划</span></h2>
          <p class="desc">试卷会员与课程会员<b>分开开通</b>，各自解锁对应内容。先选方向，再挑套餐。</p>
        </div>
        <div class="pricing-toggle">
          <div class="tab active">📝 试卷会员</div>
          <div class="tab">🎓 课程会员</div>
        </div>
        <div class="pricing-cards">
          ${pricingData.map(p => `
            <div class="price-card ${p.popular ? "popular" : ""}">
              ${p.popular ? '<div class="popular-badge">推荐</div>' : ""}
              <div class="badge">${p.badge}</div>
              <h3>${p.name}</h3>
              <div class="price"><span class="currency">¥</span>${p.price}</div>
              <div class="price-unit">${p.unit}</div>
              <ul>
                ${p.features.map(f => `<li>${f}</li>`).join("")}
              </ul>
              <button class="btn ${p.popular ? "btn-gradient" : "btn-outline"} btn-block" onclick="showToast('订阅功能演示中，实际使用请访问原站')">${p.cta}</button>
            </div>
          `).join("")}
        </div>
      </div>
    </section>
  `;
};

// Course Center
pageRenderers.courseCenter = (container) => {
  container.innerHTML = `
    <div class="course-center">
      <div class="container">
        <h1>选择你的<span class="highlight">备考方向</span></h1>
        <div class="course-selection">
          <div class="course-option" onclick="route('/app/course/CET4/exams')">
            <div class="code">CET-4</div>
            <h2>大学英语四级</h2>
            <div class="subtitle">College English Test Band 4</div>
            <p>2015–2025 完整真题 · 听力 / 阅读 / 写作 / 翻译四大题型一站练习</p>
            <div class="enter-btn">进入练习</div>
          </div>
          <div class="course-option" onclick="route('/app/course/CET6/exams')">
            <div class="code">CET-6</div>
            <h2>大学英语六级</h2>
            <div class="subtitle">College English Test Band 6</div>
            <p>阅读篇章 + 高频学术词汇 · 长难句精解 · 写作翻译评分</p>
            <div class="enter-btn">进入练习</div>
          </div>
          <div class="course-option" onclick="route('/app/course/IELTS/exams')">
            <div class="code">IELTS</div>
            <h2>雅思英语</h2>
            <div class="subtitle">International English Language Testing System</div>
            <p>剑桥雅思 9–19 真题 · 听力 / 阅读 / 写作 / 口语四科专项 · Band 评分标准精讲</p>
            <div class="enter-btn">进入练习</div>
          </div>
        </div>
      </div>
    </div>
  `;
};

// Exam List
pageRenderers.examList = (container) => {
  // CET6：使用真实真题数据（63套）
  if (state.currentCourse === "CET6") {
    rxRenderExamList(container);
    return;
  }
  const ds = getDatasets();
  const courseName = courseNames[state.currentCourse] || state.currentCourse;
  container.innerHTML = `
    <div class="exam-page">
      <div class="container">
        <div class="exam-header">
          <div class="breadcrumb">
            <a onclick="route('/app')">首页</a> / 
            <a onclick="route('/app/course/${state.currentCourse}')">${courseName}</a> / 
            ${ds.isIELTS ? "剑桥真题" : "历年真题"}
          </div>
          <h1>${courseName}${ds.isIELTS ? "剑桥真题" : "历年真题"}</h1>
          ${ds.isIELTS ? '<p style="color:var(--text-light);font-size:15px;margin-top:8px;">完整收录剑桥雅思 9–19 学术类真题 + 机考模拟卷，听力 / 阅读 / 写作 / 口语全科在线练习</p>' : ""}
        </div>
        ${ds.exams.map(period => `
          <div class="exam-period">
            <div class="exam-period-title">${period.period}</div>
            <div class="exam-grid">
              ${period.exams.map(exam => `
                <div class="exam-card">
                  ${exam.isLatest ? '<div class="latest-tag">最新</div>' : ""}
                  <div class="exam-title">${exam.title}</div>
                  <div class="exam-actions">
                    <button class="btn btn-primary btn-sm" onclick="route('/practice/${exam.id}')">在线练习</button>
                    <button class="btn btn-outline btn-sm" onclick="showToast('真题下载功能演示中')">真题下载</button>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
};

// Exam Practice
pageRenderers.practice = (container) => {
  // CET6 真实真题：走真实考试模块
  if (rxIsRealExam(state.currentExam)) {
    state.currentCourse = "CET6";
    rxRenderExam(container, state.currentExam);
    return;
  }
  let exam = findExam(state.currentExam);
  if (!exam) {
    // Handle mock exam
    exam = { id: state.currentExam, title: "AI 模拟卷 " + new Date().toLocaleDateString("zh-CN"), isLatest: false };
  }

  const ds = getDatasets();
  const duration = ds.isIELTS ? 160 : 130; // minutes

  // 雅思/四级：把该板块词表灌入本地词库，英文正文接入点词释义、句式划分与整句朗读
  rxSeedVocab(ds.vocab);

  state.answers = {};
  state.currentSection = 0;
  state.timeRemaining = duration * 60;
  state.examMode = true;

  const tabsHTML = ds.isIELTS ? `
          <div class="practice-tab active" data-section="listening" onclick="switchSection('listening')">🎧 听力</div>
          <div class="practice-tab" data-section="reading" onclick="switchSection('reading')">📖 阅读</div>
          <div class="practice-tab" data-section="writing" onclick="switchSection('writing')">✍️ 写作</div>
          <div class="practice-tab" data-section="speaking" onclick="switchSection('speaking')">🗣️ 口语</div>
  ` : `
          <div class="practice-tab active" data-section="writing" onclick="switchSection('writing')">✍️ 写作</div>
          <div class="practice-tab" data-section="listening" onclick="switchSection('listening')">🎧 听力</div>
          <div class="practice-tab" data-section="reading" onclick="switchSection('reading')">📖 阅读</div>
          <div class="practice-tab" data-section="translation" onclick="switchSection('translation')">🌏 翻译</div>
  `;

  container.innerHTML = `
    <div class="practice-page">
      <div class="container">
        <div class="practice-header">
          <div class="exam-info">
            <button class="btn btn-outline btn-sm" onclick="if(confirm('确定要退出练习吗？已答内容将不会保存。')) route('/app/course/${state.currentCourse}/exams')">← 退出</button>
            <span class="exam-name">${exam.title}</span>
          </div>
          <div class="timer" id="timer">${duration}:00</div>
        </div>
        <div class="practice-tabs" id="practiceTabs">
          ${tabsHTML}
        </div>
        ${rxInlineTools()}
        <div id="sectionContent"></div>
        <div class="practice-footer">
          <div id="sectionNav"></div>
          <button class="submit-btn" onclick="submitExam()">交卷</button>
        </div>
      </div>
    </div>
  `;

  // Start timer
  startTimer();
  // Render initial section
  switchSection(ds.isIELTS ? "listening" : "writing");
};

// Course List
pageRenderers.courseList = (container) => {
  // CET6：使用真实课程数据（6门课/37课时/111卡片）
  if (state.currentCourse === "CET6") {
    rxRenderCourseList(container);
    return;
  }
  const ds = getDatasets();
  container.innerHTML = `
    <div class="course-list-page">
      <div class="container">
        <div class="breadcrumb" style="font-size:14px;color:var(--text-light);margin-bottom:16px;">
          <a onclick="route('/app')" style="color:var(--primary)">首页</a> / 
          ${state.currentCourse} / 课程
        </div>
        <h1>${courseNames[state.currentCourse] || state.currentCourse}备考课程</h1>
        <p class="subtitle">按${ds.isIELTS ? "四科（听力/阅读/写作/口语）" : "题型"}分模块讲解，每节课配套即时检测与例句拆解。</p>
        ${ds.courses.map(course => `
          <div class="course-module" onclick="route('/app/course/${state.currentCourse}/course-detail?id=${course.id}')">
            <div class="module-icon" style="background:${course.color}22;">${course.icon}</div>
            <div class="module-info">
              <div class="module-title">${course.title}</div>
              <div class="module-desc">${course.desc}</div>
              <div class="module-meta">${course.lessons} 节课</div>
            </div>
            <div class="module-link">查看课程 →</div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
};

// Course Detail
pageRenderers.courseDetail = (container) => {
  // CET6：使用真实课程数据
  if (state.currentCourse === "CET6") {
    rxRenderCourseDetail(container);
    return;
  }
  const ds = getDatasets();
  const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
  const courseId = params.get("id") || ds.courses[0].id;
  const course = ds.courses.find(c => c.id === courseId) || ds.courses[0];

  container.innerHTML = `
    <div class="course-detail-page">
      <div class="container">
        <div class="course-detail-header">
          <a class="back-link" onclick="route('/app/course/${state.currentCourse}/course-list')">← 返回课程列表</a>
          <h1>${course.title}</h1>
          <div class="meta">${course.icon} ${course.lessons} 节课 · 按题型分模块讲解</div>
        </div>
        <p style="font-size:15px;color:var(--text-light);line-height:1.8;margin-bottom:32px;">${course.desc}</p>
        <div class="lesson-list">
          ${course.lessonList.map((lesson, i) => `
            <div class="lesson-item" onclick="showToast('${lesson.free ? "开始播放" : "会员专享课程，请先订阅"}')">
              <div class="lesson-num">${i + 1}</div>
              <div class="lesson-info">
                <div class="lesson-title">${lesson.title}</div>
                <div class="lesson-duration">⏱ ${lesson.duration}</div>
              </div>
              ${lesson.free ? '<span class="free-tag">免费试看</span>' : '<span class="lock-icon">🔒</span>'}
              <div class="play-btn">▶</div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
};

// Question Types
pageRenderers.questionTypes = (container) => {
  const ds = getDatasets();
  let activeType = "全部";

  function renderGroups() {
    const groups = activeType === "全部"
      ? ds.qTypes.flatMap(t => t.groups.map(g => ({...g, icon: t.icon, color: t.color, category: t.category})))
      : ds.qTypes.find(t => t.category === activeType)?.groups.map(g => ({...g, icon: ds.qTypes.find(t => t.category === activeType).icon, color: ds.qTypes.find(t => t.category === activeType).color, category: activeType})) || [];

    return groups.map(g => `
      <div class="qtype-card" onclick="showToast('开始练习：${g.title}')">
        <div class="card-header">
          <div class="icon">${g.icon}</div>
          <div class="title">${g.title}</div>
        </div>
        <div class="count">${g.count} 组题目</div>
        <div class="start-btn">开始练习</div>
      </div>
    `).join("");
  }

  container.innerHTML = `
    <div class="qtypes-page">
      <div class="container">
        <div class="breadcrumb" style="font-size:14px;color:var(--text-light);margin-bottom:16px;">
          <a onclick="route('/app')" style="color:var(--primary)">首页</a> / 
          ${state.currentCourse} / 题型练习
        </div>
        <h1>分题型靶向突破</h1>
        <p class="subtitle">按${ds.isIELTS ? "雅思" : "四六级"}题型 / 子题型针对性练习，AI 解析配合每一题</p>
        <div class="qtypes-download">
          <button class="btn btn-outline btn-sm" onclick="showToast('题型下载功能演示中')">📥 题型下载</button>
        </div>
        <div class="qtypes-tabs" id="qtypeTabs">
          <div class="qtype-tab active" data-type="全部" onclick="switchQType('全部')">📋 全部</div>
          ${ds.qTypes.map(t => `
            <div class="qtype-tab" data-type="${t.category}" onclick="switchQType('${t.category}')">
              ${t.icon} ${t.category}
            </div>
          `).join("")}
        </div>
        <div class="qtype-groups" id="qtypeGroups">
          ${renderGroups()}
        </div>
      </div>
    </div>
  `;
};

// Vocabulary Book
pageRenderers.vocabBook = (container) => {
  const vocab = getVocab();
  rxSeedVocab(vocab);
  const wordsPerPage = 20;
  let currentPage = 1;
  let searchQuery = "";

  function renderWords() {
    let words = [...vocab];
    if (searchQuery) {
      words = words.filter(w =>
        w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.meaning.includes(searchQuery)
      );
    }
    const start = (currentPage - 1) * wordsPerPage;
    const pageWords = words.slice(start, start + wordsPerPage);

    document.getElementById("vocabList").innerHTML = pageWords.map(w => `
      <div class="word-card ${w.learned ? "learned" : ""}" data-word="${w.word}">
        <div class="word-main">
          <div class="word-head">
            <span class="word-text">${w.word}</span>
            <span class="phonetic">${w.phonetic}</span>
          </div>
          <div class="meaning">${w.meaning}</div>
          <div class="example">${rxWrapSentencesEn(w.example)}</div>
        </div>
        <div class="word-actions">
          <span class="star-btn ${state.answers["star_" + w.word] ? "active" : ""}" onclick="toggleStar('${w.word}', this)">★</span>
          <span class="speak-btn" onclick="speakWord('${w.word}')">🔊</span>
        </div>
      </div>
    `).join("");

    // Update stats
    const learned = vocab.filter(w => w.learned).length;
    document.getElementById("learningCount").textContent = learned;
    document.getElementById("masteredCount").textContent = vocab.length - learned;
  }

  container.innerHTML = `
    <div class="vocab-book-page">
      <div class="container">
        <div class="vocab-book-header">
          <h1>${courseNames[state.currentCourse] || state.currentCourse} 核心词书</h1>
          <div class="vocab-stats">
            <div class="vocab-stat"><div class="num" id="learningCount">0</div><div class="label">学习中</div></div>
            <div class="vocab-stat"><div class="num" id="masteredCount">${vocab.length}</div><div class="label">待学习</div></div>
            <div class="vocab-stat"><div class="num">${vocab.length}</div><div class="label">总词汇</div></div>
          </div>
        </div>
        <div class="vocab-controls">
          <input type="text" class="search-box" placeholder="搜索单词或释义..." oninput="searchVocab(this.value)" />
        </div>
        ${rxInlineTools()}
        <div class="vocab-list" id="vocabList"></div>
      </div>
    </div>
  `;

  renderWords();
  window._renderVocabWords = renderWords;
};

// Vocabulary Typing
pageRenderers.vocabTyping = (container) => {
  const vocab = getVocab();
  state.typingIndex = 0;
  state.typingCorrect = 0;
  state.typingTotal = 0;
  state.typingStartTime = 0;

  container.innerHTML = `
    <div class="vocab-typing-page">
      <div class="container">
        <div class="breadcrumb" style="font-size:14px;color:var(--text-light);margin-bottom:16px;">
          <a onclick="route('/app')" style="color:var(--primary)">首页</a> / 
          ${state.currentCourse} / 打字训练
        </div>
        <h1 style="text-align:center;font-size:32px;font-weight:800;margin-bottom:40px;">单词打字训练</h1>
        <div class="typing-area">
          <div class="typing-display" id="typingDisplay">
            <div class="typing-phonetic" id="typingPhonetic">点击开始按钮</div>
            <div class="typing-word" id="typingWord">Ready?</div>
            <div class="typing-meaning" id="typingMeaning">边听边敲，强化拼写记忆</div>
          </div>
          <div class="typing-stats">
            <div class="typing-stat"><div class="num" id="typingWPM">0</div><div class="label">WPM</div></div>
            <div class="typing-stat"><div class="num" id="typingAccuracy">0%</div><div class="label">准确率</div></div>
            <div class="typing-stat"><div class="num" id="typingProgress">0/${vocab.length}</div><div class="label">进度</div></div>
          </div>
          <input type="text" class="typing-input" id="typingInput" placeholder="在此输入单词..." oninput="checkTyping(this.value)" onkeydown="handleTypingKey(event)" disabled />
          <div class="typing-controls">
            <button class="btn btn-primary" onclick="startTyping()" id="typingStartBtn">开始训练</button>
            <button class="btn btn-outline" onclick="speakCurrentWord()">🔊 听发音</button>
            <button class="btn btn-outline" onclick="skipWord()">跳过</button>
          </div>
        </div>
      </div>
    </div>
  `;
};

// Vocabulary Practice (Word Book / Flashcards)
pageRenderers.vocabPractice = (container) => {
  const vocab = getVocab();
  rxSeedVocab(vocab);
  state.flashcardIndex = 0;
  const starred = vocab.filter(w => state.answers["star_" + w.word]);
  const words = starred.length > 0 ? starred : vocab.slice(0, 20);

  function renderCard() {
    const word = words[state.flashcardIndex % words.length];
    document.getElementById("flashcardFront").innerHTML = `
      <div class="word">${word.word}</div>
      <div class="phonetic">${word.phonetic}</div>
    `;
    document.getElementById("flashcardBack").innerHTML = `
      <div class="meaning">${word.meaning}</div>
      <div class="example">${rxWrapSentencesEn(word.example)}</div>
    `;
    document.getElementById("cardProgress").textContent = `${state.flashcardIndex + 1} / ${words.length}`;
  }

  container.innerHTML = `
    <div class="vocab-practice-page">
      <div class="container">
        <div class="breadcrumb" style="font-size:14px;color:var(--text-light);margin-bottom:16px;">
          <a onclick="route('/app')" style="color:var(--primary)">首页</a> / 
          ${state.currentCourse} / 生词本
        </div>
        <h1 style="text-align:center;font-size:28px;font-weight:800;margin-bottom:8px;">智能生词本</h1>
        <p style="text-align:center;font-size:15px;color:var(--text-light);margin-bottom:40px;">点击卡片翻转查看释义，系统按艾宾浩斯曲线安排间隔复习</p>
        <div class="flashcard" id="flashcard" onclick="flipCard()">
          <div class="flashcard-inner" id="flashcardInner">
            <div class="flashcard-front" id="flashcardFront"></div>
            <div class="flashcard-back" id="flashcardBack"></div>
          </div>
        </div>
        <div style="text-align:center;margin-bottom:8px;font-size:14px;color:var(--text-light);" id="cardProgress">1 / ${words.length}</div>
        <div class="flashcard-controls">
          <button class="btn btn-outline" onclick="prevCard()">← 上一个</button>
          <button class="btn btn-primary" onclick="markLearned()">✓ 已掌握</button>
          <button class="btn btn-outline" onclick="nextCard()">下一个 →</button>
        </div>
      </div>
    </div>
  `;

  renderCard();
  window._renderFlashcard = renderCard;
  window._flashcardWords = words;
};

// Mock Exam
pageRenderers.mockExam = (container) => {
  container.innerHTML = `
    <div class="mock-exam-page">
      <div class="container">
        <div class="breadcrumb" style="font-size:14px;color:var(--text-light);margin-bottom:16px;">
          <a onclick="route('/app')" style="color:var(--primary)">首页</a> / 
          ${state.currentCourse} / AI 模拟卷
        </div>
        <h1>🎲 AI 智能组卷</h1>
        <p class="subtitle">基于真题题库智能组卷，每次都是新题，模考实战感拉满。</p>
        <div class="mock-config">
          <h2>组卷配置</h2>
          <div class="config-group">
            <label>考试科目</label>
            <div class="config-options">
              <div class="config-option active" onclick="selectConfig(this)">CET-4</div>
              <div class="config-option" onclick="selectConfig(this)">CET-6</div>
              <div class="config-option" onclick="selectConfig(this)">IELTS</div>
            </div>
          </div>
          <div class="config-group">
            <label>题型选择</label>
            <div class="config-options">
              <div class="config-option active" onclick="toggleConfig(this)">✍️ 写作</div>
              <div class="config-option active" onclick="toggleConfig(this)">🎧 听力</div>
              <div class="config-option active" onclick="toggleConfig(this)">📖 阅读</div>
              <div class="config-option active" onclick="toggleConfig(this)">🌏 翻译</div>
              <div class="config-option" onclick="toggleConfig(this)">🗣️ 口语</div>
            </div>
          </div>
          <div class="config-group">
            <label>难度</label>
            <div class="config-options">
              <div class="config-option" onclick="selectConfig(this)">简单</div>
              <div class="config-option active" onclick="selectConfig(this)">中等</div>
              <div class="config-option" onclick="selectConfig(this)">困难</div>
            </div>
          </div>
          <div class="config-group">
            <label>题量</label>
            <div class="config-options">
              <div class="config-option" onclick="selectConfig(this)">精简 (30题)</div>
              <div class="config-option active" onclick="selectConfig(this)">标准 (50题)</div>
              <div class="config-option" onclick="selectConfig(this)">完整 (全套)</div>
            </div>
          </div>
          <button class="mock-generate" onclick="generateMockExam()">🎲 生成模拟卷</button>
        </div>
      </div>
    </div>
  `;
};

// ============================================================
// Interactive functions
// ============================================================

// --- Timer ---
function startTimer() {
  if (state.timer) clearInterval(state.timer);
  state.timer = setInterval(() => {
    state.timeRemaining--;
    const m = Math.floor(state.timeRemaining / 60);
    const s = state.timeRemaining % 60;
    const timerEl = document.getElementById("timer");
    if (timerEl) {
      timerEl.textContent = `${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
      if (state.timeRemaining < 300) timerEl.classList.add("warning");
    }
    if (state.timeRemaining <= 0) {
      clearInterval(state.timer);
      submitExam();
    }
  }, 1000);
}

// --- Section switching in practice ---
function switchSection(section) {
  state.currentSection = section;
  const ds = getDatasets();
  // Update tabs
  document.querySelectorAll(".practice-tab").forEach(t => {
    t.classList.toggle("active", t.dataset.section === section);
  });

  const content = document.getElementById("sectionContent");
  const nav = document.getElementById("sectionNav");

  if (section === "writing") {
    if (ds.questions.writing.tasks) {
      // IELTS: Task 1 + Task 2
      content.innerHTML = ds.questions.writing.tasks.map((t, i) => `
        <div class="question-panel">
          <div class="q-topic" style="display:flex;align-items:center;gap:10px;"><span style="background:var(--primary);color:#fff;font-size:12px;font-weight:700;padding:3px 10px;border-radius:999px;">${t.label}</span>${rxWrapPhraseEn(t.topic)}</div>
          <div class="q-direction">${rxWrapSentencesEn(t.direction)}</div>
          ${t.chart ? `<div class="reading-passage" style="background:var(--accent-light);">${t.chart}</div>` : ""}
          ${t.outline ? `
            <ol class="q-outline">
              ${t.outline.map(o => `<li>${o}</li>`).join("")}
            </ol>
          ` : ""}
          <textarea class="answer-textarea" id="ieltsWriting_${i}" placeholder="Write your ${t.label} answer here..." oninput="updateIeltsWordCount(this, ${i})">${state.answers["ielts_writing_" + i] || ""}</textarea>
          <div class="word-count" id="ieltsWordCount_${i}">Words: ${(state.answers["ielts_writing_" + i] || "").trim().split(/\s+/).filter(w => w).length} / ${t.wordLimit} (at least ${t.wordLimit})</div>
        </div>
      `).join("");
      nav.innerHTML = `<span style="font-size:14px;color:var(--text-light);">写作部分 · Task 1 建议 20 分钟，Task 2 建议 40 分钟</span>`;
    } else {
      // CET
      content.innerHTML = `
        <div class="question-panel">
          <div class="q-direction">${rxWrapSentencesEn(ds.questions.writing.direction)}</div>
          <div class="q-topic">${rxWrapPhraseEn(ds.questions.writing.topic)}</div>
          <ol class="q-outline">
            ${ds.questions.writing.outline.map(o => `<li>${o}</li>`).join("")}
          </ol>
          <textarea class="answer-textarea" id="writingAnswer" placeholder="在此输入你的作文..." oninput="updateWordCount(this)">${state.answers.writing || ""}</textarea>
          <div class="word-count" id="wordCount">字数：${(state.answers.writing || "").trim().split(/\s+/).filter(w => w).length} / ${ds.questions.writing.wordLimit}</div>
        </div>
      `;
      nav.innerHTML = `<span style="font-size:14px;color:var(--text-light);">写作部分 · 建议 30 分钟</span>`;
    }
  } else if (section === "listening") {
    content.innerHTML = ds.questions.listening.sections.map((sec, si) => `
      <div class="question-panel">
        <div class="q-direction"><strong>${sec.type}</strong></div>
        ${sec.questions.map((q, qi) => `
          <div class="passage-toggle" onclick="this.nextElementSibling.classList.toggle('collapsed')">📜 ${rxWrapPhraseEn(q.content)} ${q.passage ? '(点击展开原文)' : ''}</div>
          ${q.passage ? `<div class="passage-text collapsed">${rxWrapParagraph(q.passage)}</div>` : ""}
          <div class="audio-player">
            <div class="play-btn" onclick="toggleAudio(this)">▶</div>
            <div class="audio-info">
              <div style="font-size:13px;color:var(--text-light);">听力音频</div>
              <div style="font-size:11px;color:var(--text-lighter);">模拟播放</div>
            </div>
            <div class="audio-speed">
              <button onclick="event.stopPropagation();showToast('0.75x 倍速')">0.75x</button>
              <button class="active" onclick="event.stopPropagation();showToast('1x 倍速')">1x</button>
              <button onclick="event.stopPropagation();showToast('1.25x 倍速')">1.25x</button>
            </div>
          </div>
          ${q.questions.map((question, qii) => {
            const qNum = `${si}-${qi}-${qii}`;
            const selected = state.answers["listen_" + qNum];
            return `
              <div class="choice-question">
                <div class="q-text">${rxWrapSentencesEn(question.q)}</div>
                ${question.options.map(opt => {
                  const letter = opt.charAt(0);
                  const text = opt.slice(3);
                  return `
                    <div class="choice-option ${selected === letter ? "selected" : ""}" onclick="selectChoice('listen_${qNum}', '${letter}', this)">
                      <span class="option-letter">${letter}</span>
                      <span class="option-text">${rxWrapPhraseEn(text)}</span>
                    </div>
                  `;
                }).join("")}
              </div>
            `;
          }).join("")}
        `).join("")}
      </div>
    `).join("");
    nav.innerHTML = `<span style="font-size:14px;color:var(--text-light);">听力部分 · ${ds.isIELTS ? "约 30 分钟（+10 分钟转涂）" : "建议约 30 分钟"}</span>`;
  } else if (section === "reading") {
    content.innerHTML = ds.questions.reading.sections.map((sec, si) => {
      if (sec.wordBank) {
        return `
          <div class="question-panel">
            <div class="q-direction"><strong>${sec.type}</strong><br>${rxWrapSentencesEn(sec.direction)}</div>
            <div class="reading-passage">${rxWrapClozePassage(sec.passage, si)}</div>
            <div style="font-size:14px;font-weight:600;margin-bottom:12px;">Word Bank:</div>
            <div class="word-bank" id="wordBank_${si}">
              ${sec.wordBank.map((w, i) => `
                <div class="word-bank-item ${state.wordBankUsed[si + "_" + i] ? "used" : ""}" data-word="${w}" data-bank-idx="${i}" onclick="selectWordBank('${w}', ${si}, ${i}, this)">
                  ${rxWrapPhraseEn(w)} (${String.fromCharCode(65 + i)})
                </div>
              `).join("")}
            </div>
          </div>
        `;
      } else if (sec.statements) {
        const letters = sec.options || ["A", "B", "C", "D", "E"];
        return `
          <div class="question-panel">
            <div class="q-direction"><strong>${sec.type}</strong><br>${rxWrapSentencesEn(sec.direction)}</div>
            ${sec.paragraphs.map(p => `<div class="reading-passage"><strong>${p.split(".")[0]}.</strong> ${rxWrapSentencesEn(p.split(". ").slice(1).join(". "))}</div>`).join("")}
            <div style="margin-top:16px;">
              ${sec.statements.map(s => `
                <div class="choice-question">
                  <div class="q-text">${s.id.replace("s","")}. ${rxWrapSentencesEn(s.text)}</div>
                  <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    ${letters.map(letter => `
                      <div class="choice-option ${state.answers["match_" + s.id] === letter ? "selected" : ""}" style="flex:0 0 auto;padding:8px 16px;" onclick="selectChoice('match_${s.id}', '${letter}', this)">
                        <span class="option-letter">${letter}</span>
                      </div>
                    `).join("")}
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        `;
      } else {
        return `
          <div class="question-panel">
            <div class="q-direction"><strong>${sec.type}</strong><br>${rxWrapSentencesEn(sec.direction)}</div>
            ${sec.passages.map((p, pi) => `
              <div class="reading-passage">${rxWrapParagraph(p.content)}</div>
              ${p.questions.map(question => {
                const qKey = "read_" + si + "_" + pi + "_" + question.q.split(".")[0];
                const selected = state.answers[qKey];
                return `
                  <div class="choice-question">
                    <div class="q-text">${rxWrapSentencesEn(question.q)}</div>
                    ${question.options.map(opt => {
                      const letter = opt.charAt(0);
                      const text = opt.slice(3);
                      return `
                        <div class="choice-option ${selected === letter ? "selected" : ""}" onclick="selectChoice('${qKey}', '${letter}', this)">
                          <span class="option-letter">${letter}</span>
                          <span class="option-text">${rxWrapPhraseEn(text)}</span>
                        </div>
                      `;
                    }).join("")}
                  </div>
                `;
              }).join("")}
            `).join("")}
          </div>
        `;
      }
    }).join("");
    nav.innerHTML = `<span style="font-size:14px;color:var(--text-light);">阅读部分 · ${ds.isIELTS ? "60 分钟，共三篇文章" : "建议约 40 分钟"}</span>`;
  } else if (section === "speaking") {
    const sp = ds.questions.speaking;
    content.innerHTML = `
      <div class="question-panel">
        <div class="q-direction"><strong>Part 1 — Introduction &amp; Interview（4–5 分钟）</strong></div>
        ${sp.part1.map(q => `
          <div class="choice-question">
            <div class="q-text">${rxWrapSentencesEn(q.q)}</div>
            <div class="audio-player" style="margin:8px 0;">
              <div class="play-btn" onclick="toggleRecording(this)">🎤</div>
              <div class="audio-info">
                <div style="font-size:13px;color:var(--text-light);">点击开始录音（演示）</div>
                <div style="font-size:11px;color:var(--text-lighter);">回答时长建议 20–30 秒</div>
              </div>
              <div class="passage-toggle" style="margin-left:auto;cursor:pointer;" onclick="this.classList.toggle('collapsed');this.nextElementSibling.classList.toggle('collapsed')">📄 参考答案</div>
            </div>
            <div class="passage-text collapsed">${rxWrapSentencesEn(q.sample)}</div>
          </div>
        `).join("")}
      </div>
      <div class="question-panel">
        <div class="q-direction"><strong>Part 2 — Long Turn（3–4 分钟）</strong></div>
        <div class="reading-passage" style="background:var(--accent-light);font-size:16px;line-height:2;">
          <strong>Topic Card:</strong> ${rxWrapPhraseEn(sp.part2.topic)}
          <ul style="margin:12px 0 0 20px;">
            ${sp.part2.cues.map(c => `<li style="margin-bottom:6px;">You should say: ${rxWrapPhraseEn(c)}</li>`).join("")}
          </ul>
        </div>
        <div class="audio-player" style="margin:12px 0;">
          <div class="play-btn" onclick="toggleRecording(this)">🎤</div>
          <div class="audio-info">
            <div style="font-size:13px;color:var(--text-light);">1 分钟准备 + 独白 2 分钟（演示）</div>
            <div style="font-size:11px;color:var(--text-lighter);">可先打草稿，再开始录音</div>
          </div>
          <div class="passage-toggle" style="margin-left:auto;cursor:pointer;" onclick="this.classList.toggle('collapsed');this.nextElementSibling.classList.toggle('collapsed')">📄 参考答案</div>
        </div>
        <div class="passage-text collapsed">${rxWrapSentencesEn(sp.part2.sample)}</div>
        <textarea class="answer-textarea" id="speakingNotes" placeholder="📝 Part 2 草稿区：快速记下要点关键词..." oninput="state.answers.speakingNotes = this.value" style="min-height:120px;">${state.answers.speakingNotes || ""}</textarea>
      </div>
      <div class="question-panel">
        <div class="q-direction"><strong>Part 3 — Discussion（4–5 分钟）</strong></div>
        ${sp.part3.map(q => `
          <div class="choice-question">
            <div class="q-text">${rxWrapSentencesEn(q.q)}</div>
            <div class="audio-player" style="margin:8px 0;">
              <div class="play-btn" onclick="toggleRecording(this)">🎤</div>
              <div class="audio-info">
                <div style="font-size:13px;color:var(--text-light);">点击开始录音（演示）</div>
                <div style="font-size:11px;color:var(--text-lighter);">回答时长建议 40–60 秒</div>
              </div>
              <div class="passage-toggle" style="margin-left:auto;cursor:pointer;" onclick="this.classList.toggle('collapsed');this.nextElementSibling.classList.toggle('collapsed')">📄 参考答案</div>
            </div>
            <div class="passage-text collapsed">${rxWrapSentencesEn(q.sample)}</div>
          </div>
        `).join("")}
      </div>
    `;
    nav.innerHTML = `<span style="font-size:14px;color:var(--text-light);">口语部分 · 全程约 11–14 分钟（录音为演示）</span>`;
  } else if (section === "translation") {
    content.innerHTML = `
      <div class="question-panel">
        <div class="q-direction">${ds.questions.translation.direction}</div>
        <div class="reading-passage" style="background:var(--accent-light);font-size:16px;line-height:2.4;">
          ${ds.questions.translation.source}
        </div>
        <textarea class="answer-textarea" id="translationAnswer" placeholder="在此输入你的翻译..." style="min-height:240px;" oninput="updateCharCount(this)">${state.answers.translation || ""}</textarea>
        <div class="word-count" id="charCount">字数：${(state.answers.translation || "").length}</div>
      </div>
    `;
    nav.innerHTML = `<span style="font-size:14px;color:var(--text-light);">翻译部分 · 建议 30 分钟</span>`;
  }
}

// --- IELTS writing word count ---
function updateIeltsWordCount(textarea, idx) {
  state.answers["ielts_writing_" + idx] = textarea.value;
  const count = textarea.value.trim().split(/\s+/).filter(w => w).length;
  const limit = getDatasets().questions.writing.tasks[idx].wordLimit;
  document.getElementById("ieltsWordCount_" + idx).textContent = `Words: ${count} / ${limit} (at least ${limit})`;
}

// --- Speaking recording mock ---
function toggleRecording(btn) {
  const isRecording = btn.textContent === "⏹";
  btn.textContent = isRecording ? "🎤" : "⏹";
  if (!isRecording) {
    showToast("🎤 录音中（演示）... 再次点击结束");
  } else {
    showToast("录音结束（演示），可展开参考答案对照练习");
  }
}

// 完形填空：空格可点选填词，同时句中每个单词可点、句尾可看句式与朗读
// 注：空格标记形如 "1.___"（数字 + 句点 + 下划线），早期正则漏了句点导致空格点不动；
//     句点还会被误判成句子结束符，因此先用不含句点的占位符保护起来再切句。
const RX_CLOZE_MARK = "\u0002";
function rxWrapClozePassage(passage, si) {
  const marks = [];
  const marked = String(passage || "").replace(/(\d+\.?___)/g, (m, m1) => {
    marks.push(m1);
    return RX_CLOZE_MARK + (marks.length - 1) + RX_CLOZE_MARK;
  });
  const sentences = SYNSentences(marked);
  const markRe = new RegExp(RX_CLOZE_MARK + "(\\d+)" + RX_CLOZE_MARK, "g");
  return sentences.filter(s => s.trim()).map(sentence => {
    const html = rxWrapWords(sentence).replace(markRe, (m, idx) => {
      const num = String(marks[Number(idx)] || "").match(/^(\d+)/)?.[1] || "";
      const val = state.answers[si + "_blank_" + num] || "";
      return `<span class="reading-blank" data-blank="${si}_${num}" onclick="selectBlank(${si}, ${num})" style="cursor:pointer;">${val ? esc(val) : num + ".___"}</span>`;
    });
    // 分析键保留原题空格；实际朗读时由 rxSpeechText 统一转换为 blank。
    const speakText = sentence.replace(markRe, (m, idx) => marks[Number(idx)] || " blank ");
    return `<span class="rx-sentence">${html}${rxSentenceActions(speakText)}</span>`;
  }).join("");
}

function renderClozePassage(passage, si) {
  return rxWrapClozePassage(passage, si);
}

let selectedBlank = null;
function selectBlank(si, num) {
  selectedBlank = { si, num };
  showToast("请从下方 Word Bank 选择单词");
}

function selectWordBank(word, si, idx, el) {
  if (el.classList.contains("used")) return;
  if (selectedBlank) {
    state.answers[selectedBlank.si + "_blank_" + selectedBlank.num] = word;
    state.wordBankUsed[si + "_" + idx] = true;
    el.classList.add("used");
    selectedBlank = null;
    switchSection("reading");
  } else {
    showToast("请先点击文章中的空格");
  }
}

// --- Answer selection ---
function selectChoice(key, letter, el) {
  state.answers[key] = letter;
  const container = el.parentElement;
  container.querySelectorAll(".choice-option").forEach(o => o.classList.remove("selected"));
  el.classList.add("selected");
}

// --- Audio toggle ---
function toggleAudio(btn) {
  const isPlaying = btn.textContent === "⏸";
  btn.textContent = isPlaying ? "▶" : "⏸";
  if (!isPlaying) {
    setTimeout(() => { btn.textContent = "▶"; showToast("模拟音频播放结束"); }, 2000);
  }
}

// --- Word count ---
function updateWordCount(textarea) {
  state.answers.writing = textarea.value;
  const count = textarea.value.trim().split(/\s+/).filter(w => w).length;
  document.getElementById("wordCount").textContent = `字数：${count} / ${getDatasets().questions.writing.wordLimit}`;
}
function updateCharCount(textarea) {
  state.answers.translation = textarea.value;
  document.getElementById("charCount").textContent = `字数：${textarea.value.length}`;
}

// --- Submit exam ---
function submitExam() {
  if (!confirm("确定要交卷吗？交卷后将无法修改答案。")) return;
  if (state.timer) clearInterval(state.timer);

  const ds = getDatasets();

  // Save writing/translation answers
  const writingEl = document.getElementById("writingAnswer");
  if (writingEl) state.answers.writing = writingEl.value;
  const transEl = document.getElementById("translationAnswer");
  if (transEl) state.answers.translation = transEl.value;
  // IELTS writing tasks
  if (ds.questions.writing.tasks) {
    ds.questions.writing.tasks.forEach((t, i) => {
      const el = document.getElementById("ieltsWriting_" + i);
      if (el) state.answers["ielts_writing_" + i] = el.value;
    });
  }

  // 同一份逐题列表用于统计和解析，包含选词填空。
  const reviewItems = AnswerReview.legacy(ds.questions, state.answers);
  const total = reviewItems.length;
  const correct = reviewItems.filter(it => it.a && String(it.a) === String(it.q.correctAnswer)).length;
  const unanswered = reviewItems.filter(it => !it.a).length;
  const wrong = total - correct - unanswered;

  const backRoute = `/app/course/${state.currentCourse}/exams`;
  let resultHTML = "";

  if (ds.isIELTS) {
    // Band score estimate
    const band = Math.round((correct / total) * 9 * 2) / 2;
    resultHTML = `
        <div class="result-score">${band.toFixed(1)}</div>
        <div class="result-label">预估 Band 分 / 满分 9.0（听力 + 阅读客观题估算）</div>
    `;
  } else {
    const score = Math.round((correct / total) * 710);
    resultHTML = `
        <div class="result-score">${score}</div>
        <div class="result-label">分 / 满分 710 分</div>
    `;
  }

  // Writing display
  let writingHTML = "";
  if (ds.isIELTS) {
    writingHTML = ds.questions.writing.tasks.map((t, i) => {
      const ans = state.answers["ielts_writing_" + i];
      if (!ans) return "";
      const wc = ans.trim().split(/\s+/).filter(w => w).length;
      return `
        <div class="question-panel" style="text-align:left;margin-bottom:24px;">
          <h3 style="margin-bottom:16px;">✍️ 你的 ${t.label}（${t.topic}）</h3>
          <div style="font-size:14px;line-height:1.8;color:var(--text);white-space:pre-wrap;">${ans}</div>
          <div style="margin-top:16px;padding:16px;background:var(--bg);border-radius:var(--radius-sm);border-left:4px solid var(--primary);">
            <strong>🤖 AI 评析：</strong>
            <p style="font-size:13px;color:var(--text-light);margin-top:8px;">字数 ${wc} 词，${wc >= t.wordLimit ? "达到" : "未达到"} ${t.label} 最低要求（${t.wordLimit} 词）。${wc < t.wordLimit ? "建议补充细节与数据对比，凑足字数。" : "结构清晰，注意 Task Achievement（任务完成度）与 Cohesion（衔接）两个评分维度的平衡。"}</p>
          </div>
        </div>
      `;
    }).join("");
  } else if (state.answers.writing) {
    writingHTML = `
        <div class="question-panel" style="text-align:left;margin-bottom:24px;">
          <h3 style="margin-bottom:16px;">✍️ 你的作文</h3>
          <div style="font-size:14px;line-height:1.8;color:var(--text);white-space:pre-wrap;">${state.answers.writing}</div>
          <div style="margin-top:16px;padding:16px;background:var(--bg);border-radius:var(--radius-sm);border-left:4px solid var(--primary);">
            <strong>🤖 AI 评析：</strong>
            <p style="font-size:13px;color:var(--text-light);margin-top:8px;">本文结构清晰，论点明确。建议注意学术词汇的使用和句式多样性。字数：${state.answers.writing.trim().split(/\s+/).filter(w=>w).length} 词，${state.answers.writing.trim().split(/\s+/).filter(w=>w).length >= 150 ? "字数达标。" : "字数不足，建议补充至 150 词以上。"}</p>
          </div>
        </div>
      `;
  }

  // Translation / Speaking display
  let extraHTML = "";
  if (ds.isIELTS) {
    extraHTML = `
        <div class="question-panel" style="text-align:left;margin-bottom:24px;">
          <h3 style="margin-bottom:16px;">🗣️ 口语自评</h3>
          <p style="font-size:14px;color:var(--text-light);line-height:1.8;">口语部分为录音演示，请对照各题「参考答案」按雅思评分四维度自评：<b>Fluency &amp; Coherence</b>（流利度与连贯性）、<b>Lexical Resource</b>（词汇资源）、<b>Grammatical Range &amp; Accuracy</b>（语法多样性）、<b>Pronunciation</b>（发音）。建议回听自己的录音，标注停顿与重复次数。</p>
        </div>
      `;
  } else if (state.answers.translation) {
    extraHTML = `
        <div class="question-panel" style="text-align:left;margin-bottom:24px;">
          <h3 style="margin-bottom:16px;">🌏 你的翻译</h3>
          <div style="font-size:14px;line-height:1.8;color:var(--text);white-space:pre-wrap;">${state.answers.translation}</div>
          <div style="margin-top:16px;padding:16px;background:var(--accent-light);border-radius:var(--radius-sm);">
            <strong>📌 参考译文：</strong>
            <p style="font-size:13px;color:var(--text-light);margin-top:8px;line-height:1.8;">${ds.questions.translation.referenceTranslation}</p>
          </div>
        </div>
      `;
  }

  // Show results
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="practice-page">
      <div class="container">
        <div class="result-page">
          ${resultHTML}
          <div class="result-detail">
            <div class="result-item">
              <div class="label">答对</div>
              <div class="value correct">${correct}</div>
            </div>
            <div class="result-item">
              <div class="label">答错</div>
              <div class="value wrong">${wrong}</div>
            </div>
            <div class="result-item">
              <div class="label">未答</div>
              <div class="value">${unanswered}</div>
            </div>
            <div class="result-item">
              <div class="label">总题数</div>
              <div class="value">${total}</div>
            </div>
          </div>
          ${writingHTML}
          ${extraHTML}
          <div class="question-panel rx-result-panel">
            <h3>🔎 全部题目答案与详解</h3>
            <p class="rx-report-tip">共 ${total} 道客观题。可查看原文，使用AI 服务 翻译整句、解释选项或追问。</p>
            ${rxAllListHTML(reviewItems)}
          </div>
          <div style="display:flex;gap:12px;justify-content:center;">
            <button class="btn btn-primary" onclick="route('${backRoute}')">返回真题列表</button>
            <button class="btn btn-outline" onclick="route('${backRoute}')">再做一套</button>
          </div>
        </div>
      </div>
    </div>
  `;
  state.examMode = false;
}

// --- Helper: find exam ---
function findExam(id) {
  for (const dataset of [examData, ieltsExamData]) {
    for (const period of dataset) {
      const exam = period.exams.find(e => e.id === id);
      if (exam) return exam;
    }
  }
  return null;
}

// --- Question type switching ---
function switchQType(type) {
  const ds = getDatasets();
  document.querySelectorAll(".qtype-tab").forEach(t => {
    t.classList.toggle("active", t.dataset.type === type);
  });

  const groups = type === "全部"
    ? ds.qTypes.flatMap(t => t.groups.map(g => ({...g, icon: t.icon})))
    : ds.qTypes.find(t => t.category === type)?.groups.map(g => ({...g, icon: ds.qTypes.find(t => t.category === type).icon})) || [];

  document.getElementById("qtypeGroups").innerHTML = groups.map(g => `
    <div class="qtype-card" onclick="showToast('开始练习：${g.title}')">
      <div class="card-header">
        <div class="icon">${g.icon}</div>
        <div class="title">${g.title}</div>
      </div>
      <div class="count">${g.count} 组题目</div>
      <div class="start-btn">开始练习</div>
    </div>
  `).join("");
}

// --- Vocabulary functions ---
function toggleStar(word, el) {
  const key = "star_" + word;
  state.answers[key] = !state.answers[key];
  el.classList.toggle("active");
  showToast(state.answers[key] ? "已收藏到生词本" : "已从生词本移除");
}

function speakWord(word) {
  if ("speechSynthesis" in window) {
    const utt = new SpeechSynthesisUtterance(word);
    const accent = RX.pron.accent || "en-GB";
    utt.lang = accent;
    utt.rate = 0.9;
    const voice = rxPickVoice(accent, RX.pron.voiceName);
    if (voice) { utt.voice = voice; utt.lang = voice.lang || accent; }
    speechSynthesis.speak(utt);
  }
}

function searchVocab(query) {
  let words = [...getVocab()];
  if (query) {
    words = words.filter(w =>
      w.word.toLowerCase().includes(query.toLowerCase()) ||
      w.meaning.includes(query)
    );
  }
  document.getElementById("vocabList").innerHTML = words.slice(0, 20).map(w => `
    <div class="word-card ${w.learned ? "learned" : ""}" data-word="${w.word}">
      <div class="word-main">
        <div class="word-head">
          <span class="word-text">${w.word}</span>
          <span class="phonetic">${w.phonetic}</span>
        </div>
        <div class="meaning">${w.meaning}</div>
        <div class="example">${w.example}</div>
      </div>
      <div class="word-actions">
        <span class="star-btn ${state.answers["star_" + w.word] ? "active" : ""}" onclick="toggleStar('${w.word}', this)">★</span>
        <span class="speak-btn" onclick="speakWord('${w.word}')">🔊</span>
      </div>
    </div>
  `).join("");
}

// --- Typing training ---
function startTyping() {
  state.typingIndex = 0;
  state.typingCorrect = 0;
  state.typingTotal = 0;
  state.typingStartTime = Date.now();
  document.getElementById("typingStartBtn").textContent = "重新开始";
  document.getElementById("typingInput").disabled = false;
  document.getElementById("typingInput").focus();
  showTypingWord();
}

function showTypingWord() {
  const vocab = getVocab();
  if (state.typingIndex >= vocab.length) {
    document.getElementById("typingWord").textContent = "🎉 完成！";
    document.getElementById("typingPhonetic").textContent = `准确率：${state.typingTotal > 0 ? Math.round(state.typingCorrect/state.typingTotal*100) : 0}%`;
    document.getElementById("typingMeaning").textContent = `WPM：${calculateWPM()}`;
    document.getElementById("typingInput").disabled = true;
    return;
  }
  const word = vocab[state.typingIndex];
  document.getElementById("typingWord").textContent = word.word;
  document.getElementById("typingPhonetic").textContent = word.phonetic;
  document.getElementById("typingMeaning").textContent = word.meaning;
  document.getElementById("typingInput").value = "";
  document.getElementById("typingInput").classList.remove("correct", "wrong");
  document.getElementById("typingProgress").textContent = `${state.typingIndex + 1}/${vocab.length}`;
  // Auto speak
  speakWord(word.word);
}

function checkTyping(value) {
  const word = getVocab()[state.typingIndex];
  const input = document.getElementById("typingInput");
  if (value === word.word) {
    input.classList.add("correct");
    input.classList.remove("wrong");
  } else if (word.word.startsWith(value)) {
    input.classList.remove("correct", "wrong");
  } else {
    input.classList.add("wrong");
    input.classList.remove("correct");
  }
}

function handleTypingKey(e) {
  if (e.key === "Enter") {
    const value = e.target.value.trim();
    const word = getVocab()[state.typingIndex];
    state.typingTotal++;
    if (value === word.word) {
      state.typingCorrect++;
      showToast("✓ 正确！");
    } else {
      showToast(`✗ 正确答案：${word.word}`);
    }
    state.typingIndex++;
    updateTypingStats();
    showTypingWord();
  }
}

function calculateWPM() {
  if (!state.typingStartTime) return 0;
  const minutes = (Date.now() - state.typingStartTime) / 60000;
  if (minutes <= 0) return 0;
  return Math.round(state.typingCorrect / minutes);
}

function updateTypingStats() {
  const vocab = getVocab();
  document.getElementById("typingWPM").textContent = calculateWPM();
  document.getElementById("typingAccuracy").textContent = `${state.typingTotal > 0 ? Math.round(state.typingCorrect/state.typingTotal*100) : 0}%`;
  document.getElementById("typingProgress").textContent = `${state.typingIndex + 1}/${vocab.length}`;
}

function speakCurrentWord() {
  const vocab = getVocab();
  if (state.typingIndex < vocab.length) {
    speakWord(vocab[state.typingIndex].word);
  }
}

function skipWord() {
  state.typingIndex++;
  showTypingWord();
}

// --- Flashcard functions ---
function flipCard() {
  document.getElementById("flashcard").classList.toggle("flipped");
}

function nextCard() {
  state.flashcardIndex++;
  if (state.flashcardIndex >= window._flashcardWords.length) state.flashcardIndex = 0;
  document.getElementById("flashcard").classList.remove("flipped");
  window._renderFlashcard();
}

function prevCard() {
  state.flashcardIndex--;
  if (state.flashcardIndex < 0) state.flashcardIndex = window._flashcardWords.length - 1;
  document.getElementById("flashcard").classList.remove("flipped");
  window._renderFlashcard();
}

function markLearned() {
  const word = window._flashcardWords[state.flashcardIndex];
  word.learned = true;
  showToast(`✓ "${word.word}" 已标记为掌握`);
  nextCard();
}

// --- Mock exam config ---
function selectConfig(el) {
  const siblings = el.parentElement.querySelectorAll(".config-option");
  siblings.forEach(s => s.classList.remove("active"));
  el.classList.add("active");
}

function toggleConfig(el) {
  el.classList.toggle("active");
}

function generateMockExam() {
  const selected = document.querySelectorAll(".config-option.active");
  const types = Array.from(selected).filter(s => ["写作","听力","阅读","翻译","口语"].some(k => s.textContent.includes(k)));
  if (types.length === 0) {
    showToast("请至少选择一种题型");
    return;
  }
  showToast("🎯 AI 正在组卷中...");
  setTimeout(() => {
    showToast("✅ 模拟卷生成完成！即将开始...");
    setTimeout(() => route("/practice/mock-" + Date.now()), 800);
  }, 1500);
}

// --- Toast ---
function showToast(msg) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
}

// --- Modal ---
function showModal(title, body, actions) {
  let overlay = document.querySelector(".modal-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div class="modal">
      <h2>${title}</h2>
      <p>${body}</p>
      <div class="modal-actions">${actions || '<button class="btn btn-primary btn-block" onclick="closeModal()">确定</button>'}</div>
    </div>
  `;
  overlay.classList.add("active");
}

function closeModal() {
  document.querySelector(".modal-overlay")?.classList.remove("active");
}

// --- Nav active ---
function updateNavActive() {
  const path = getRoute();
  document.querySelectorAll(".nav-item").forEach(item => {
    const target = item.dataset.route || "";
    if (target && path.startsWith(target)) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

// --- Header scroll effect ---
window.addEventListener("scroll", () => {
  const header = document.querySelector(".site-header");
  if (header) header.classList.toggle("scrolled", window.scrollY > 0);
});

// --- Init ---
window.addEventListener("hashchange", handleRoute);
window.addEventListener("DOMContentLoaded", handleRoute);
