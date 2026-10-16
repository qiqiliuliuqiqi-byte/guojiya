// ============================================================
// data.js - Mock data for the CET exam practice platform
// ============================================================

// --- Exam papers data ---
const examData = [
  {
    period: "2026上半年",
    exams: [
      { id: "cet6-202606-1", title: "CET6 2026年06月 第1套", year: 2026, month: 6, set: 1, isLatest: true },
      { id: "cet6-202606-2", title: "CET6 2026年06月 第2套", year: 2026, month: 6, set: 2, isLatest: true },
      { id: "cet6-202606-3", title: "CET6 2026年06月 第3套", year: 2026, month: 6, set: 3, isLatest: true },
    ]
  },
  {
    period: "2025下半年",
    exams: [
      { id: "cet6-202512-1", title: "CET6 2025年12月 第1套", year: 2025, month: 12, set: 1, isLatest: false },
      { id: "cet6-202512-2", title: "CET6 2025年12月 第2套", year: 2025, month: 12, set: 2, isLatest: false },
      { id: "cet6-202512-3", title: "CET6 2025年12月 第3套", year: 2025, month: 12, set: 3, isLatest: false },
    ]
  },
  {
    period: "2025上半年",
    exams: [
      { id: "cet6-202506-1", title: "CET6 2025年06月 第1套", year: 2025, month: 6, set: 1, isLatest: false },
      { id: "cet6-202506-2", title: "CET6 2025年06月 第2套", year: 2025, month: 6, set: 2, isLatest: false },
      { id: "cet6-202506-3", title: "CET6 2025年06月 第3套", year: 2025, month: 6, set: 3, isLatest: false },
    ]
  },
  {
    period: "2024下半年",
    exams: [
      { id: "cet6-202412-1", title: "CET6 2024年12月 第1套", year: 2024, month: 12, set: 1, isLatest: false },
      { id: "cet6-202412-2", title: "CET6 2024年12月 第2套", year: 2024, month: 12, set: 2, isLatest: false },
      { id: "cet6-202412-3", title: "CET6 2024年12月 第3套", year: 2024, month: 12, set: 3, isLatest: false },
    ]
  },
  {
    period: "2024上半年",
    exams: [
      { id: "cet6-202406-1", title: "CET6 2024年06月 第1套", year: 2024, month: 6, set: 1, isLatest: false },
      { id: "cet6-202406-2", title: "CET6 2024年06月 第2套", year: 2024, month: 6, set: 2, isLatest: false },
      { id: "cet6-202406-3", title: "CET6 2024年06月 第3套", year: 2024, month: 6, set: 3, isLatest: false },
    ]
  },
  {
    period: "2023下半年",
    exams: [
      { id: "cet6-202312-1", title: "CET6 2023年12月 第1套", year: 2023, month: 12, set: 1, isLatest: false },
      { id: "cet6-202312-2", title: "CET6 2023年12月 第2套", year: 2023, month: 12, set: 2, isLatest: false },
      { id: "cet6-202312-3", title: "CET6 2023年12月 第3套", year: 2023, month: 12, set: 3, isLatest: false },
    ]
  },
  {
    period: "2023上半年",
    exams: [
      { id: "cet6-202306-1", title: "CET6 2023年06月 第1套", year: 2023, month: 6, set: 1, isLatest: false },
      { id: "cet6-202306-2", title: "CET6 2023年06月 第2套", year: 2023, month: 6, set: 2, isLatest: false },
      { id: "cet6-202306-3", title: "CET6 2023年06月 第3套", year: 2023, month: 6, set: 3, isLatest: false },
      { id: "cet6-202303-1", title: "CET6 2023年03月 第1套", year: 2023, month: 3, set: 1, isLatest: false },
    ]
  },
  {
    period: "2022下半年",
    exams: [
      { id: "cet6-202212-1", title: "CET6 2022年12月 第1套", year: 2022, month: 12, set: 1, isLatest: false },
      { id: "cet6-202212-2", title: "CET6 2022年12月 第2套", year: 2022, month: 12, set: 2, isLatest: false },
      { id: "cet6-202212-3", title: "CET6 2022年12月 第3套", year: 2022, month: 12, set: 3, isLatest: false },
      { id: "cet6-202209-1", title: "CET6 2022年09月 第1套", year: 2022, month: 9, set: 1, isLatest: false },
    ]
  },
  {
    period: "2022上半年",
    exams: [
      { id: "cet6-202206-1", title: "CET6 2022年06月 第1套", year: 2022, month: 6, set: 1, isLatest: false },
      { id: "cet6-202206-2", title: "CET6 2022年06月 第2套", year: 2022, month: 6, set: 2, isLatest: false },
      { id: "cet6-202206-3", title: "CET6 2022年06月 第3套", year: 2022, month: 6, set: 3, isLatest: false },
    ]
  },
  {
    period: "2021下半年",
    exams: [
      { id: "cet6-202112-1", title: "CET6 2021年12月 第1套", year: 2021, month: 12, set: 1, isLatest: false },
      { id: "cet6-202112-2", title: "CET6 2021年12月 第2套", year: 2021, month: 12, set: 2, isLatest: false },
      { id: "cet6-202112-3", title: "CET6 2021年12月 第3套", year: 2021, month: 12, set: 3, isLatest: false },
    ]
  },
  {
    period: "2021上半年",
    exams: [
      { id: "cet6-202106-1", title: "CET6 2021年06月 第1套", year: 2021, month: 6, set: 1, isLatest: false },
      { id: "cet6-202106-2", title: "CET6 2021年06月 第2套", year: 2021, month: 6, set: 2, isLatest: false },
      { id: "cet6-202106-3", title: "CET6 2021年06月 第3套", year: 2021, month: 6, set: 3, isLatest: false },
    ]
  },
  {
    period: "2020下半年",
    exams: [
      { id: "cet6-202012-1", title: "CET6 2020年12月 第1套", year: 2020, month: 12, set: 1, isLatest: false },
      { id: "cet6-202012-2", title: "CET6 2020年12月 第2套", year: 2020, month: 12, set: 2, isLatest: false },
      { id: "cet6-202012-3", title: "CET6 2020年12月 第3套", year: 2020, month: 12, set: 3, isLatest: false },
      { id: "cet6-202009-1", title: "CET6 2020年09月 第1套", year: 2020, month: 9, set: 1, isLatest: false },
      { id: "cet6-202009-2", title: "CET6 2020年09月 第2套", year: 2020, month: 9, set: 2, isLatest: false },
      { id: "cet6-202007-1", title: "CET6 2020年07月 第1套", year: 2020, month: 7, set: 1, isLatest: false },
    ]
  },
  {
    period: "2019下半年",
    exams: [
      { id: "cet6-201912-1", title: "CET6 2019年12月 第1套", year: 2019, month: 12, set: 1, isLatest: false },
      { id: "cet6-201912-2", title: "CET6 2019年12月 第2套", year: 2019, month: 12, set: 2, isLatest: false },
      { id: "cet6-201912-3", title: "CET6 2019年12月 第3套", year: 2019, month: 12, set: 3, isLatest: false },
    ]
  },
  {
    period: "2019上半年",
    exams: [
      { id: "cet6-201906-2", title: "CET6 2019年06月 第2套", year: 2019, month: 6, set: 2, isLatest: false },
      { id: "cet6-201906-3", title: "CET6 2019年06月 第3套", year: 2019, month: 6, set: 3, isLatest: false },
    ]
  },
  {
    period: "2018下半年",
    exams: [
      { id: "cet6-201812-1", title: "CET6 2018年12月 第1套", year: 2018, month: 12, set: 1, isLatest: false },
      { id: "cet6-201812-2", title: "CET6 2018年12月 第2套", year: 2018, month: 12, set: 2, isLatest: false },
      { id: "cet6-201812-3", title: "CET6 2018年12月 第3套", year: 2018, month: 12, set: 3, isLatest: false },
    ]
  },
  {
    period: "2018上半年",
    exams: [
      { id: "cet6-201806-1", title: "CET6 2018年06月 第1套", year: 2018, month: 6, set: 1, isLatest: false },
      { id: "cet6-201806-2", title: "CET6 2018年06月 第2套", year: 2018, month: 6, set: 2, isLatest: false },
      { id: "cet6-201806-3", title: "CET6 2018年06月 第3套", year: 2018, month: 6, set: 3, isLatest: false },
    ]
  },
  {
    period: "2017下半年",
    exams: [
      { id: "cet6-201712-1", title: "CET6 2017年12月 第1套", year: 2017, month: 12, set: 1, isLatest: false },
      { id: "cet6-201712-2", title: "CET6 2017年12月 第2套", year: 2017, month: 12, set: 2, isLatest: false },
      { id: "cet6-201712-3", title: "CET6 2017年12月 第3套", year: 2017, month: 12, set: 3, isLatest: false },
    ]
  },
  {
    period: "2017上半年",
    exams: [
      { id: "cet6-201706-1", title: "CET6 2017年06月 第1套", year: 2017, month: 6, set: 1, isLatest: false },
      { id: "cet6-201706-2", title: "CET6 2017年06月 第2套", year: 2017, month: 6, set: 2, isLatest: false },
      { id: "cet6-201706-3", title: "CET6 2017年06月 第3套", year: 2017, month: 6, set: 3, isLatest: false },
    ]
  },
  {
    period: "2016下半年",
    exams: [
      { id: "cet6-201612-2", title: "CET6 2016年12月 第2套", year: 2016, month: 12, set: 2, isLatest: false },
      { id: "cet6-201612-3", title: "CET6 2016年12月 第3套", year: 2016, month: 12, set: 3, isLatest: false },
    ]
  },
  {
    period: "2016上半年",
    exams: [
      { id: "cet6-201606-1", title: "CET6 2016年06月 第1套", year: 2016, month: 6, set: 1, isLatest: false },
      { id: "cet6-201606-2", title: "CET6 2016年06月 第2套", year: 2016, month: 6, set: 2, isLatest: false },
      { id: "cet6-201606-3", title: "CET6 2016年06月 第3套", year: 2016, month: 6, set: 3, isLatest: false },
    ]
  },
];

// --- Course data ---
const courseData = [
  {
    id: "cet6_strategy",
    title: "CET6 考场策略",
    desc: "三节课讲清六级考试规则、题型分布与分值（含与四级的差异）、130 分钟时间规划，以及四大题型的核心备考技巧，帮你建立分值导向的应试体系。",
    lessons: 4,
    icon: "🎯",
    color: "#3b82f6",
    lessonList: [
      { title: "六级考试规则与题型分布", duration: "15 min", free: true },
      { title: "分值计算与四级差异对比", duration: "12 min", free: true },
      { title: "130分钟考场时间规划", duration: "18 min", free: false },
      { title: "四大题型核心备考技巧", duration: "20 min", free: false },
    ]
  },
  {
    id: "cet6_listening",
    title: "CET6 听力专项",
    desc: "针对六级语速与学术词汇，从语音节奏到讲座专项分阶段训练，最后 30 分钟整套限时收尾。",
    lessons: 6,
    icon: "🎧",
    color: "#8b5cf6",
    lessonList: [
      { title: "六级听力语速与节奏适应", duration: "20 min", free: true },
      { title: "学术词汇高频音变规律", duration: "18 min", free: true },
      { title: "长对话题型解题路径", duration: "22 min", free: false },
      { title: "听力篇章信息定位法", duration: "25 min", free: false },
      { title: "讲座讲话题专项突破", duration: "28 min", free: false },
      { title: "30分钟整套限时训练", duration: "30 min", free: false },
    ]
  },
  {
    id: "cet6_reading",
    title: "CET6 阅读专项",
    desc: "四题型逐项训练，针对性强化六级特有的学术词汇与长句嵌套，最后 40 分钟整套限时收尾。",
    lessons: 6,
    icon: "📖",
    color: "#06b6d4",
    lessonList: [
      { title: "选词填空词性预判法", duration: "20 min", free: true },
      { title: "长篇阅读段落匹配技巧", duration: "25 min", free: true },
      { title: "仔细阅读题型分类", duration: "22 min", free: false },
      { title: "长难句结构拆解训练", duration: "28 min", free: false },
      { title: "学术词汇语境推断法", duration: "20 min", free: false },
      { title: "40分钟整套限时训练", duration: "40 min", free: false },
    ]
  },
  {
    id: "cet6_writing",
    title: "CET6 写作专项",
    desc: "议论文五步推进、词汇全面学术化，配套图表说明文与书信专题，整篇目标 180 词以上。",
    lessons: 8,
    icon: "✍️",
    color: "#f59e0b",
    lessonList: [
      { title: "议论文五步写作法", duration: "25 min", free: true },
      { title: "学术词汇替换进阶", duration: "20 min", free: true },
      { title: "图表作文数据分析框架", duration: "22 min", free: false },
      { title: "书信文体格式规范", duration: "18 min", free: false },
      { title: "开头段黄金句型", duration: "15 min", free: false },
      { title: "论证段展开逻辑", duration: "20 min", free: false },
      { title: "结尾段升华技巧", duration: "15 min", free: false },
      { title: "180词整篇实战训练", duration: "30 min", free: false },
    ]
  },
  {
    id: "cet6_translation",
    title: "CET6 翻译专项",
    desc: "学术高频词入手，依次训练句式转换与段落分句，最终独立完成约 180 字整段翻译。",
    lessons: 6,
    icon: "🌏",
    color: "#10b981",
    lessonList: [
      { title: "学术高频翻译词汇", duration: "20 min", free: true },
      { title: "中英句式差异对比", duration: "18 min", free: true },
      { title: "主动转被动句式转换", duration: "22 min", free: false },
      { title: "长句拆分与合并技巧", duration: "25 min", free: false },
      { title: "段落翻译逻辑重构", duration: "28 min", free: false },
      { title: "180字整段翻译实战", duration: "30 min", free: false },
    ]
  },
  {
    id: "cet6_grammar",
    title: "CET6 核心语法精讲",
    desc: "7个单元系统覆盖四六级语法体系：从词性句子成分、时态语态、三大从句、非谓语，到强调倒装虚拟与长难句写作运用，夯实读写地基。",
    lessons: 7,
    icon: "📚",
    color: "#ec4899",
    lessonList: [
      { title: "词性与句子成分基础", duration: "25 min", free: true },
      { title: "时态与语态全梳理", duration: "28 min", free: true },
      { title: "三大从句体系精讲", duration: "30 min", free: false },
      { title: "非谓语动词进阶", duration: "25 min", free: false },
      { title: "强调句与倒装句", duration: "20 min", free: false },
      { title: "虚拟语气全场景", duration: "22 min", free: false },
      { title: "长难句写作运用", duration: "28 min", free: false },
    ]
  },
];

// --- Question types data ---
const questionTypeData = [
  {
    category: "写作",
    icon: "✍️",
    color: "#f59e0b",
    groups: [
      { title: "议论文写作", count: 36 },
      { title: "图表作文", count: 34 },
      { title: "书信应用文", count: 32 },
    ]
  },
  {
    category: "听力",
    icon: "🎧",
    color: "#8b5cf6",
    groups: [
      { title: "新闻听力", count: 252 },
      { title: "长对话", count: 168 },
      { title: "听力篇章", count: 252 },
    ]
  },
  {
    category: "阅读",
    icon: "📖",
    color: "#06b6d4",
    groups: [
      { title: "完形填空", count: 101 },
      { title: "段落匹配", count: 101 },
      { title: "阅读理解", count: 202 },
    ]
  },
  {
    category: "翻译",
    icon: "🌏",
    color: "#10b981",
    groups: [
      { title: "段落翻译", count: 102 },
    ]
  },
];

// --- Vocabulary data ---
const vocabularyData = [
  { word: "abundant", phonetic: "/əˈbʌndənt/", meaning: "adj. 丰富的，充裕的", example: "China is abundant in natural resources.", level: 6, learned: false },
  { word: "accommodate", phonetic: "/əˈkɒmədeɪt/", meaning: "v. 容纳；适应；提供住宿", example: "The hotel can accommodate up to 500 guests.", level: 6, learned: false },
  { word: "acquisition", phonetic: "/ˌækwɪˈzɪʃn/", meaning: "n. 获得，习得；收购", example: "The acquisition of language is a complex process.", level: 6, learned: false },
  { word: "adequate", phonetic: "/ˈædɪkwət/", meaning: "adj. 充足的；合格的", example: "We need adequate time to complete the project.", level: 6, learned: false },
  { word: "advocate", phonetic: "/ˈædvəkeɪt/", meaning: "v. 提倡，主张 n. 拥护者", example: "She advocates equal pay for equal work.", level: 6, learned: false },
  { word: "aggressive", phonetic: "/əˈɡresɪv/", meaning: "adj. 侵略性的；积极进取的", example: "He took an aggressive approach to marketing.", level: 6, learned: false },
  { word: "alternative", phonetic: "/ɔːlˈtɜːnətɪv/", meaning: "n. 替代方案 adj. 另类的", example: "We need to find an alternative solution.", level: 6, learned: false },
  { word: "ambiguity", phonetic: "/ˌæmbɪˈɡjuːəti/", meaning: "n. 模糊性；歧义", example: "The ambiguity of the law caused confusion.", level: 6, learned: false },
  { word: "analogy", phonetic: "/əˈnælədʒi/", meaning: "n. 类比，类推", example: "He drew an analogy between the two situations.", level: 6, learned: false },
  { word: "anticipate", phonetic: "/ænˈtɪsɪpeɪt/", meaning: "v. 预期，预料", example: "We anticipate a significant increase in sales.", level: 6, learned: false },
  { word: "arbitrary", phonetic: "/ˈɑːbɪtrəri/", meaning: "adj. 任意的，武断的", example: "The decision seemed arbitrary and unfair.", level: 6, learned: false },
  { word: "assemble", phonetic: "/əˈsembl/", meaning: "v. 集合；组装", example: "Workers assemble cars on the production line.", level: 6, learned: false },
  { word: "attribute", phonetic: "/əˈtrɪbjuːt/", meaning: "v. 归因于 n. 属性", example: "She attributed her success to hard work.", level: 6, learned: false },
  { word: "authentic", phonetic: "/ɔːˈθentɪk/", meaning: "adj. 真正的，可靠的", example: "The painting is an authentic masterpiece.", level: 6, learned: false },
  { word: "benchmark", phonetic: "/ˈbentʃmɑːk/", meaning: "n. 基准，标杆", example: "This company sets the benchmark for quality.", level: 6, learned: false },
  { word: "beneficial", phonetic: "/ˌbenɪˈfɪʃl/", meaning: "adj. 有益的", example: "Regular exercise is beneficial to health.", level: 6, learned: false },
  { word: "boycott", phonetic: "/ˈbɔɪkɒt/", meaning: "v./n. 抵制", example: "Consumers boycotted the company's products.", level: 6, learned: false },
  { word: "breakthrough", phonetic: "/ˈbreɪkθruː/", meaning: "n. 突破", example: "Scientists made a breakthrough in cancer research.", level: 6, learned: false },
  { word: "bureaucracy", phonetic: "/bjʊəˈrɒkrəsi/", meaning: "n. 官僚主义；官僚机构", example: "The project was delayed by bureaucracy.", level: 6, learned: false },
  { word: "catastrophe", phonetic: "/kəˈtæstrəfi/", meaning: "n. 灾难，浩劫", example: "The earthquake was a catastrophe for the region.", level: 6, learned: false },
  { word: "circumstance", phonetic: "/ˈsɜːkəmstəns/", meaning: "n. 情况，环境", example: "Under no circumstances should you give up.", level: 6, learned: false },
  { word: "coincide", phonetic: "/ˌkəʊɪnˈsaɪd/", meaning: "v. 同时发生；一致", example: "Their interests coincide on many issues.", level: 6, learned: false },
  { word: "commemorate", phonetic: "/kəˈmeməreɪt/", meaning: "v. 纪念", example: "The ceremony commemorates the founding of the university.", level: 6, learned: false },
  { word: "compatible", phonetic: "/kəmˈpætəbl/", meaning: "adj. 兼容的；相容的", example: "The software is compatible with all operating systems.", level: 6, learned: false },
  { word: "comprehensive", phonetic: "/ˌkɒmprɪˈhensɪv/", meaning: "adj. 全面的，综合的", example: "The report provides a comprehensive analysis.", level: 6, learned: false },
  { word: "conceive", phonetic: "/kənˈsiːv/", meaning: "v. 构想，设想", example: "It's hard to conceive of a world without the internet.", level: 6, learned: false },
  { word: "consensus", phonetic: "/kənˈsensəs/", meaning: "n. 共识，一致", example: "The committee reached a consensus on the proposal.", level: 6, learned: false },
  { word: "constitute", phonetic: "/ˈkɒnstɪtjuːt/", meaning: "v. 构成，组成", example: "Women constitute half of the workforce.", level: 6, learned: false },
  { word: "contemplate", phonetic: "/ˈkɒntəmpleɪt/", meaning: "v. 沉思，考虑", example: "He contemplated the meaning of life.", level: 6, learned: false },
  { word: "controversy", phonetic: "/ˈkɒntrəvɜːsi/", meaning: "n. 争议，争论", example: "The new policy sparked a controversy.", level: 6, learned: false },
  { word: "correlate", phonetic: "/ˈkɒrəleɪt/", meaning: "v. 相关，关联", example: "Income correlates with education level.", level: 6, learned: false },
  { word: "credibility", phonetic: "/ˌkredəˈbɪləti/", meaning: "n. 可信度，信誉", example: "The scandal damaged the company's credibility.", level: 6, learned: false },
  { word: "deficiency", phonetic: "/dɪˈfɪʃnsi/", meaning: "n. 缺乏，不足", example: "Vitamin D deficiency can cause health problems.", level: 6, learned: false },
  { word: "deliberate", phonetic: "/dɪˈlɪbərət/", meaning: "adj. 故意的 v. 仔细考虑", example: "The attack was a deliberate act of aggression.", level: 6, learned: false },
  { word: "deprive", phonetic: "/dɪˈpraɪv/", meaning: "v. 剥夺，使丧失", example: "The war deprived children of their education.", level: 6, learned: false },
  { word: "deteriorate", phonetic: "/dɪˈtɪəriəreɪt/", meaning: "v. 恶化，变坏", example: "His health deteriorated rapidly.", level: 6, learned: false },
  { word: "dilemma", phonetic: "/dɪˈlemə/", meaning: "n. 困境，进退两难", example: "She faced a dilemma between career and family.", level: 6, learned: false },
  { word: "discrimination", phonetic: "/dɪˌskrɪmɪˈneɪʃn/", meaning: "n. 歧视", example: "Racial discrimination is illegal in many countries.", level: 6, learned: false },
  { word: "disrupt", phonetic: "/dɪsˈrʌpt/", meaning: "v. 扰乱，中断", example: "The storm disrupted flight schedules.", level: 6, learned: false },
  { word: "divert", phonetic: "/daɪˈvɜːt/", meaning: "v. 转移，使转向", example: "The money was diverted to other projects.", level: 6, learned: false },
  { word: "dominate", phonetic: "/ˈdɒmɪneɪt/", meaning: "v. 支配，控制", example: "The company dominates the smartphone market.", level: 6, learned: false },
  { word: "elaborate", phonetic: "/ɪˈlæbərət/", meaning: "adj. 精心制作的 v. 详细阐述", example: "Can you elaborate on your proposal?", level: 6, learned: false },
  { word: "eligible", phonetic: "/ˈelɪdʒəbl/", meaning: "adj. 合格的，有资格的", example: "Only members are eligible to vote.", level: 6, learned: false },
  { word: "embrace", phonetic: "/ɪmˈbreɪs/", meaning: "v. 拥抱；接受", example: "We should embrace new technologies.", level: 6, learned: false },
  { word: "endure", phonetic: "/ɪnˈdjʊə/", meaning: "v. 忍受，持久", example: "She endured years of hardship.", level: 6, learned: false },
  { word: "enhance", phonetic: "/ɪnˈhɑːns/", meaning: "v. 提高，增强", example: "Music can enhance your mood.", level: 6, learned: false },
  { word: "epidemic", phonetic: "/ˌepɪˈdemɪk/", meaning: "n. 流行病 adj. 流行的", example: "The flu epidemic spread rapidly.", level: 6, learned: false },
  { word: "erode", phonetic: "/ɪˈrəʊd/", meaning: "v. 侵蚀，腐蚀", example: "Wind and rain erode the mountains.", level: 6, learned: false },
  { word: "essence", phonetic: "/ˈesns/", meaning: "n. 本质，精髓", example: "Time is of the essence in emergencies.", level: 6, learned: false },
];

// --- Exam question data (for the practice interface) ---
const examQuestions = {
  writing: {
    title: "写作",
    direction: "Directions: For this part, you are allowed 30 minutes to write an essay on the importance of acquiring practical skills. You should write at least 150 words but no more than 200 words. Your essay should be based on the outline given below:",
    topic: "The Importance of Acquiring Practical Skills",
    outline: [
      "1. 目前许多大学生注重理论学习而忽视实践能力的培养",
      "2. 实践能力对大学生未来发展的重要性",
      "3. 如何在大学期间提升实践能力",
    ],
    wordLimit: 200,
    timeLimit: 30 * 60,
  },
  listening: {
    title: "听力",
    sections: [
      {
        type: "Section A - Long Conversations",
        questions: [
          { id: "q1", audio: true, content: "Questions 1 to 4 are based on the following conversation.", passage: "M: Did you attend the lecture on artificial intelligence yesterday? I heard it was quite enlightening.\nW: Yes, I did. The professor discussed how AI is transforming various industries, from healthcare to finance. What impressed me most was the part about machine learning algorithms.\nM: I missed it. Could you share some key points? I'm particularly interested in the healthcare applications.\nW: Sure. He mentioned that AI can now diagnose certain diseases more accurately than human doctors. However, he also raised concerns about data privacy and ethical implications.\nM: That's fascinating. Do you think AI will eventually replace human doctors?\nW: The professor argued that it's unlikely. Instead, AI will serve as a powerful tool to assist doctors, not replace them entirely. The human element in healthcare remains irreplaceable.",
            questions: [
              { q: "1. What is the main topic of the conversation?", options: ["A) A lecture on finance", "B) A lecture on artificial intelligence", "C) A lecture on healthcare policy", "D) A lecture on data privacy"], answer: "B" },
              { q: "2. What impressed the woman most about the lecture?", options: ["A) The discussion on finance", "B) The part about machine learning algorithms", "C) The healthcare applications", "D) The ethical concerns"], answer: "B" },
              { q: "3. What concern did the professor raise?", options: ["A) The cost of AI technology", "B) The shortage of doctors", "C) Data privacy and ethical implications", "D) The accuracy of AI diagnoses"], answer: "C" },
              { q: "4. What did the professor say about AI replacing doctors?", options: ["A) AI will definitely replace doctors", "B) AI will never be used in healthcare", "C) AI will assist but not replace doctors", "D) AI is already replacing doctors"], answer: "C" },
            ]
          }
        ]
      },
      {
        type: "Section B - Passages",
        questions: [
          { id: "q2", audio: true, content: "Questions 5 to 7 are based on the following passage.",
            passage: "In recent years, remote work has become increasingly popular among professionals. While some companies have fully embraced this model, others remain skeptical. Studies show that remote workers are often more productive than their office-based counterparts. The flexibility to choose one's working hours and environment contributes to higher job satisfaction. However, remote work also presents challenges, such as maintaining team cohesion and managing work-life boundaries. Experts suggest that a hybrid approach, combining remote and in-office days, may offer the best of both worlds.",
            questions: [
              { q: "5. According to the passage, what is true about remote workers?", options: ["A) They are less productive", "B) They are often more productive", "C) They work fewer hours", "D) They have lower job satisfaction"], answer: "B" },
              { q: "6. What contributes to higher job satisfaction for remote workers?", options: ["A) Higher salary", "B) Shorter commute", "C) Flexibility in working hours and environment", "D) More vacation days"], answer: "C" },
              { q: "7. What do experts suggest as the best approach?", options: ["A) Fully remote work", "B) Fully in-office work", "C) A hybrid approach", "D) Flexible hours only"], answer: "C" },
            ]
          }
        ]
      },
    ]
  },
  reading: {
    title: "阅读理解",
    sections: [
      {
        type: "Section A - Banked Cloze",
        direction: "In this section, there is a passage with ten blanks. You are required to select one word for each blank from a list of choices given in a word bank. You may not use any of the words in the bank more than once.",
        passage: "The concept of sustainable development has gained significant 1.___ in recent years. As environmental concerns continue to 2.___, more businesses are adopting green practices. The 3.___ of fossil fuels has led to a search for alternative energy sources. Solar and wind power have emerged as 4.___ solutions. However, the 5.___ to renewable energy requires substantial investment. Governments play a 6.___ role in facilitating this transition through policy support. The long-term 7.___ of such investments are undeniable. Companies that 8.___ sustainable practices often see improved brand reputation. Consumers are increasingly 9.___ to support environmentally responsible businesses. The 10.___ of this trend suggests a permanent shift in how businesses operate.",
        wordBank: ["prominence", "grow", "depletion", "viable", "transition", "crucial", "benefits", "embrace", "inclined", "persistence", "significant", "concerns"],
        answers: { 1: "prominence", 2: "grow", 3: "depletion", 4: "viable", 5: "transition", 6: "crucial", 7: "benefits", 8: "embrace", 9: "inclined", 10: "persistence" },
      },
      {
        type: "Section B - Matching",
        direction: "You are going to read a passage with 10 statements attached to it. Each statement contains information given in one of the paragraphs. Identify the paragraph from which the information is derived.",
        paragraphs: [
          "A. Artificial intelligence has made remarkable strides in natural language processing, enabling machines to understand and generate human language with unprecedented accuracy.",
          "B. The integration of AI in education has opened new possibilities for personalized learning, allowing students to learn at their own pace.",
          "C. However, critics argue that over-reliance on AI in education may undermine critical thinking skills and reduce human interaction.",
          "D. Despite these concerns, the educational AI market continues to grow exponentially, with investments reaching billions of dollars annually.",
          "E. Researchers emphasize that AI should be viewed as a tool to augment rather than replace human educators in the learning process.",
        ],
        statements: [
          { id: "s1", text: "AI in education allows personalized learning at individual pace.", answer: "B" },
          { id: "s2", text: "Critics worry about reduced human interaction due to AI.", answer: "C" },
          { id: "s3", text: "AI has achieved significant progress in understanding human language.", answer: "A" },
          { id: "s4", text: "The educational AI market is growing rapidly with huge investments.", answer: "D" },
          { id: "s5", text: "AI should augment, not replace, human educators.", answer: "E" },
        ]
      },
      {
        type: "Section C - Careful Reading",
        direction: "There are 2 passages in this section. Each passage is followed by some questions or unfinished statements. For each of them there are four choices marked A), B), C) and D).",
        passages: [
          {
            content: "The sharing economy has fundamentally transformed how people access goods and services. Platforms like Airbnb and Uber have disrupted traditional industries by connecting users directly with providers. This model offers flexibility and cost savings but also raises regulatory challenges. Cities worldwide are grappling with how to balance innovation with public safety and workers' rights. The sharing economy represents a paradigm shift in commerce, one that requires new frameworks for governance and consumer protection.",
            questions: [
              { q: "11. What has the sharing economy fundamentally changed?", options: ["A) How governments collect taxes", "B) How people access goods and services", "C) How companies manufacture products", "D) How banks operate"], answer: "B" },
              { q: "12. What challenge does the sharing economy raise?", options: ["A) Environmental pollution", "B) Regulatory challenges", "C) Labor shortages", "D) Technological limitations"], answer: "B" },
              { q: "13. How does the passage describe the sharing economy?", options: ["A) As a minor trend", "B) As a temporary phenomenon", "C) As a paradigm shift in commerce", "D) As a failed experiment"], answer: "C" },
            ]
          },
          {
            content: "Climate change poses unprecedented challenges to global food security. Rising temperatures, changing precipitation patterns, and extreme weather events threaten agricultural productivity worldwide. Small-scale farmers in developing nations are particularly vulnerable, as they lack the resources to adapt. Innovative solutions such as drought-resistant crops, precision agriculture, and vertical farming offer hope. However, these technologies require significant investment and knowledge transfer. International cooperation is essential to ensure that agricultural adaptation keeps pace with climate change.",
            questions: [
              { q: "14. Who is most vulnerable to climate change's effects on agriculture?", options: ["A) Large-scale industrial farmers", "B) Small-scale farmers in developing nations", "C) Urban consumers", "D) Agricultural technology companies"], answer: "B" },
              { q: "15. What do innovative solutions like vertical farming require?", options: ["A) Government subsidies only", "B) No investment", "C) Significant investment and knowledge transfer", "D) More land"], answer: "C" },
              { q: "16. What is essential for agricultural adaptation?", options: ["A) Individual effort", "B) International cooperation", "C) Market forces alone", "D) Technological advancement only"], answer: "B" },
            ]
          }
        ]
      },
    ]
  },
  translation: {
    title: "翻译",
    direction: "Directions: For this part, you are allowed 30 minutes to translate a passage from Chinese into English. You should write your answer on the translation section.",
    source: "中国的高铁网络是世界上最长的高铁网络，总里程超过4万公里。高铁不仅缩短了城市之间的旅行时间，还促进了区域经济的发展和人员流动。近年来，中国高铁技术不断创新，列车运行速度和舒适度持续提升。同时，高铁建设也带动了相关产业的发展，创造了大量就业机会。展望未来，中国计划进一步扩大高铁网络覆盖范围，让更多偏远地区享受到便捷的交通服务。中国高铁已成为国家现代化建设的重要标志之一，展示了中国在基础设施建设领域的卓越实力。",
    timeLimit: 30 * 60,
    referenceTranslation: "China's high-speed rail network is the longest in the world, with a total mileage exceeding 40,000 kilometers. High-speed rail has not only shortened travel time between cities but also promoted regional economic development and personnel mobility. In recent years, China's high-speed rail technology has continued to innovate, with sustained improvements in train speed and comfort. Meanwhile, the construction of high-speed rail has also driven the development of related industries and created a large number of employment opportunities. Looking ahead, China plans to further expand the coverage of the high-speed rail network, enabling more remote areas to enjoy convenient transportation services. China's high-speed rail has become one of the important symbols of national modernization, demonstrating China's outstanding strength in infrastructure construction.",
  },
};

// --- Core features data ---
const coreFeatures = [
  { icon: "🤖", title: "AI 智能解析", desc: "全题型覆盖，逐题拆解考点、分析干扰项、梳理逻辑脉络，不只告诉你对错，更告诉你为什么。", badge: "AI 驱动" },
  { icon: "🎯", title: "即时智能评分", desc: "客观题提交即出分，快速定位薄弱环节，针对性加强，每次练习都有收获。" },
  { icon: "🎧", title: "听力沉浸训练", desc: "真实考试音频，支持倍速播放、单句循环、显示原文，系统攻克听力难关。" },
  { icon: "👆", title: "点词翻译", desc: "点击任意单词查释义，不中断做题，生词可同步存入生词本。" },
  { icon: "📥", title: "真题一键下载", desc: "已接入的本地六级试卷可导出；其他考试请使用目录中的真实来源。" },
  { icon: "📊", title: "做题记录", desc: "自动留存答题轨迹与解析，支持错题回看，方便复盘巩固。" },
];

// --- Pricing data ---
const pricingData = [
  {
    name: "免费版",
    price: "0",
    unit: "永久免费",
    badge: "📝 试卷会员",
    features: [
      "基础题目练习 + 答案对比",
      "按题型刷题",
      "真题下载（部分）",
      "做题记录保存",
    ],
    cta: "免费使用",
    popular: false,
  },
  {
    name: "试卷会员",
    price: "19.9",
    unit: "/月",
    badge: "📝 试卷会员",
    features: [
      "全部真题在线练习",
      "AI 老师逐题解析 + 评分",
      "听力音频倍速 + 原文",
      "真题一键下载（无水印）",
      "错题本 + 智能复习",
    ],
    cta: "立即订阅",
    popular: true,
  },
  {
    name: "课程会员",
    price: "39.9",
    unit: "/月",
    badge: "🎓 课程会员",
    features: [
      "30+ 节备考技巧课",
      "逐课配套检测练习",
      "词汇词书 + 打字训练",
      "AI 写作翻译批改",
      "学习进度全追踪",
    ],
    cta: "立即订阅",
    popular: false,
  },
];

// ============================================================
// IELTS (雅思) data
// ============================================================

// --- Course display names ---
const courseNames = {
  CET4: "大学英语四级",
  CET6: "大学英语六级",
  IELTS: "雅思英语",
};

// --- IELTS exam papers (剑桥雅思真题) ---
const ieltsExamData = [];
for (let v = 19; v >= 9; v--) {
  ieltsExamData.push({
    period: `剑桥雅思 ${v}`,
    exams: [1, 2, 3, 4].map(t => ({
      id: `ielts-c${v}-t${t}`,
      title: `剑桥雅思${v} Test ${t}`,
      version: v,
      test: t,
      isLatest: v === 19,
    })),
  });
}
ieltsExamData.push({
  period: "雅思机考模拟",
  exams: [
    { id: "ielts-cbt-1", title: "雅思机考模拟 卷一（A类）", isLatest: false },
    { id: "ielts-cbt-2", title: "雅思机考模拟 卷二（A类）", isLatest: false },
    { id: "ielts-cbt-3", title: "雅思机考模拟 卷三（G类）", isLatest: false },
  ],
});

// --- IELTS courses ---
const ieltsCourseData = [
  {
    id: "ielts_overview",
    title: "雅思考试全解",
    desc: "四节课讲清雅思考试结构、四科 Band 评分标准与换算规则、A类/G类差异，以及 8 周出分备考规划，帮你建立目标分导向的应试体系。",
    lessons: 4,
    icon: "🎯",
    color: "#3b82f6",
    lessonList: [
      { title: "雅思考试结构与报名流程", duration: "15 min", free: true },
      { title: "四科 Band 评分标准精讲", duration: "18 min", free: true },
      { title: "A类与G类差异对比", duration: "12 min", free: false },
      { title: "8周出分备考规划", duration: "20 min", free: false },
    ],
  },
  {
    id: "ielts_listening",
    title: "IELTS 听力专项",
    desc: "从填空题预判、地图题方位词到选择题干扰项排除分题型训练，配合精听跟读，最后 30 分钟整套限时收尾。",
    lessons: 6,
    icon: "🎧",
    color: "#8b5cf6",
    lessonList: [
      { title: "笔记/表格填空预判技巧", duration: "20 min", free: true },
      { title: "地图题方位词速记", duration: "18 min", free: true },
      { title: "选择题干扰项排除法", duration: "22 min", free: false },
      { title: "配对题节奏控制", duration: "20 min", free: false },
      { title: "精听与跟读训练法", duration: "25 min", free: false },
      { title: "30分钟整套限时训练", duration: "30 min", free: false },
    ],
  },
  {
    id: "ielts_reading",
    title: "IELTS 阅读专项",
    desc: "T/F/NG 判断规则、段落信息匹配定位法、标题匹配主旨提取、填空同义替换逐一击破，最后 60 分钟整套限时收尾。",
    lessons: 6,
    icon: "📖",
    color: "#06b6d4",
    lessonList: [
      { title: "T/F/NG 判断规则拆解", duration: "22 min", free: true },
      { title: "段落信息匹配定位法", duration: "25 min", free: true },
      { title: "标题匹配段落主旨提取", duration: "20 min", free: false },
      { title: "填空题同义替换规律", duration: "22 min", free: false },
      { title: "长难句速读训练", duration: "28 min", free: false },
      { title: "60分钟整套限时训练", duration: "40 min", free: false },
    ],
  },
  {
    id: "ielts_writing",
    title: "IELTS 写作专项",
    desc: "Task 1 六类数据图与流程图描述框架，Task 2 议论文四段式结构论证展开，覆盖大小作文评分四维度。",
    lessons: 8,
    icon: "✍️",
    color: "#f59e0b",
    lessonList: [
      { title: "Task 1 数据图分类与框架", duration: "25 min", free: true },
      { title: "趋势与倍数表达词汇", duration: "20 min", free: true },
      { title: "流程图与地图描述专题", duration: "22 min", free: false },
      { title: "Task 2 四段式结构搭建", duration: "25 min", free: false },
      { title: "议论文论证展开逻辑", duration: "20 min", free: false },
      { title: "高分衔接与句式变换", duration: "18 min", free: false },
      { title: "大小作文话题素材库", duration: "22 min", free: false },
      { title: "60分钟双任务整篇实战", duration: "30 min", free: false },
    ],
  },
  {
    id: "ielts_speaking",
    title: "IELTS 口语专项",
    desc: "Part 1 高频题库串讲、Part 2 话题卡素材串联法、Part 3 深度讨论框架，配流利度与发音语调专项打磨。",
    lessons: 6,
    icon: "🗣️",
    color: "#ec4899",
    lessonList: [
      { title: "Part 1 高频话题串讲", duration: "20 min", free: true },
      { title: "Part 2 话题卡串联法", duration: "25 min", free: true },
      { title: "Part 3 深度讨论框架", duration: "22 min", free: false },
      { title: "流利度与连贯性训练", duration: "20 min", free: false },
      { title: "发音语调打磨课", duration: "18 min", free: false },
      { title: "口语模考实录复盘", duration: "28 min", free: false },
    ],
  },
  {
    id: "ielts_vocab",
    title: "雅思词汇与语法",
    desc: "学术词汇表 AWL 高频词、同义替换精讲、高频学术搭配与复杂句式变换，读写双科的地基工程。",
    lessons: 7,
    icon: "📚",
    color: "#10b981",
    lessonList: [
      { title: "AWL 学术词汇清单速览", duration: "22 min", free: true },
      { title: "同义替换精讲（读写通用）", duration: "25 min", free: true },
      { title: "高频学术搭配清单", duration: "20 min", free: false },
      { title: "名词化表达进阶", duration: "18 min", free: false },
      { title: "复杂句式变换训练", duration: "25 min", free: false },
      { title: "从句与分词结构混用", duration: "22 min", free: false },
      { title: "写作词汇避免口语化", duration: "18 min", free: false },
    ],
  },
];

// --- IELTS question types ---
const ieltsQuestionTypeData = [
  {
    category: "听力",
    icon: "🎧",
    color: "#8b5cf6",
    groups: [
      { title: "笔记/表格填空", count: 180 },
      { title: "选择题", count: 120 },
      { title: "地图/平面图", count: 60 },
      { title: "配对题", count: 90 },
    ],
  },
  {
    category: "阅读",
    icon: "📖",
    color: "#06b6d4",
    groups: [
      { title: "判断题 T/F/NG", count: 150 },
      { title: "段落信息匹配", count: 120 },
      { title: "标题匹配", count: 90 },
      { title: "摘要/句子填空", count: 140 },
      { title: "选择题", count: 100 },
    ],
  },
  {
    category: "写作",
    icon: "✍️",
    color: "#f59e0b",
    groups: [
      { title: "Task 1 图表作文", count: 45 },
      { title: "Task 2 议论文", count: 60 },
    ],
  },
  {
    category: "口语",
    icon: "🗣️",
    color: "#ec4899",
    groups: [
      { title: "Part 1 话题", count: 80 },
      { title: "Part 2 话题卡", count: 55 },
      { title: "Part 3 深度问题", count: 70 },
    ],
  },
];

// --- IELTS vocabulary ---
const ieltsVocabularyData = [
  { word: "sustainable", phonetic: "/səˈsteɪnəbl/", meaning: "adj. 可持续的", example: "Cities must find sustainable ways to grow.", level: 7, learned: false },
  { word: "urbanisation", phonetic: "/ˌɜːbənaɪˈzeɪʃn/", meaning: "n. 城市化", example: "Rapid urbanisation has changed the landscape.", level: 7, learned: false },
  { word: "biodiversity", phonetic: "/ˌbaɪəʊdaɪˈvɜːsəti/", meaning: "n. 生物多样性", example: "The rainforest supports immense biodiversity.", level: 7, learned: false },
  { word: "consequence", phonetic: "/ˈkɒnsɪkwəns/", meaning: "n. 后果，结果", example: "The policy had unintended consequences.", level: 7, learned: false },
  { word: "demonstrate", phonetic: "/ˈdemənstreɪt/", meaning: "v. 证明；展示", example: "The data demonstrates a clear upward trend.", level: 7, learned: false },
  { word: "diverse", phonetic: "/daɪˈvɜːs/", meaning: "adj. 多样的，不同的", example: "The region attracts a diverse population.", level: 7, learned: false },
  { word: "ecosystem", phonetic: "/ˈiːkəʊsɪstəm/", meaning: "n. 生态系统", example: "Wetlands form a fragile ecosystem.", level: 7, learned: false },
  { word: "emit", phonetic: "/iˈmɪt/", meaning: "v. 排放，散发", example: "Power plants emit large amounts of CO2.", level: 7, learned: false },
  { word: "establish", phonetic: "/ɪˈstæblɪʃ/", meaning: "v. 建立，确立", example: "The charity was established in 1990.", level: 7, learned: false },
  { word: "evidence", phonetic: "/ˈevɪdəns/", meaning: "n. 证据", example: "There is growing evidence of climate change.", level: 7, learned: false },
  { word: "generate", phonetic: "/ˈdʒenəreɪt/", meaning: "v. 产生；引起", example: "Wind turbines generate clean electricity.", level: 7, learned: false },
  { word: "implement", phonetic: "/ˈɪmplɪment/", meaning: "v. 实施，执行", example: "The council implemented new recycling rules.", level: 7, learned: false },
  { word: "indicate", phonetic: "/ˈɪndɪkeɪt/", meaning: "v. 表明，指出", example: "Surveys indicate rising public support.", level: 7, learned: false },
  { word: "infrastructure", phonetic: "/ˈɪnfrəstrʌktʃə/", meaning: "n. 基础设施", example: "The city invested heavily in infrastructure.", level: 7, learned: false },
  { word: "innovation", phonetic: "/ˌɪnəˈveɪʃn/", meaning: "n. 创新", example: "Innovation drives economic growth.", level: 7, learned: false },
  { word: "investigate", phonetic: "/ɪnˈvestɪɡeɪt/", meaning: "v. 调查，研究", example: "Scientists investigated the cause of the decline.", level: 7, learned: false },
  { word: "legislation", phonetic: "/ˌledʒɪsˈleɪʃn/", meaning: "n. 立法，法规", example: "New legislation bans single-use plastics.", level: 7, learned: false },
  { word: "maintain", phonetic: "/meɪnˈteɪn/", meaning: "v. 维持；保养", example: "It is costly to maintain public parks.", level: 7, learned: false },
  { word: "monitor", phonetic: "/ˈmɒnɪtə/", meaning: "v./n. 监测；显示器", example: "Sensors monitor air quality in real time.", level: 7, learned: false },
  { word: "negotiate", phonetic: "/nɪˈɡəʊʃieɪt/", meaning: "v. 谈判，协商", example: "The two sides negotiated a trade deal.", level: 7, learned: false },
  { word: "participate", phonetic: "/pɑːˈtɪsɪpeɪt/", meaning: "v. 参与，参加", example: "Over 500 students participated in the survey.", level: 7, learned: false },
  { word: "pollutant", phonetic: "/pəˈluːtənt/", meaning: "n. 污染物", example: "Traffic is the main source of pollutants.", level: 7, learned: false },
  { word: "poverty", phonetic: "/ˈpɒvəti/", meaning: "n. 贫困", example: "Education helps families escape poverty.", level: 7, learned: false },
  { word: "prohibit", phonetic: "/prəˈhɪbɪt/", meaning: "v. 禁止", example: "Smoking is prohibited in public buildings.", level: 7, learned: false },
  { word: "region", phonetic: "/ˈriːdʒən/", meaning: "n. 地区，区域", example: "Agriculture dominates the northern region.", level: 7, learned: false },
  { word: "release", phonetic: "/rɪˈliːs/", meaning: "v./n. 释放；发布", example: "The report was released last week.", level: 7, learned: false },
  { word: "resource", phonetic: "/rɪˈsɔːs/", meaning: "n. 资源", example: "Water is a scarce resource in the region.", level: 7, learned: false },
  { word: "significant", phonetic: "/sɪɡˈnɪfɪkənt/", meaning: "adj. 显著的，重要的", example: "There was a significant rise in exports.", level: 7, learned: false },
  { word: "strategy", phonetic: "/ˈstrætədʒi/", meaning: "n. 策略，战略", example: "The government launched a housing strategy.", level: 7, learned: false },
  { word: "subsidise", phonetic: "/ˈsʌbsɪdaɪz/", meaning: "v. 补贴，资助", example: "The state subsidises public transport.", level: 7, learned: false },
  { word: "transform", phonetic: "/trænsˈfɔːm/", meaning: "v. 转变，改造", example: "Technology has transformed the workplace.", level: 7, learned: false },
  { word: "trigger", phonetic: "/ˈtrɪɡə/", meaning: "v./n. 引发；扳机", example: "The crisis triggered a wave of migration.", level: 7, learned: false },
  { word: "urban", phonetic: "/ˈɜːbən/", meaning: "adj. 城市的", example: "Urban areas face mounting traffic pressure.", level: 7, learned: false },
  { word: "welfare", phonetic: "/ˈwelfeə/", meaning: "n. 福利", example: "The welfare system supports the unemployed.", level: 7, learned: false },
  { word: "consumption", phonetic: "/kənˈsʌmpʃn/", meaning: "n. 消耗，消费", example: "Energy consumption fell by 12%.", level: 7, learned: false },
  { word: "criteria", phonetic: "/kraɪˈtɪəriə/", meaning: "n. 标准（复数）", example: "Applicants must meet strict criteria.", level: 7, learned: false },
  { word: "component", phonetic: "/kəmˈpəʊnənt/", meaning: "n. 组成部分，部件", example: "Trust is a key component of teamwork.", level: 7, learned: false },
  { word: "comprehensive", phonetic: "/ˌkɒmprɪˈhensɪv/", meaning: "adj. 全面的，综合的", example: "The report offers a comprehensive review.", level: 7, learned: false },
  { word: "accumulate", phonetic: "/əˈkjuːmjəleɪt/", meaning: "v. 积累，积聚", example: "Plastic waste accumulates in the ocean.", level: 7, learned: false },
  { word: "fluctuate", phonetic: "/ˈflʌktʃueɪt/", meaning: "v. 波动，起伏", example: "Prices fluctuated throughout the decade.", level: 7, learned: false },
];

// --- IELTS practice exam questions ---
const ieltsExamQuestions = {
  writing: {
    title: "写作",
    tasks: [
      {
        label: "Task 1",
        direction: "You should spend about 20 minutes on this task. The graph below shows the percentage of households with solar panels in the UK between 2010 and 2024. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        topic: "Household Solar Panel Adoption in the UK (2010–2024)",
        chart: "📈 折线图（演示）：2010 年 2% → 2013 年 8% → 2016 年 15% → 2020 年 22% → 2024 年 28%（整体呈稳步上升趋势，2013–2016 年间增速最快）",
        wordLimit: 150,
        timeLimit: 20 * 60,
      },
      {
        label: "Task 2",
        direction: "You should spend about 40 minutes on this task. Write about the following topic: Some people believe that university students should study whatever subjects they like. Others think that they should only be allowed to study subjects that will be useful in the future, such as those related to science and technology. Discuss both these views and give your own opinion.",
        topic: "University Education: Passion vs. Practicality",
        outline: [
          "1. 简述两种观点的分歧背景",
          "2. 讨论支持自由选择专业的理由（兴趣驱动、个体差异、通识价值）",
          "3. 讨论支持实用导向的理由（就业、社会需求、投资回报）",
          "4. 给出你的观点并总结",
        ],
        wordLimit: 250,
        timeLimit: 40 * 60,
      },
    ],
  },
  listening: {
    title: "听力",
    sections: [
      {
        type: "Section 1 - Conversation",
        questions: [
          { id: "q1", audio: true, content: "Questions 1 to 4 are based on the following conversation.",
            passage: "W: Good morning, Greenfield Sports Centre. How can I help you?\nM: Hi, I'd like to ask about your membership options. I just moved to the area.\nW: Of course. We have two main plans. The standard plan is £30 a month and gives you access to the gym and swimming pool.\nM: What does the premium plan include?\nW: That's £45 a month and covers everything, plus fitness classes and the sauna.\nM: I see. Do you offer a discount for students?\nW: Yes, students get 20% off with a valid student card. And if you pay annually upfront, you get two months free.\nM: That sounds good. Also, is there a joining fee?\nW: Normally it's £25, but we're waiving it for new members this month.",
            questions: [
              { q: "1. How much does the standard monthly plan cost?", options: ["A) £25", "B) £30", "C) £45", "D) £50"], answer: "B" },
              { q: "2. What is extra in the premium plan?", options: ["A) Gym access", "B) Swimming pool", "C) Fitness classes and sauna", "D) Personal trainer"], answer: "C" },
              { q: "3. What discount do students receive?", options: ["A) 10%", "B) 15%", "C) 20%", "D) Two months free"], answer: "C" },
              { q: "4. What is special about this month?", options: ["A) The joining fee is waived", "B) All plans are half price", "C) Free personal training", "D) The sauna is closed"], answer: "A" },
            ]
          }
        ]
      },
      {
        type: "Section 2 - Monologue",
        questions: [
          { id: "q2", audio: true, content: "Questions 5 to 8 are based on the following talk.",
            passage: "Welcome to the Riverside Community Library. Before we begin the tour, let me share some practical information. The library opens at 9 a.m. on weekdays and 10 a.m. on Saturdays; we are closed on Sundays and public holidays. Membership is free for all local residents — just bring a proof of address. Our fiction section is on the ground floor, while science and history collections are upstairs. The children's reading corner, refurbished last year, is at the back of the ground floor. We also run free workshops every Wednesday evening, covering topics from digital skills to creative writing. Finally, please note that the café closes an hour before the library does.",
            questions: [
              { q: "5. When does the library open on Saturdays?", options: ["A) 8 a.m.", "B) 9 a.m.", "C) 10 a.m.", "D) 11 a.m."], answer: "C" },
              { q: "6. What must residents bring to register?", options: ["A) A passport", "B) Proof of address", "C) A student card", "D) A library card"], answer: "B" },
              { q: "7. Where is the children's reading corner?", options: ["A) Upstairs", "B) Near the café", "C) At the back of the ground floor", "D) Next to the fiction section"], answer: "C" },
              { q: "8. When are the free workshops held?", options: ["A) Monday mornings", "B) Wednesday evenings", "C) Friday afternoons", "D) Saturday mornings"], answer: "B" },
            ]
          }
        ]
      },
    ]
  },
  reading: {
    title: "阅读",
    sections: [
      {
        type: "Section 1 - Summary Completion",
        direction: "Complete the summary below. Choose ONE WORD ONLY from the box for each answer.",
        passage: "Urban beekeeping has become increasingly popular in cities around the world. Bees play a vital role in the 1.___ of crops, and urban hives can produce surprisingly high yields. Studies suggest that city bees often enjoy greater 2.___ than their rural counterparts because urban gardens contain a wider 3.___ of flowering plants. However, researchers also warn that the rapid 4.___ of urban hives could exceed the available food supply. Planning rules in some cities now require beekeepers to 5.___ the number of hives they keep. Supporters argue that bees serve as an effective 6.___ of environmental health, reflecting air and soil quality. Community projects have also used beekeeping to 7.___ local residents in conservation. Whether urban beekeeping is a lasting trend or a passing 8.___ remains to be seen.",
        wordBank: ["pollination", "diversity", "monitor", "regulate", "fashion", "growth", "indicator", "engage", "harvest", "welfare"],
        answers: { 1: "pollination", 2: "welfare", 3: "diversity", 4: "growth", 5: "regulate", 6: "indicator", 7: "engage", 8: "fashion" },
      },
      {
        type: "Section 2 - True/False/Not Given",
        direction: "Do the following statements agree with the information given in the passage? Write TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, or NOT GIVEN if there is no information on this.",
        paragraphs: [
          "A. The vertical farming industry has expanded rapidly over the past decade, with commercial farms now operating in more than thirty countries. By growing crops in stacked layers indoors, these farms use up to 95% less water than conventional fields.",
          "B. Proponents argue that vertical farms can be built close to consumers, dramatically cutting transport emissions and delivering fresher produce. Some supermarkets have already installed in-store growing units.",
          "C. Critics, however, point to the high energy demands of artificial lighting. Unless farms run on renewable power, their carbon footprint may exceed that of traditional agriculture.",
          "D. Economic viability remains the biggest obstacle. Construction costs are high, and only high-value crops such as leafy greens and herbs currently generate reliable profits.",
          "E. Researchers are experimenting with genetically optimised seeds and AI-controlled lighting to improve yields, though large-scale results are still years away.",
        ],
        statements: [
          { id: "s1", text: "Vertical farms use significantly less water than traditional farms.", answer: "T" },
          { id: "s2", text: "All vertical farms currently run entirely on renewable energy.", answer: "F" },
          { id: "s3", text: "In-store growing units have been installed in some supermarkets.", answer: "T" },
          { id: "s4", text: "Genetically optimised seeds have already doubled crop yields.", answer: "NG" },
          { id: "s5", text: "Construction costs are the only barrier to profitability.", answer: "F" },
        ],
        options: ["T", "F", "NG"],
      },
      {
        type: "Section 3 - Multiple Choice",
        direction: "Choose the correct letter, A, B, C or D for each question.",
        passages: [
          {
            content: "The gig economy, characterised by short-term contracts and freelance work, now accounts for a substantial share of employment in many economies. Supporters celebrate its flexibility: workers can choose when and how much they work, and businesses can scale their workforce rapidly. Yet critics highlight the absence of traditional protections such as sick pay, pensions, and minimum wage guarantees in many jurisdictions. Recent court rulings in several countries have begun to reclassify some gig workers as employees, granting them additional rights. Platforms respond that such rulings could raise costs and reduce the very flexibility that attracts workers in the first place. The debate ultimately turns on whether flexibility and security can coexist, or whether one must be sacrificed for the other.",
            questions: [
              { q: "11. What do supporters value most about the gig economy?", options: ["A) Job security", "B) Flexibility", "C) Sick pay", "D) Pensions"], answer: "B" },
              { q: "12. What have recent court rulings done?", options: ["A) Banned gig platforms", "B) Reduced workers' rights", "C) Reclassified some workers as employees", "D) Set maximum working hours"], answer: "C" },
              { q: "13. How do platforms respond to the rulings?", options: ["A) They welcome them", "B) They worry costs will reduce flexibility", "C) They ignore them completely", "D) They have stopped hiring"], answer: "B" },
            ]
          },
          {
            content: "Ocean plastic pollution has prompted a wave of innovation in packaging. Some companies now produce wrappers from seaweed that dissolve in hot water, while others have developed compostable films derived from corn starch. However, environmental groups caution that biodegradable plastics often require industrial composting facilities to break down effectively; in home compost or the open environment, they may persist for years. Moreover, if mixed into conventional plastic recycling streams, compostable materials can contaminate entire batches. Experts therefore emphasise that material substitution alone will not solve the problem — reduction and reuse systems must accompany it.",
            questions: [
              { q: "14. What is one innovation mentioned in packaging?", options: ["A) Seaweed-based wrappers", "B) Glass coatings", "C) Metal films", "D) Paper bottles"], answer: "A" },
              { q: "15. Why do environmental groups express caution?", options: ["A) Biodegradable plastics may persist outside industrial composting", "B) Seaweed is expensive", "C) Corn starch is toxic", "D) Compostable films are illegal"], answer: "A" },
              { q: "16. What do experts ultimately recommend?", options: ["A) Banning all plastics immediately", "B) Material substitution only", "C) Combining substitution with reduction and reuse", "D) Building more landfills"], answer: "C" },
            ]
          }
        ]
      },
    ]
  },
  speaking: {
    title: "口语",
    part1: [
      { q: "1. Where do you live at the moment?", sample: "I currently live in a small flat in the city centre, which is really convenient for commuting — it only takes me about twenty minutes to get to work by metro." },
      { q: "2. Do you work or are you a student?", sample: "I'm a final-year student majoring in economics, and I also work part-time at a bookshop at weekends, which helps me gain some practical experience." },
      { q: "3. Do you enjoy reading?", sample: "Yes, definitely. I try to read for at least half an hour before bed. I mostly go for non-fiction, especially books about history and psychology." },
      { q: "4. Let's talk about weather. What's the weather like in your city?", sample: "It varies a lot. Summers are hot and humid, while winters can be quite dry and chilly. Spring is probably my favourite season because it's mild and everything is in bloom." },
    ],
    part2: {
      topic: "Describe a skill you learned recently.",
      cues: [
        "what the skill is",
        "when and how you learned it",
        "how difficult it was to learn",
        "and explain how you feel about learning it",
      ],
      sample: "A skill I picked up recently is basic cooking. During the last holiday, I followed online tutorials and gradually learned to prepare simple dishes like stir-fried vegetables and tomato egg soup. At first I found timing the heat quite tricky — I burned more than a few pancakes! But after a few weeks of practice, it became second nature. Now I really enjoy cooking; it gives me a sense of independence and helps me eat more healthily.",
    },
    part3: [
      { q: "1. Why do you think some people find it hard to learn new skills?", sample: "I suppose the biggest barriers are time and motivation. Adults juggling work and family rarely have long uninterrupted blocks to practise, and without visible progress many people give up early. Fear of failure also plays a part." },
      { q: "2. Should schools teach practical life skills like cooking or budgeting?", sample: "Absolutely. Academic knowledge is important, but practical skills prepare students for independent living. I believe courses like personal finance or basic cooking would pay dividends throughout their lives." },
      { q: "3. How has technology changed the way people learn new skills?", sample: "Technology has democratised learning enormously. Free video tutorials and apps mean anyone with an internet connection can learn almost anything. On the flip side, the sheer volume of content can be overwhelming, and self-discipline becomes more important than ever." },
    ],
  },
};
