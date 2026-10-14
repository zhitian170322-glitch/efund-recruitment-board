/* 模板注册表：每种模板定义 表单区块 / 看板页面 / 识图提示词 / 示例数据。
   新增模板：在 BoardTemplates 里加一项，并提供对应的 board-*.html 与表单区块。 */

const DEMAND_SAMPLE = {
  date: '',
  demandCount: '',   // 空 = 自动按行数
  resumeTarget: '',  // 空 = 自动按「每日可推」求和
  rows: [
    { role: '产品经理', pm: '余才', daily: '5', recommended: '', direction: '本科，计算机/软件设计相关专业，证券经验，2年以上相关产品设计或开发工作经验，能够熟练运用axure等画图软件输出产品原型；具备较强的沟通能力、逻辑分析能力和文档编写能力；熟练使用AI提高工作效率', urgency: '紧急', note: '要求较高' },
    { role: '产品经理', pm: '彭红江', daily: '2', recommended: '', direction: '专科；1年以上数据开发经验，证券经验及数据产品经验，SQL-数据产品', urgency: '紧急', note: '要求高' },
    { role: '产品经理', pm: '卫兆伟', daily: '2', recommended: '', direction: '3年以上产品，计算机/软件设计相关专业，证券基金行业投资交易、私募基金托管、券商资管相关业务知识者优先', urgency: '紧急', note: '要求较高' },
    { role: 'Java开发', pm: '燕振华、杜依泞', daily: '5', recommended: '', direction: '4年以上工作经验，大专，侧重后端和sql开发，懂Java、SQL以及Python的优先，精通Java、Spring、数据库、Html、CSS、Vue等开发框架,有独立开发能力。', urgency: '一般', note: '' },
    { role: 'Java开发', pm: '庄晓雯', daily: '3', recommended: '', direction: '33岁内，本科、计算机相关专业、5年后端开发；优先有大厂后端相关经验，熟悉编译工具配置管理、编译底层技术，对完整研发流程有深入理解，有AI编程、Spec经验，掌握AI编程、SpringBoot、Mybatis等框架的使用', urgency: '紧急', note: '高级！' },
    { role: 'Java开发', pm: '李光宇', daily: '2', recommended: '', direction: '本科及以上，计算机相关专业，金融行业（投顾、资配、基金）核心系统开发经验优先，JAVA 基础扎实，熟悉Spring主流框架，熟悉 JUC 并发与线程池，项目有从 0-1 系统搭建经验者优先，需熟悉详细设计、代码评审、单元测试及 CI/CD 流程；需要熟悉ETL开发流程', urgency: '紧急', note: '人选跑路' },
    { role: 'Java开发', pm: '陈运聪、原尉峰', daily: '2', recommended: '2', direction: '本科以上学历，4年以上Java开发经验/专科，6年经验，男，熟悉微服务架构开发，熟悉SpringCloud、SpringBoot、Dubbo等主流框架；熟悉Gaussdb、Mysql、Oracle数据库，熟练编写SQL及存储过程、Git、Maven等工具。熟悉证券投资交易、资产管理等业务者优先考虑', urgency: '一般', note: '线上笔试+线下面试（可考虑线上面试）' },
    { role: '测试工程师', pm: '左颖辉', daily: '2', recommended: '', direction: '本科，32岁以内，计算机或软件相关专业；有OA类系统项目独立测试经验优先SQL、精细化；三年以上软件开发或测试工作经验；HR类系统项目独立测试经验优先', urgency: '一般', note: '当成一个需求做' },
    { role: '测试工程师', pm: '王乃康、左颖辉', daily: '2', recommended: '', direction: '本科，女士优先，大学本科以上学历，计算机或软件相关专业；三年及以上软件开发或测试、用户支持等工作经验；有独立项目测试经验，熟练掌握主流的测试方法方式和工具，参与互学E，邮箱，信创BPM、爱问机器人等系统的用户支持和系统功能测试工作', urgency: '紧急', note: '当成一个需求做' },
    { role: '测试工程师', pm: '卫兆伟', daily: '2', recommended: '2', direction: '大专、35以下，3年以上测试经验；证券经验，熟悉委外投资、资产管理、资产托管业务者优先考虑；熟悉微服务架构开发，熟悉Spring boot、Dubbo、Spring Cloud等主流框架；熟悉redis等Nosql数据库；熟悉mysql、oracle数据库', urgency: '紧急', note: '契合度要求高，筛选快！' },
    { role: 'C++开发', pm: '王斌', daily: '5', recommended: '', direction: '专及以上学历，熟悉C/C++，熟悉TCP/IP网络编程,具有一定的软件架构能力,具有2年以上的开发工作经验；纯软件方向！！！', urgency: '紧急', note: '要求较高' },
    { role: 'C++开发', pm: '唐群林、陈海东', daily: '2', recommended: '', direction: '本科，代码编写能力，相关证券交易项目经验；熟练掌握C++，具有两年以上 C++项目开发经验，熟悉QT框架；熟练掌握Python3核心，包括装饰器、生成器、迭代器、GIL、多进程 / 多线程、asyncio 异步IO等；有AI coding的项目经验较优', urgency: '紧急', note: '要求较高' },
    { role: 'Python开发', pm: '孙鸿滨', daily: '2', recommended: '', direction: '主要找Java，会一点python（学历最好是一本，优秀二本学历也可以）', urgency: '一般', note: '有待定' },
    { role: 'Python开发', pm: '周维健', daily: '2', recommended: '', direction: '本科及以上，计算机相关专业，有调度平台、集成平台相关开发经验的开发人员；了解大数据Hadoop、GP等常规的大数据技能，以及对datax等数据同步组件有一定的应用能力；有一定的AI工程应用实践能力', urgency: '重点推进', note: '参照夏硕简历！替补！！！' }
  ]
};

const URGENCY_OPTIONS = ['紧急', '一般', '重点推进'];

function normalizeDemand(d) {
  d = d && typeof d === 'object' ? d : {};
  const s = (v) => (v == null ? '' : String(v)).trim();
  return {
    demandCount: s(d.demandCount),
    resumeTarget: s(d.resumeTarget),
    rows: Array.isArray(d.rows) ? d.rows.map((r) => ({
      role: s(r?.role), pm: s(r?.pm), daily: s(r?.daily), recommended: s(r?.recommended),
      direction: s(r?.direction),
      urgency: URGENCY_OPTIONS.includes(s(r?.urgency)) ? s(r?.urgency) : (s(r?.urgency) ? s(r?.urgency) : '一般'),
      note: s(r?.note)
    })) : []
  };
}

const BoardTemplates = {
  cards: {
    label: '卡片看板（面试 + 优先岗位）',
    boardSrc: 'board-template.html',
    boardWidth: 1400,
    formSelector: '#form-cards',
    ocrUploads: { a: 'A · 优先岗位截图（招聘进度表）', b: 'B · 今日面试跟进截图' },
    // sample/empty only cover template-specific parts; date is shared
    ocrPrompt(hasA, hasB) {
      const parts = [];
      parts.push('你是招聘看板信息提取助手。请从用户上传的招聘看板截图中提取内容，只返回 JSON，不要解释，不要用 markdown 代码块。');
      parts.push('不要编造；截图里没有的字段留空字符串或空数组。');
      parts.push('轮次只能是「一面」或「二面」。不要提取「需求人数」。');
      parts.push('JSON 结构必须严格为：');
      parts.push('{"date":"2026年10月14日或空字符串","interviews":[{"name":"","round":"一面|二面","when":""}],"roles":[{"title":"","team":"","note":"","progress":"","featured":false}]}');
      if (hasA) {
        parts.push('其中一张图是「优先岗位 / 招聘进度表 / 需求表」，每一行对应 roles 里的一项，列映射如下：');
        parts.push('- title = 「岗位」列');
        parts.push('- team = 「团队」列；如果表里没有团队列，而有「项目经理」「负责人」「用人经理」「PM」列，就把该列的人名原样填进 team（多人用「、」连接）。team 只放团队名或人名，不要加「项目经理：」等前缀');
        parts.push('- note = 「用人经理偏好」或「简历筛选方向」列的原文，不要加「简历筛选方向：」「备注：」等列名前缀，不要把项目经理姓名写进 note');
        parts.push('- progress = 「进展」列；没有进展列时填「备注」列的原文（不带前缀），都没有就留空。不要把「每日可推」「已推荐」「紧急程度」写进 progress');
        parts.push('- featured = 「紧急程度」为「紧急」或「重点推进」（或标了重点/加急）时 true，「一般」或没有时 false');
        parts.push('「每日可推」「已推荐」「序号」列不需要返回。请把该表填入 roles。');
      }
      if (hasB) parts.push('其中一张图是「今日面试跟进」：提取候选人姓名、一面/二面、时间（when），填入 interviews；若图中有日期也可填 date。');
      if (hasA && !hasB) parts.push('本次只有岗位表，interviews 请返回空数组 []，date 可空。');
      if (hasB && !hasA) parts.push('本次只有面试跟进图，roles 请返回空数组 []。');
      return parts.join('\n');
    }
  },
  demandTable: {
    label: '需求表（今日需求数 / 简历目标）',
    boardSrc: 'board-demand.html',
    boardWidth: 1800,
    formSelector: '#form-demand',
    ocrUploads: { a: '需求表截图', b: null },
    sample() { return structuredClone(DEMAND_SAMPLE); },
    empty() { return { demandCount: '', resumeTarget: '', rows: [] }; },
    ocrPrompt() {
      return [
        '你是招聘需求表信息提取助手。请从截图中提取表格，只返回 JSON，不要解释，不要用 markdown 代码块。',
        '逐行忠实抄写，不要编造、不要改写、不要合并行；看不清或空白的单元格留空字符串。',
        '表头可能有「今日需求数：N」「今日简历目标：N」，分别填 demandCount、resumeTarget（只填数字，没有就留空）。',
        '列映射：岗位→role，项目经理→pm，每日可推→daily，已推荐→recommended，简历筛选方向→direction，紧急程度→urgency（只能是「紧急」「一般」「重点推进」之一），备注→note。',
        '序号列不用返回（由系统按岗位分组自动编号）。合并单元格的备注请复制到它覆盖的每一行。',
        'JSON 结构必须严格为：',
        '{"date":"","demandCount":"","resumeTarget":"","rows":[{"role":"","pm":"","daily":"","recommended":"","direction":"","urgency":"紧急|一般|重点推进","note":""}]}'
      ].join('\n');
    }
  }
};

function getTemplate(type) {
  return BoardTemplates[type] || BoardTemplates.cards;
}

window.BoardTemplates = BoardTemplates;
window.getTemplate = getTemplate;
window.normalizeDemand = normalizeDemand;
window.URGENCY_OPTIONS = URGENCY_OPTIONS;
