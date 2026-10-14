/* 模板注册表：每种模板定义 表单区块 / 看板页面 / 识图提示词 / 示例数据。
   新增模板：在 BoardTemplates 里加一项，并提供对应的 board-*.html 与表单区块。 */


// 国信看板：一个岗位分组（岗位/目标/薪资/年限合并）含多条子行（重点技能/面试方式/详细地址/项目经理）
// 单元格里用 **文字** 标红
const GUOXIN_SAMPLE = {
  title: '当日需求重点(活跃岗位)-重点看“紧急状态”',
  groups: [
    { team: '', role: '测试', roleNote: '**(优先统招本科，现场面试)**', highlight: true, target: '3', salary: '11.5-14k', years: '3年以上', rows: [
      { skills: '1.负责委外投资交易系统测试\n2、大专3年以上\n3、有证券相关经验优先', interview: '线上笔试+线上面试', address: '罗湖（国信证券大厦）', pm: '卫兆伟' },
      { skills: '参与互学E，邮箱，信创BPM、爱问机器人等系统的用户支持和系统功能测试工作\n本科学历', interview: '线上笔试+线上面试', address: '**福田（国信金融大厦）**', pm: '王乃康（左颖辉）' }
    ] },
    { team: '', role: '产品经理', roleNote: '', highlight: true, target: '2', salary: '14-15.5', years: '3年以上', rows: [
      { skills: '本科以上学历\n熟悉金融市场与产品体系，了解股票、基金、基金投顾等投资流程；\n关键词：内部管理、流程、代销、产品中心、基金，年龄30岁以下，多留意女性', interview: '线上笔试+线上面试', address: '罗湖（国信证券大厦）', pm: '余才-运营产品与质量组' },
      { skills: '数据类产品---运营支持组(资讯数据组)', interview: '线上笔试+线上面试', address: '罗湖（国信证券大厦）', pm: '彭红江' },
      { skills: '1.有证券基金行业投资交易、私募基金托管、券商资管相关业务知识者优先\n2、专科以上学历，35以下，性别不限', interview: '线上笔试+**现场面试**', address: '福田购物公园地铁站', pm: '卫兆伟' }
    ] },
    { team: '', role: 'Java', roleNote: '**(优先统招本科)**', highlight: true, target: '4', salary: '13-16', years: '3年以上', rows: [
      { skills: '1，负责资产配置、基金评价、量化股票策略投研工作平台等系统核心模块设计与开发。\n2，大专4年以上，28以上', interview: '线上笔试+线上面试', address: '罗湖（国信证券大厦）', pm: '燕振华' },
      { skills: '**推高级需求（5年以上）**\n1. 优先有**大厂后端**相关经验，熟悉编译工具配置管理、 （非业务类开发经验）\n2. 开发语言：Java为主，具备扎实的Java基础能力。\n3. 有AI经验，33以下', interview: '线上笔试+线上面试', address: '罗湖（国信证券大厦）', pm: '庄晓雯\n（要求较高）' },
      { skills: '支持数据平台、投顾类系统的开发运维，\nJava+**ETL开发，本科**\n**熟悉恒 生基金投顾系统、恒生资 配配置系统、金证柜台系 统，金证清算系统者优先**', interview: '线上笔试+线上面试', address: '罗湖（国信证券大厦）', pm: '李光宇' },
      { skills: '1. 参与投资交易支持系统、鑫投管平台等系统的后端开发、维护和优化工作。\n2. 研究并运用AI工具对开发赋能。\n3. 本科4年，**大专6年**', interview: '线上笔试+**现场/线上面试**', address: '罗湖（国信证券大厦）', pm: '陈运聪' }
    ] },
    { team: '', role: 'Python', roleNote: '', highlight: true, target: '1', salary: '13-16', years: '3-5年', rows: [
      { skills: 'python编程+数据库SQL\n35以下', interview: '线上笔试+**现场面试（二面）**', address: '孙：福田购物公园地铁站', pm: '孙鸿滨组' }
    ] },
    { team: '', role: 'Python', roleNote: '', highlight: true, target: '2', salary: '13-16', years: '3-5年', rows: [
      { skills: '1、负责数据集成平台的功能的开发与优化\n2、了解大数据Hadoop、GP等常规的大数据技能，以及对datax等数据同步组件有一定的应用能力\n3、有一定的AI工程应用实践能力\n本科', interview: '线上笔试+线上面试', address: '罗湖红岭地铁站', pm: '周维健\n张金苓（现场面试）' }
    ] },
    { team: '', role: 'C++', roleNote: '', highlight: true, target: '1', salary: '13-16', years: '3年以上', rows: [
      { skills: '行情中心数据客户端、认证系统、行情网关程序的开发与测试。\nC++软件系统开发经验\n专科以上学历', interview: '线上笔试+线上面试', address: '罗湖红岭地铁站', pm: '王斌' },
      { skills: '负责债券量化交易系统的开发工作\n 具有两年以上 C++项目开发经验，**熟悉QT框架**\n有**AI coding**的项目经验较优先', interview: '线上笔试+线上面试', address: '罗湖红岭地铁站', pm: '唐聪林' }
    ] }
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


function normalizeGuoxin(g) {
  g = g && typeof g === 'object' ? g : {};
  const S = (v) => (v == null ? '' : String(v)).replace(/\r\n/g, '\n');
  const T = (v) => S(v).trim();
  return {
    title: typeof g.title === 'string' ? g.title : '当日需求重点(活跃岗位)-重点看“紧急状态”',
    groups: Array.isArray(g.groups) ? g.groups.map((x) => ({
      team: T(x?.team), role: T(x?.role), roleNote: T(x?.roleNote), highlight: x?.highlight !== false,
      target: T(x?.target), salary: T(x?.salary), years: T(x?.years),
      rows: (Array.isArray(x?.rows) && x.rows.length ? x.rows : [{}]).map((r) => ({
        skills: T(r?.skills), interview: T(r?.interview), address: T(r?.address), pm: T(r?.pm)
      }))
    })) : []
  };
}
// 旧「需求表」数据 → 国信看板：相邻同岗位成一组，每日可推求和为当日简历目标；
// 其余列（已推荐/紧急程度/备注）并入重点技能，避免丢数据
function migrateDemandToGuoxin(demand) {
  const d = normalizeDemand(demand);
  const groups = [];
  d.rows.forEach((r) => {
    let g = groups[groups.length - 1];
    if (!g || g.role !== r.role) { g = { team: '', role: r.role, roleNote: '', highlight: true, target: 0, _hasNum: false, salary: '', years: '', rows: [] }; groups.push(g); }
    const n = parseFloat(r.daily);
    if (!isNaN(n)) { g.target += n; g._hasNum = true; }
    const extra = [];
    if (r.recommended) extra.push(`已推荐：${r.recommended}`);
    if (r.urgency) extra.push(/紧急|重点/.test(r.urgency) ? `**紧急程度：${r.urgency}**` : `紧急程度：${r.urgency}`);
    if (r.note) extra.push(`备注：${r.note}`);
    g.rows.push({ skills: [r.direction, extra.join('；')].filter(Boolean).join('\n'), interview: '', address: '', pm: r.pm });
  });
  groups.forEach((g) => { g.target = g._hasNum ? String(g.target) : ''; delete g._hasNum; });
  return normalizeGuoxin({ title: '当日需求重点(活跃岗位)-重点看“紧急状态”', groups });
}

const BoardTemplates = {
  cards: {
    label: '易方达看板（面试 + 优先岗位）',
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
        parts.push('- progress = 若表里有「进展」列就填其原文；否则把「每日可推」「已推荐」「紧急程度」「备注」四列按此格式拼接：「每日可推：5；已推荐：2；紧急程度：紧急；备注：要求较高」（顺序固定，用中文分号「；」分隔，单元格为空的那一项整项省略，四项都空就留空）');
        parts.push('- featured = 「紧急程度」为「紧急」或「重点推进」（或标了重点/加急）时 true，「一般」或没有时 false');
        parts.push('「序号」列不需要返回。请把该表填入 roles。');
      }
      if (hasB) parts.push('其中一张图是「今日面试跟进」：提取候选人姓名、一面/二面、时间（when），填入 interviews；若图中有日期也可填 date。');
      if (hasA && !hasB) parts.push('本次只有岗位表，interviews 请返回空数组 []，date 可空。');
      if (hasB && !hasA) parts.push('本次只有面试跟进图，roles 请返回空数组 []。');
      return parts.join('\n');
    }
  },
  guoxin: {
    label: '国信看板（当日需求重点表）',
    boardSrc: 'board-guoxin.html',
    boardWidth: 2000,
    formSelector: '#form-guoxin',
    ocrUploads: { a: '国信需求表截图', b: null },
    sample() { return structuredClone(GUOXIN_SAMPLE); },
    empty() { return { title: '当日需求重点(活跃岗位)-重点看“紧急状态”', groups: [] }; },
    ocrPrompt() {
      return [
        '你是招聘需求表信息提取助手。请从截图中提取表格，只返回 JSON，不要解释，不要用 markdown 代码块。',
        '逐格忠实抄写，不要编造、不要改写、不要概括；看不清或空白的单元格留空字符串。单元格里的换行用 \\n 保留。',
        '表格结构：第一行是标题（例如「当日需求重点(活跃岗位)-重点看“紧急状态”」）填 title。',
        '列：项目组、岗位、当日简历目标、薪资、年限、重点技能、面试方式、详细地址、备注。',
        '「岗位」「当日简历目标」「薪资」「年限」「项目组」通常是合并单元格，覆盖多行——每个这样的合并块是 groups 里的一项；它覆盖的每一行是该组 rows 里的一项。',
        'role = 岗位名称（如「测试」「Java」）；岗位格里括号补充说明（如「(优先统招本科，现场面试)」）放 roleNote。',
        '每个子行：skills = 重点技能，interview = 面试方式，address = 详细地址，pm = 「备注」列（该列内容是项目经理姓名）。',
        '面试方式、详细地址如果是合并单元格覆盖多行，请复制到它覆盖的每一行。',
        '原图中红色字体的文字，用 **两个星号** 包起来，例如「线上笔试+**现场面试**」。',
        'JSON 结构必须严格为：',
        '{"date":"","title":"","groups":[{"team":"","role":"","roleNote":"","target":"","salary":"","years":"","rows":[{"skills":"","interview":"","address":"","pm":""}]}]}'
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
window.normalizeGuoxin = normalizeGuoxin;
window.migrateDemandToGuoxin = migrateDemandToGuoxin;
