/* 模板注册表：每种模板定义 表单区块 / 看板页面 / 识图提示词 / 示例数据。
   新增模板：在 BoardTemplates 里加一项，并提供对应的 board-*.html 与表单区块。 */


// 国信看板：一个岗位分组（岗位/当日招聘目标/薪资/年限/项目组）含多条子行
// （重点描述/面试方式/详细地址/备注）。单元格里用 **文字** 标红。
// 示例来自国信旧表截图，字段名与已保存数据的键保持一致。
const GUOXIN_SAMPLE = {
  title: '当日需求重点(活跃岗位)-重点看“紧急状态”',
  groups: [
    { team: '', role: '产品经理', roleNote: '', highlight: true, target: '2', salary: '14-15.5', years: '3年以上', rows: [
      { skills: '本科以上学历\n熟悉金融市场与产品体系，了解股票、基金、基金投顾等投资流程；\n关键词：内部管理、流程、代销、产品中心、基金，年龄30岁以下，多留意女性', interview: '线上笔试+线上面试', address: '罗湖（国信证券大厦）', pm: '余才-运营产品与质量组' },
      { skills: '数据类产品---运营支持组(资讯数据组)', interview: '线上笔试+线上面试', address: '罗湖（国信证券大厦）', pm: '彭红江' }
    ] },
    { team: '', role: 'Java', roleNote: '（优先统招本科）', highlight: true, target: '4', salary: '13-16', years: '3年以上', rows: [
      { skills: '1，负责资产配置、基金评价、量化股票策略投研工作平台等系统核心模块设计与开发。\n2，大专4年以上，28以上', interview: '线上笔试+线上面试', address: '罗湖（国信证券大厦）', pm: '燕振华' },
      { skills: '**推高级需求（5年以上）**\n1. 优先有**大厂后端**相关经验，熟悉编译工具配置管理、 （非业务类开发经验）\n2. 开发语言：Java为主，具备扎实的Java基础能力。\n3. 有AI经验，33以下', interview: '线上笔试+线上面试', address: '罗湖（国信证券大厦）', pm: '庄晓雯\n（要求较高）' },
      { skills: '**推高级需求（5年以上）**\n负责内部自研平台盘古技术运营平台、天机资源成本管理平台、鲁班运维一体化平台、防火墙策略管理平台的后台研发工作\n**具备AI编程相关技能，年龄：35岁以下**', interview: '线上笔试+线上面试', address: '罗湖（国信证券大厦）', pm: '邴昊天\n线上一面+线上笔试+**现场二面**' },
      { skills: '1、资产托管部八爪鱼系统等自研系统的开发工作\n2、熟悉Java、vue、AI Coding\n3、**专科5年起**，本科3年起', interview: '线上笔试+线上面试', address: '福田购物公园地铁站', pm: '梁志财' }
    ] },
    { team: '', role: 'Python', roleNote: '', highlight: true, target: '2', salary: '16-18', years: '5年以上', rows: [
      { skills: '**推高级需求（5年以上）**\n1、自动化测试平台的测试开发工作\n2、有Java\\C++\\Python项目开发经验，有大型金融项目开发经验优先\n3、优先一本及以上学历，有华为、网易等大厂经验', interview: '线下笔试+线下面试', address: '罗湖（国信证券大厦）', pm: '张金苓' }
    ] }
  ]
};

// 鹏华看板：一行一个岗位。备注在示例里留空，表单里始终可编辑。
const PENGHUA_SAMPLE = {
  roles: [
    { project: '鹏华基金', title: 'ta测试', status: '开启', urgency: '一般', interviewer: '李昭玥', deadline: '', headcount: '1', salary: '10-12k初级', note: '' },
    { project: '鹏华基金', title: 'ta后端-高', status: '开启', urgency: '一般', interviewer: '谢立东', deadline: '', headcount: '1', salary: '10-17k中级', note: '' },
    { project: '鹏华基金', title: '10.14测试', status: '开启', urgency: '紧急/重要', interviewer: '史玲丽', deadline: '', headcount: '2', salary: '10-14k中级', note: '' },
    { project: '鹏华基金', title: '投研-测试', status: '开启', urgency: '紧急/重要', interviewer: '陶冶', deadline: '', headcount: '1', salary: '10-13k中级', note: '' },
    { project: '鹏华基金', title: '品牌宣传经理', status: '开启', urgency: '一般', interviewer: '庞春宇', deadline: '', headcount: '1', salary: '10-13k中级', note: '' },
    { project: '鹏华基金', title: '估值会计', status: '开启', urgency: '一般', interviewer: '李昭玥', deadline: '', headcount: '1', salary: '10-12k初级', note: '' },
    { project: '鹏华基金', title: '投研-java', status: '开启', urgency: '紧急/重要', interviewer: '王丁', deadline: '截至11.27 12点 (4/4)', headcount: '1', salary: '10-13k中级', note: '' }
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

function normalizePenghua(p) {
  p = p && typeof p === 'object' ? p : {};
  const S = (v) => (v == null ? '' : String(v)).replace(/\r\n/g, '\n').trim();
  const roles = Array.isArray(p.roles) ? p.roles : [];
  return {
    roles: roles.map((r) => ({
      project: S(r?.project),
      title: S(r?.title),
      status: S(r?.status),
      urgency: S(r?.urgency) || '一般',
      interviewer: S(r?.interviewer),
      deadline: S(r?.deadline),
      headcount: S(r?.headcount),
      salary: S(r?.salary),
      note: S(r?.note)
    }))
  };
}

const BoardTemplates = {
  cards: {
    label: '易方达看板（面试 + 优先岗位）',
    boardSrc: 'board-template.html',
    boardWidth: 1400,
    boardWidthLandscape: 2600,
    defaultOrientation: 'portrait',
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
    boardWidth: 1560,
    boardWidthLandscape: 2400,
    defaultOrientation: 'portrait',
    formSelector: '#form-guoxin',
    ocrUploads: { a: '国信需求表截图', b: null },
    sample() { return structuredClone(GUOXIN_SAMPLE); },
    empty() { return { title: '当日需求重点(活跃岗位)-重点看“紧急状态”', groups: [] }; },
    ocrPrompt() {
      return [
        '你是招聘需求表信息提取助手。请从截图中提取表格，只返回 JSON，不要解释，不要用 markdown 代码块。',
        '逐格忠实抄写，不要编造、不要改写、不要概括；看不清或空白的单元格留空字符串。单元格里的换行用 \\n 保留。',
        '表格结构：第一行是标题（例如「当日需求重点(活跃岗位)-重点看“紧急状态”」）填 title。',
        '列：项目组、岗位、当日招聘目标（旧表也可能写「当日简历目标」）、薪资、年限、重点描述（旧表也可能写「重点技能」）、面试方式、详细地址、备注。',
        '「岗位」「当日招聘目标」「薪资」「年限」「项目组」通常是合并单元格，覆盖多行——每个这样的合并块是 groups 里的一项；它覆盖的每一行是该组 rows 里的一项。',
        'role = 岗位名称（如「产品经理」「Java」「Python」）；岗位格里括号补充说明（如「（优先统招本科）」）放 roleNote，不要并进 role。',
        'target = 当日招聘目标，salary = 薪资，years = 年限，team = 项目组（空着就空字符串）。',
        '每个子行：skills = 重点描述，interview = 面试方式，address = 详细地址，pm = 备注（可含人名，也可含其他说明，换行保留）。',
        '面试方式、详细地址如果是合并单元格覆盖多行，请复制到它覆盖的每一行。',
        '原图中红色字体的文字，用 **两个星号** 包起来，例如「**推高级需求（5年以上）**」「优先有**大厂后端**相关经验」「线上笔试+**现场二面**」。黄底岗位名不要加星号。',
        'JSON 结构必须严格为：',
        '{"date":"","title":"","groups":[{"team":"","role":"","roleNote":"","target":"","salary":"","years":"","rows":[{"skills":"","interview":"","address":"","pm":""}]}]}'
      ].join('\n');
    }
  },
  penghua: {
    label: '鹏华看板（岗位需求表）',
    boardSrc: 'board-penghua.html',
    boardWidth: 1480,
    boardWidthLandscape: 2200,
    defaultOrientation: 'portrait',
    formSelector: '#form-penghua',
    ocrUploads: { a: '鹏华岗位表截图', b: null },
    sample() { return structuredClone(PENGHUA_SAMPLE); },
    empty() { return { roles: [] }; },
    ocrPrompt() {
      return [
        '你是招聘岗位表信息提取助手。请从截图中提取表格，只返回 JSON，不要解释，不要用 markdown 代码块。',
        '逐格忠实抄写，不要编造、不要改写、不要概括；看不清或空白的单元格留空字符串。',
        '忽略水印（例如斜着的「宋德科」「文静」），不要写进任何字段。',
        '每一行岗位是 roles 里的一项，按表中从上到下的顺序。列映射：',
        'project = 项目名称；title = 岗位名称；status = 岗位状态（如「开启」）；',
        'urgency = 紧急程度：红底或写着「紧急/重要」填「紧急/重要」，「一般」或黄底一般填「一般」；',
        'interviewer = 面试官，姓名原样抄写；deadline = 截止时间，原样抄写（例如「截至11.27 12点 (4/4)」），单元格为空就空字符串；',
        'headcount = 需求数；salary = 薪资范围；note = 备注。没有备注列，或单元格为空，note 用空字符串，不要自己写备注。',
        'JSON 结构必须严格为：',
        '{"date":"","roles":[{"project":"","title":"","status":"","urgency":"一般","interviewer":"","deadline":"","headcount":"","salary":"","note":""}]}'
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
window.normalizePenghua = normalizePenghua;
window.migrateDemandToGuoxin = migrateDemandToGuoxin;
