/* 招聘看板生成器 — 多客户表单状态与看板绑定 */

const DEFAULT_DATA = {
  date: '2026年10月14日',
  interviews: [
    { name: '林洽', round: '二面', when: '今天下午 17:00' }
  ],
  roles: [
    {
      title: '开发工程师 (全栈)',
      team: 'ims权益投交项目组',
      note: '有AI经验，熟练掌握JAVA，愿学其他技术栈，男性优先；PM偏好技术经验丰富、学历好、有AI落地或华为OD经验；控制新增，5年以下不超过 18.5k',
      progress: '需求较多，各组筛选较快，可一直重点跟进',
      featured: true
    },
    {
      title: 'iOS开发',
      team: 'AI工程团队',
      note: '尽量工作 5-10 年，复杂业务有实际经验',
      progress: '笔试通过率较低，需重点跟进',
      featured: false
    },
    {
      title: '开发工程师 (JAVA)',
      team: '投顾系统组',
      note: '有相关工作优先，或复杂、高风险系统均可；不推荐3年以下；需会前端vue2、AI编程',
      progress: '新需求',
      featured: false
    },
    {
      title: '开发工程师 (数据仓库)',
      team: 'AI平台与数据工程部-数据库团',
      note: '实际需招JAVA后端开发，同时也愿意做数据开发的人选',
      progress: '新需求，暂无人选面试',
      featured: false
    },
    {
      title: '开发工程师 (Java)',
      team: '基金运营团队-估值清算团',
      note: '参考曾晓东、冯上超的简历，学历较好、项目经验好的人选',
      progress: '德科一人进入二面',
      featured: false
    },
    {
      title: '开发工程师 (全栈)',
      team: '清算结算团',
      note: '新开岗位，可参考ims全栈，主要为做信创改造',
      progress: '新岗位，未投入',
      featured: false
    },
    {
      title: '测试工程师',
      team: 'ims权益投交项目组',
      note: '有AI经验，会Python、Java；一本以上；学历好但项目经验不足的不推荐；名校应届有好实习也可；可按AI测试/自动化测试招聘；有空窗期需说明',
      progress: '还差1个名额，各家进展较慢，德科一人一面',
      featured: false
    },
    {
      title: '测试工程师 (开发)',
      team: 'iSALE测试团',
      note: '学历好，最好985/211；3年左右经验，有代码量要求；重点关注证券/基金类开发测试，尤其有信创经验',
      progress: '金证8月底通过一人，9月入场',
      featured: false
    }
  ],
  celebrate: {
    enabled: false,
    kicker: '恭喜',
    summary: '',
    cheer: '继续加油，再接再入！',
    people: []
  }
};


const CLIENTS_KEY = 'recruit_board_clients_v1';
const DEFAULT_CLIENT = '易方达';
let clientStore = null; // { current, clients: { name: data } }

function todayCN() {
  const d = new Date();
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}
function defaultCelebrate() {
  return {
    enabled: false,
    kicker: '恭喜',
    summary: '',
    cheer: '继续加油，再接再入！',
    people: []
  };
}
function normalizeCelebrate(c) {
  c = c && typeof c === 'object' ? c : {};
  return {
    enabled: !!c.enabled,
    kicker: typeof c.kicker === 'string' ? c.kicker : '恭喜',
    summary: typeof c.summary === 'string' ? c.summary : '',
    cheer: typeof c.cheer === 'string' ? c.cheer : '继续加油，再接再入！',
    people: Array.isArray(c.people) ? c.people.map((p) => ({
      name: String(p?.name || '').trim(),
      title: String(p?.title || '').trim(),
      follow: String(p?.follow || '').trim(),
      note: String(p?.note || '').trim()
    })) : []
  };
}
function emptyClientData(templateType) {
  const t = BoardTemplates[templateType] ? templateType : 'cards';
  return {
    templateType: t,
    date: todayCN(), interviews: [], roles: [], celebrate: defaultCelebrate(),
    demand: normalizeDemand(t === 'demandTable' ? BoardTemplates.demandTable.empty() : null)
  };
}
function eFundDefault() {
  const d = structuredClone(DEFAULT_DATA);
  d.templateType = 'cards';
  d.demand = normalizeDemand(null);
  return d;
}
function loadClientStore() {
  try {
    const raw = JSON.parse(localStorage.getItem(CLIENTS_KEY) || 'null');
    if (raw && raw.clients && Object.keys(raw.clients).length) {
      if (!raw.clients[raw.current]) raw.current = Object.keys(raw.clients)[0];
      for (const k of Object.keys(raw.clients)) {
        raw.clients[k] = normalizeClientData(raw.clients[k]);
      }
      return raw;
    }
  } catch (e) { /* ignore */ }
  // migrate: no previous per-client data existed; seed 易方达 with sample
  return { current: DEFAULT_CLIENT, clients: { [DEFAULT_CLIENT]: eFundDefault() } };
}
function saveClientStore() {
  if (!clientStore || !clientStore.clients[clientStore.current]) return;
  try {
    clientStore.clients[clientStore.current] = normalizeClientData(state);
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clientStore));
  } catch (e) { console.warn('save failed', e); }
}
function getClient() { return clientStore ? clientStore.current : DEFAULT_CLIENT; }
function boardPayload() { return { ...state, client: getClient() }; }

function renderClientSelect() {
  const sel = $('#client-select');
  if (!sel) return;
  sel.innerHTML = Object.keys(clientStore.clients)
    .map((n) => `<option value="${escapeAttr(n)}"${n === clientStore.current ? ' selected' : ''}>${escapeText(n)}</option>`)
    .join('');
  $('#btn-client-delete').disabled = Object.keys(clientStore.clients).length <= 1;
}
function loadClient(name) {
  clientStore.current = name;
  const d = clientStore.clients[name] || emptyClientData();
  state = structuredClone(normalizeClientData(d));
  renderClientSelect();
  applyTemplateView(state.templateType);
  renderEditors();
  pushToBoard();
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clientStore));
}
function switchClient(name) {
  collectStateFromForm();
  saveClientStore();
  loadClient(name);
  updateUndoOcrButton();
  window.dispatchEvent(new CustomEvent('client-switched', { detail: { to: name } }));
  setStatus(`已切换到「${name}」`);
}
function askClientName(msg, def) {
  const n = (prompt(msg, def || '') || '').trim();
  if (!n) return null;
  if (clientStore.clients[n] && n !== def) { alert('已有同名客户'); return null; }
  return n;
}
function addClient() {
  const dlg = $('#client-dialog');
  if (!dlg || typeof dlg.showModal !== 'function') {
    const n = askClientName('新客户名称（例如：华夏）');
    if (n) createClient(n, 'cards');
    return;
  }
  $('#new-client-name').value = '';
  $('#new-client-template').innerHTML = templateOptionsHTML('cards');
  $('#new-client-error').textContent = '';
  dlg.showModal();
  setTimeout(() => $('#new-client-name').focus(), 30);
}
function confirmAddClient(e) {
  if (e) e.preventDefault();
  const n = ($('#new-client-name').value || '').trim();
  const t = $('#new-client-template').value;
  if (!n) { $('#new-client-error').textContent = '请填写客户名称'; return; }
  if (clientStore.clients[n]) { $('#new-client-error').textContent = '已有同名客户'; return; }
  $('#client-dialog').close();
  createClient(n, t);
}
function createClient(n, t) {
  collectStateFromForm();
  saveClientStore();
  clientStore.clients[n] = emptyClientData(t);
  loadClient(n);
  updateUndoOcrButton();
  window.dispatchEvent(new CustomEvent('client-switched', { detail: { to: n } }));
  setStatus(`已新增客户「${n}」（${getTemplate(t).label}）`);
}
function templateOptionsHTML(selected) {
  return Object.keys(BoardTemplates).map((k) =>
    `<option value="${k}"${k === selected ? ' selected' : ''}>${escapeText(BoardTemplates[k].label)}</option>`).join('');
}
function changeTemplateType(t) {
  if (!BoardTemplates[t] || t === state.templateType) return;
  if (!confirm(`把「${getClient()}」的模板改为「${getTemplate(t).label}」？两种模板的数据都会保留，可随时切回。`)) {
    $('#client-template').value = state.templateType;
    return;
  }
  collectStateFromForm();
  state.templateType = t;
  saveClientStore();
  loadClient(getClient());
  window.dispatchEvent(new CustomEvent('client-switched', { detail: { to: getClient() } }));
  setStatus(`模板已改为「${getTemplate(t).label}」`);
}
function restoreEfund() {
  if (!confirm('把「易方达」恢复为内置的 10月14日 原内容？易方达当前的数据会被覆盖（其他客户不受影响）。')) return;
  if (clientStore.current !== DEFAULT_CLIENT) { collectStateFromForm(); saveClientStore(); }
  clientStore.clients[DEFAULT_CLIENT] = eFundDefault();
  loadClient(DEFAULT_CLIENT);
  updateUndoOcrButton();
  window.dispatchEvent(new CustomEvent('client-switched', { detail: { to: DEFAULT_CLIENT } }));
  setStatus('易方达已恢复为 10月14日 原内容');
}
let currentBoardSrc = null;
function applyTemplateView(type) {
  const tpl = getTemplate(type);
  Object.keys(BoardTemplates).forEach((k) => {
    const el = $(BoardTemplates[k].formSelector);
    if (el) el.hidden = k !== type;
  });
  const sel = $('#client-template');
  if (sel) sel.innerHTML = templateOptionsHTML(type);
  window.currentBoardWidth = tpl.boardWidth;
  const iframe = getIframe();
  if (iframe && currentBoardSrc !== tpl.boardSrc) {
    currentBoardSrc = tpl.boardSrc;
    boardReady = false;
    if (!iframe.getAttribute('src') || !iframe.getAttribute('src').startsWith(tpl.boardSrc)) {
      iframe.setAttribute('src', tpl.boardSrc);
    }
  }
  if (typeof window.fitPreview === 'function') window.fitPreview();
  window.dispatchEvent(new CustomEvent('template-changed', { detail: { type } }));
}
function renameClient() {
  const old = clientStore.current;
  const n = askClientName('重命名客户', old);
  if (!n || n === old) return;
  collectStateFromForm();
  const rebuilt = {};
  for (const k of Object.keys(clientStore.clients)) rebuilt[k === old ? n : k] = clientStore.clients[k];
  clientStore.clients = rebuilt;
  clientStore.current = n;
  saveClientStore();
  renderClientSelect();
  pushToBoard();
  try { const b = JSON.parse(localStorage.getItem(OCR_BACKUP_KEY) || 'null'); if (b && b.client === old) { b.client = n; localStorage.setItem(OCR_BACKUP_KEY, JSON.stringify(b)); } } catch (e) { /* ignore */ }
  window.dispatchEvent(new CustomEvent('client-renamed', { detail: { from: old, to: n } }));
  updateUndoOcrButton();
  setStatus(`已重命名为「${n}」`);
}
function deleteClient() {
  const names = Object.keys(clientStore.clients);
  if (names.length <= 1) { alert('至少保留一个客户'); return; }
  const cur = clientStore.current;
  if (!confirm(`确定删除客户「${cur}」及其数据？`)) return;
  delete clientStore.clients[cur];
  loadClient(Object.keys(clientStore.clients)[0]);
  setStatus(`已删除「${cur}」`);
}

let state = eFundDefault();
let boardReady = false;
let pendingPush = false;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function getIframe() {
  return $('#board-frame');
}

function pushToBoard() {
  if (clientStore) saveClientStore();
  const iframe = getIframe();
  if (!iframe || !iframe.contentWindow) {
    pendingPush = true;
    return;
  }
  if (!boardReady) {
    pendingPush = true;
    // Still try — board may already have renderBoard
  }
  try {
    if (iframe.contentWindow.renderBoard) {
      iframe.contentWindow.renderBoard(boardPayload());
      boardReady = true;
      pendingPush = false;
      return;
    }
  } catch (e) {
    /* cross-origin or not loaded */
  }
  try {
    iframe.contentWindow.postMessage({ type: 'BOARD_DATA', payload: boardPayload() }, '*');
  } catch (e) {
    console.warn('pushToBoard failed', e);
  }
}

function collectStateFromForm() {
  const date = ($('#field-date') && $('#field-date').value.trim()) || '';
  const interviews = $$('#iv-editor .item-card').map((card) => ({
    name: (card.querySelector('[data-field="name"]')?.value || '').trim(),
    round: card.querySelector('[data-field="round"]')?.value || '一面',
    when: (card.querySelector('[data-field="when"]')?.value || '').trim()
  }));
  const roles = $$('#role-editor .item-card').map((card) => ({
    title: (card.querySelector('[data-field="title"]')?.value || '').trim(),
    team: (card.querySelector('[data-field="team"]')?.value || '').trim(),
    note: (card.querySelector('[data-field="note"]')?.value || '').trim(),
    progress: (card.querySelector('[data-field="progress"]')?.value || '').trim(),
    featured: !!(card.querySelector('[data-field="featured"]')?.checked)
  }));
  const people = $$('#cele-editor .item-card').map((card) => ({
    name: (card.querySelector('[data-field="name"]')?.value || '').trim(),
    title: (card.querySelector('[data-field="title"]')?.value || '').trim(),
    follow: (card.querySelector('[data-field="follow"]')?.value || '').trim(),
    note: (card.querySelector('[data-field="note"]')?.value || '').trim()
  }));
  const celebrate = {
    enabled: !!$('#cele-enabled')?.checked,
    kicker: ($('#cele-kicker')?.value || '').trim() || '恭喜',
    summary: ($('#cele-summary')?.value || '').trim(),
    cheer: ($('#cele-cheer')?.value || '').trim(),
    people
  };
  const demand = collectDemandFromForm();
  state = { templateType: state.templateType || 'cards', date, interviews, roles, celebrate, demand };
  return state;
}

function ivCardHTML(iv, idx) {
  const round = iv.round === '二面' ? '二面' : '一面';
  return `
    <div class="item-card" data-idx="${idx}">
      <div class="item-card-head">
        <span class="item-label">面试 #${idx + 1}</span>
        <button type="button" class="btn btn-danger btn-sm" data-action="remove-iv">删除</button>
      </div>
      <div class="field-row">
        <label>姓名</label>
        <input type="text" data-field="name" value="${escapeAttr(iv.name || '')}" placeholder="候选人姓名">
      </div>
      <div class="field-row two">
        <div>
          <label>轮次</label>
          <select data-field="round">
            <option value="一面"${round === '一面' ? ' selected' : ''}>一面</option>
            <option value="二面"${round === '二面' ? ' selected' : ''}>二面</option>
          </select>
        </div>
        <div>
          <label>时间</label>
          <input type="text" data-field="when" value="${escapeAttr(iv.when || '')}" placeholder="例如：今天下午 17:00">
        </div>
      </div>
    </div>`;
}

function roleCardHTML(role, idx) {
  return `
    <div class="item-card" data-idx="${idx}">
      <div class="item-card-head">
        <span class="item-label">岗位 #${idx + 1}</span>
        <button type="button" class="btn btn-danger btn-sm" data-action="remove-role">删除</button>
      </div>
      <div class="field-row">
        <label>岗位名称</label>
        <input type="text" data-field="title" value="${escapeAttr(role.title || '')}" placeholder="例如：开发工程师 (全栈)">
      </div>
      <div class="field-row">
        <label>团队</label>
        <input type="text" data-field="team" value="${escapeAttr(role.team || '')}" placeholder="例如：ims权益投交项目组">
      </div>
      <div class="field-row">
        <label>备注要求</label>
        <textarea data-field="note" rows="3" placeholder="任职要求、偏好等">${escapeText(role.note || '')}</textarea>
      </div>
      <div class="field-row">
        <label>进展</label>
        <input type="text" data-field="progress" value="${escapeAttr(role.progress || '')}" placeholder="不需要写「进展：」前缀">
      </div>
      <div class="field-row check">
        <label><input type="checkbox" data-field="featured"${role.featured ? ' checked' : ''}> 重点岗位</label>
      </div>
    </div>`;
}


function celeCardHTML(p, idx) {
  return `
    <div class="item-card" data-idx="${idx}">
      <div class="item-card-head">
        <span class="item-label">入职 #${idx + 1}</span>
        <button type="button" class="btn btn-danger btn-sm" data-action="remove-cele">删除</button>
      </div>
      <div class="field-row two">
        <div>
          <label>姓名</label>
          <input type="text" data-field="name" value="${escapeAttr(p.name || '')}" placeholder="入职同学">
        </div>
        <div>
          <label>岗位</label>
          <input type="text" data-field="title" value="${escapeAttr(p.title || '')}" placeholder="例如：全栈开发（IMS）">
        </div>
      </div>
      <div class="field-row two">
        <div>
          <label>跟进人</label>
          <input type="text" data-field="follow" value="${escapeAttr(p.follow || '')}" placeholder="例如：杨燕">
        </div>
        <div>
          <label>备注 / 状态</label>
          <input type="text" data-field="note" value="${escapeAttr(p.note || '')}" placeholder="例如：今天入职">
        </div>
      </div>
    </div>`;
}


function demandRowHTML(r, idx, total) {
  const opts = URGENCY_OPTIONS.map((u) => `<option value="${u}"${r.urgency === u ? ' selected' : ''}>${u}</option>`).join('');
  return `
    <div class="item-card" data-idx="${idx}">
      <div class="item-card-head">
        <span class="item-label">需求 #${idx + 1}</span>
        <span class="row-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-action="up-dm"${idx === 0 ? ' disabled' : ''} title="上移">↑</button>
          <button type="button" class="btn btn-ghost btn-sm" data-action="down-dm"${idx === total - 1 ? ' disabled' : ''} title="下移">↓</button>
          <button type="button" class="btn btn-danger btn-sm" data-action="remove-dm">删除</button>
        </span>
      </div>
      <div class="field-row two-even">
        <div><label>岗位</label><input type="text" data-field="role" value="${escapeAttr(r.role)}" placeholder="例如：Java开发"></div>
        <div><label>项目经理</label><input type="text" data-field="pm" value="${escapeAttr(r.pm)}"></div>
      </div>
      <div class="field-row three">
        <div><label>每日可推</label><input type="text" data-field="daily" value="${escapeAttr(r.daily)}" inputmode="numeric"></div>
        <div><label>已推荐</label><input type="text" data-field="recommended" value="${escapeAttr(r.recommended)}" inputmode="numeric"></div>
        <div><label>紧急程度</label><select data-field="urgency">${opts}</select></div>
      </div>
      <div class="field-row"><label>简历筛选方向</label><textarea data-field="direction" rows="3">${escapeText(r.direction)}</textarea></div>
      <div class="field-row"><label>备注</label><input type="text" data-field="note" value="${escapeAttr(r.note)}"></div>
    </div>`;
}
function collectDemandFromForm() {
  if (!$('#dm-editor')) return normalizeDemand(state.demand);
  const rows = $$('#dm-editor .item-card').map((card) => {
    const v = (f) => (card.querySelector(`[data-field="${f}"]`)?.value || '').trim();
    return { role: v('role'), pm: v('pm'), daily: v('daily'), recommended: v('recommended'), direction: v('direction'), urgency: v('urgency') || '一般', note: v('note') };
  });
  return normalizeDemand({
    demandCount: $('#dm-count')?.value || '',
    resumeTarget: $('#dm-target')?.value || '',
    rows
  });
}
function renderDemandEditor() {
  const ed = $('#dm-editor');
  if (!ed) return;
  const d = normalizeDemand(state.demand);
  state.demand = d;
  ed.innerHTML = d.rows.length ? d.rows.map((r, i) => demandRowHTML(r, i, d.rows.length)).join('')
    : '<p class="editor-empty">暂无需求，点击下方「添加需求」，或用截图识别 / 载入示例</p>';
  $('#dm-count').value = d.demandCount;
  $('#dm-target').value = d.resumeTarget;
  updateDemandAuto();
}
function updateDemandAuto() {
  const d = state.demand || { rows: [] };
  const sum = d.rows.reduce((a, r) => { const n = parseFloat(r.daily); return a + (isNaN(n) ? 0 : n); }, 0);
  if ($('#dm-count')) $('#dm-count').placeholder = `自动：${d.rows.length}`;
  if ($('#dm-target')) $('#dm-target').placeholder = `自动：${sum}`;
  if ($('#dm-row-count')) $('#dm-row-count').textContent = String(d.rows.length);
}
function demandMutate(fn) {
  collectStateFromForm();
  fn(state.demand.rows);
  renderEditors();
  pushToBoard();
}
function loadDemandSample() {
  if (state.demand.rows.length && !confirm('用截图里的示例需求表覆盖当前需求？')) return;
  collectStateFromForm();
  state.demand = normalizeDemand(BoardTemplates.demandTable.sample());
  renderEditors();
  pushToBoard();
  setStatus('已载入需求表示例');
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderEditors() {
  const ivEditor = $('#iv-editor');
  const roleEditor = $('#role-editor');
  const celeEditor = $('#cele-editor');
  const cele = normalizeCelebrate(state.celebrate);
  state.celebrate = cele;
  ivEditor.innerHTML = state.interviews.length
    ? state.interviews.map(ivCardHTML).join('')
    : '<p class="editor-empty">暂无面试，点击下方「添加面试」</p>';
  roleEditor.innerHTML = state.roles.length
    ? state.roles.map(roleCardHTML).join('')
    : '<p class="editor-empty">暂无岗位，点击下方「添加岗位」</p>';
  if (celeEditor) {
    celeEditor.innerHTML = cele.people.length
      ? cele.people.map(celeCardHTML).join('')
      : '<p class="editor-empty">暂无入职同学，打开开关后添加</p>';
  }
  $('#field-date').value = state.date || '';
  $('#iv-count').textContent = String(state.interviews.length);
  $('#role-count').textContent = String(state.roles.length);
  const celeCount = $('#cele-count');
  if (celeCount) celeCount.textContent = String(cele.people.length);
  const en = $('#cele-enabled');
  if (en) en.checked = !!cele.enabled;
  const kicker = $('#cele-kicker');
  if (kicker) kicker.value = cele.kicker || '恭喜';
  const summary = $('#cele-summary');
  if (summary) summary.value = cele.summary || '';
  const cheer = $('#cele-cheer');
  if (cheer) cheer.value = cele.cheer || '';
  const body = $('#cele-body');
  if (body) body.hidden = !cele.enabled;
  renderDemandEditor();
}

function syncFromFormAndPreview() {
  collectStateFromForm();
  $('#iv-count').textContent = String(state.interviews.length);
  $('#role-count').textContent = String(state.roles.length);
  const celeCount = $('#cele-count');
  if (celeCount) celeCount.textContent = String((state.celebrate?.people || []).length);
  const body = $('#cele-body');
  if (body) body.hidden = !state.celebrate?.enabled;
  updateDemandAuto();
  pushToBoard();
}

function addInterview() {
  collectStateFromForm();
  state.interviews.push({ name: '', round: '一面', when: '' });
  renderEditors();
  pushToBoard();
}

function addRole() {
  collectStateFromForm();
  state.roles.push({ title: '', team: '', note: '', progress: '', featured: false });
  renderEditors();
  pushToBoard();
}

function removeInterview(idx) {
  collectStateFromForm();
  state.interviews.splice(idx, 1);
  renderEditors();
  pushToBoard();
}

function removeRole(idx) {
  collectStateFromForm();
  state.roles.splice(idx, 1);
  renderEditors();
  pushToBoard();
}

function addCelebratePerson() {
  collectStateFromForm();
  if (!state.celebrate) state.celebrate = defaultCelebrate();
  state.celebrate.enabled = true;
  state.celebrate.people.push({ name: '', title: '', follow: '', note: '' });
  renderEditors();
  pushToBoard();
}

function removeCelebratePerson(idx) {
  collectStateFromForm();
  state.celebrate.people.splice(idx, 1);
  renderEditors();
  pushToBoard();
}

function exportJSON() {
  collectStateFromForm();
  const blob = new Blob([JSON.stringify({ client: getClient(), ...normalizeClientData(state) }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  const stamp = (state.date || 'board').replace(/[^\d\w\u4e00-\u9fff-]+/g, '_');
  a.href = URL.createObjectURL(blob);
  a.download = `${getClient()}招聘看板_${stamp}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || typeof data !== 'object') throw new Error('格式不对');
      const cname = typeof data.client === 'string' ? data.client.trim() : '';
      if (cname && cname !== getClient()) {
        collectStateFromForm();
        saveClientStore();
        if (!clientStore.clients[cname]) clientStore.clients[cname] = emptyClientData();
        clientStore.current = cname;
        renderClientSelect();
      }
      state = normalizeClientData(data);
      applyTemplateView(state.templateType);
      renderEditors();
      pushToBoard();
      setStatus(`已导入到「${getClient()}」`);
    } catch (e) {
      setStatus('导入失败：JSON 无效', true);
    }
  };
  reader.readAsText(file);
}

function setStatus(msg, isError) {
  const el = $('#status');
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle('error', !!isError);
  el.classList.toggle('ok', !isError && !!msg);
}

function bindEvents() {
  $('#field-date').addEventListener('input', syncFromFormAndPreview);

  $('#iv-editor').addEventListener('input', syncFromFormAndPreview);
  $('#iv-editor').addEventListener('change', syncFromFormAndPreview);
  $('#role-editor').addEventListener('input', syncFromFormAndPreview);
  $('#role-editor').addEventListener('change', syncFromFormAndPreview);
  const celeEd = $('#cele-editor');
  if (celeEd) {
    celeEd.addEventListener('input', syncFromFormAndPreview);
    celeEd.addEventListener('change', syncFromFormAndPreview);
    celeEd.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="remove-cele"]');
      if (!btn) return;
      const card = btn.closest('.item-card');
      const idx = Number(card?.dataset.idx);
      if (!Number.isNaN(idx)) removeCelebratePerson(idx);
    });
  }
  ['cele-enabled', 'cele-kicker', 'cele-summary', 'cele-cheer'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', syncFromFormAndPreview);
    el.addEventListener('change', () => {
      if (id === 'cele-enabled') {
        collectStateFromForm();
        renderEditors();
        pushToBoard();
      } else {
        syncFromFormAndPreview();
      }
    });
  });

  $('#iv-editor').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="remove-iv"]');
    if (!btn) return;
    const card = btn.closest('.item-card');
    const idx = Number(card?.dataset.idx);
    if (!Number.isNaN(idx)) removeInterview(idx);
  });

  $('#role-editor').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="remove-role"]');
    if (!btn) return;
    const card = btn.closest('.item-card');
    const idx = Number(card?.dataset.idx);
    if (!Number.isNaN(idx)) removeRole(idx);
  });

  $('#client-select').addEventListener('change', (e) => switchClient(e.target.value));
  $('#btn-client-add').addEventListener('click', addClient);
  $('#btn-client-rename').addEventListener('click', renameClient);
  $('#btn-client-delete').addEventListener('click', deleteClient);
  $('#btn-add-iv').addEventListener('click', addInterview);
  $('#btn-add-role').addEventListener('click', addRole);
  $('#btn-ocr-undo')?.addEventListener('click', undoLastOcr);
  $('#btn-restore-efund')?.addEventListener('click', restoreEfund);
  $('#client-template')?.addEventListener('change', (e) => changeTemplateType(e.target.value));
  $('#client-dialog-form')?.addEventListener('submit', confirmAddClient);
  $('#btn-client-dialog-cancel')?.addEventListener('click', () => $('#client-dialog').close());
  $('#btn-add-dm')?.addEventListener('click', () => demandMutate((rows) => {
    const last = rows[rows.length - 1];
    rows.push({ role: last ? last.role : '', pm: '', daily: '', recommended: '', direction: '', urgency: '一般', note: '' });
  }));
  $('#btn-dm-sample')?.addEventListener('click', loadDemandSample);
  ['dm-count', 'dm-target'].forEach((id) => $('#' + id)?.addEventListener('input', syncFromFormAndPreview));
  const dmEd = $('#dm-editor');
  if (dmEd) {
    dmEd.addEventListener('input', syncFromFormAndPreview);
    dmEd.addEventListener('change', syncFromFormAndPreview);
    dmEd.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const idx = Number(btn.closest('.item-card')?.dataset.idx);
      if (Number.isNaN(idx)) return;
      const a = btn.dataset.action;
      if (a === 'remove-dm') demandMutate((rows) => rows.splice(idx, 1));
      if (a === 'up-dm' && idx > 0) demandMutate((rows) => rows.splice(idx - 1, 0, rows.splice(idx, 1)[0]));
      if (a === 'down-dm') demandMutate((rows) => { if (idx < rows.length - 1) rows.splice(idx + 1, 0, rows.splice(idx, 1)[0]); });
    });
  }
  $('#btn-load-sample')?.addEventListener('click', (e) => { e.preventDefault(); loadSampleIntoCurrent(); });
  const addCele = $('#btn-add-cele');
  if (addCele) addCele.addEventListener('click', addCelebratePerson);
  $('#btn-refresh').addEventListener('click', () => {
    syncFromFormAndPreview();
    setStatus('预览已刷新');
  });
  $('#btn-export-json').addEventListener('click', exportJSON);
  $('#btn-import-json').addEventListener('click', () => $('#import-file').click());
  $('#import-file').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) importJSON(file);
    e.target.value = '';
  });

  window.addEventListener('message', (ev) => {
    if (ev.data && ev.data.type === 'BOARD_READY') {
      boardReady = true;
      pushToBoard();
    }
  });

  const iframe = getIframe();
  iframe.addEventListener('load', () => {
    boardReady = true;
    pushToBoard();
  });
}

function getBoardState() {
  collectStateFromForm();
  return state;
}


function mergeOcrInto(base, parsed, meta) {
  if (meta.templateType === 'demandTable') {
    const out = normalizeClientData(base);
    if (parsed.date && String(parsed.date).trim()) out.date = String(parsed.date).trim();
    const dm = normalizeDemand(parsed);
    out.demand = { demandCount: dm.demandCount, resumeTarget: dm.resumeTarget, rows: dm.rows };
    return out;
  }
  const out = {
    templateType: base.templateType || 'cards',
    demand: normalizeDemand(base.demand),
    date: base.date || '',
    interviews: Array.isArray(base.interviews) ? base.interviews.slice() : [],
    roles: Array.isArray(base.roles) ? base.roles.slice() : [],
    celebrate: normalizeCelebrate(base.celebrate) // OCR never touches celebrate
  };
  if (parsed.date && String(parsed.date).trim()) out.date = String(parsed.date).trim();
  if (meta.hasIv && Array.isArray(parsed.interviews)) {
    out.interviews = parsed.interviews.map((iv) => ({
      name: String(iv?.name || '').trim(),
      round: iv?.round === '二面' ? '二面' : '一面',
      when: String(iv?.when || '').trim()
    }));
  }
  if (meta.hasRoles && Array.isArray(parsed.roles)) {
    out.roles = parsed.roles.map((r) => ({
      title: String(r?.title || '').trim(),
      team: String(r?.team || '').trim(),
      note: String(r?.note || '').trim(),
      progress: String(r?.progress || '').trim(),
      featured: !!r?.featured
    }));
  }
  return out;
}

const OCR_BACKUP_KEY = 'recruit_board_ocr_backup_v1';

// Writes OCR result ONLY to targetClient (the client active when recognition started).
// Returns { ok, client, reason }.
function applyOcrResult(parsed, meta) {
  meta = meta || {};
  const target = meta.client;
  if (!target || !clientStore.clients[target]) {
    return { ok: false, reason: 'gone', client: target };
  }
  if (meta.templateType && (clientStore.clients[target].templateType || 'cards') !== meta.templateType) {
    return { ok: false, reason: 'template', client: target };
  }
  if (target === clientStore.current) {
    collectStateFromForm();
    saveClientStore();
  }
  const before = structuredClone(clientStore.clients[target]);
  try { localStorage.setItem(OCR_BACKUP_KEY, JSON.stringify({ client: target, data: before, at: Date.now() })); } catch (e) { /* ignore */ }
  const merged = mergeOcrInto(before, parsed, meta);
  clientStore.clients[target] = merged;
  if (target === clientStore.current) {
    state = structuredClone(merged);
    renderEditors();
    pushToBoard();
  }
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clientStore));
  updateUndoOcrButton();
  return { ok: true, client: target, current: target === clientStore.current };
}

function updateUndoOcrButton() {
  const btn = $('#btn-ocr-undo');
  if (!btn) return;
  let b = null;
  try { b = JSON.parse(localStorage.getItem(OCR_BACKUP_KEY) || 'null'); } catch (e) { b = null; }
  const ok = b && b.client && clientStore.clients[b.client];
  btn.hidden = !ok;
  if (ok) btn.textContent = `撤销上次识图（恢复「${b.client}」识图前数据）`;
}

function undoLastOcr() {
  let b = null;
  try { b = JSON.parse(localStorage.getItem(OCR_BACKUP_KEY) || 'null'); } catch (e) { b = null; }
  if (!b || !clientStore.clients[b.client]) return;
  if (!confirm(`把「${b.client}」恢复到上次识图之前的数据？`)) return;
  if (clientStore.current !== b.client) { collectStateFromForm(); saveClientStore(); }
  clientStore.clients[b.client] = normalizeClientData(b.data);
  localStorage.removeItem(OCR_BACKUP_KEY);
  loadClient(b.client);
  updateUndoOcrButton();
  setStatus(`已恢复「${b.client}」识图前数据`);
}

function normalizeClientData(d) {
  d = d || {};
  return {
    templateType: BoardTemplates[d.templateType] ? d.templateType : 'cards',
    demand: normalizeDemand(d.demand),
    date: d.date || '',
    interviews: Array.isArray(d.interviews) ? d.interviews : [],
    roles: Array.isArray(d.roles) ? d.roles : [],
    celebrate: normalizeCelebrate(d.celebrate)
  };
}

// Manual repair for polluted data: reload the built-in Oct 14 sample into the CURRENT client (confirm, never automatic)
function loadSampleIntoCurrent() {
  const c = getClient();
  if (!confirm(`用内置的 10月14日 示例数据覆盖「${c}」当前内容？（可先导出 JSON 备份）`)) return;
  if (state.templateType === 'demandTable') {
    state.demand = normalizeDemand(BoardTemplates.demandTable.sample());
  } else {
    const keep = state.demand;
    state = eFundDefault();
    state.demand = keep;
  }
  renderEditors();
  pushToBoard();
  setStatus(`「${c}」已载入示例数据`);
}

window.BoardApp = {
  getState: getBoardState,
  pushToBoard,
  setStatus,
  getIframe,
  applyOcrResult,
  getClient,
  getTemplateType: () => state.templateType || 'cards',
  hasClient: (n) => !!(clientStore && clientStore.clients[n])
};

document.addEventListener('DOMContentLoaded', () => {
  clientStore = loadClientStore();
  bindEvents();
  loadClient(clientStore.current);
  updateUndoOcrButton();
  // Initial push after short delay in case iframe loads first
  setTimeout(pushToBoard, 100);
});
