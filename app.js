/* 易方达招聘看板生成器 — 表单状态与看板绑定 */

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
  ]
};

let state = structuredClone(DEFAULT_DATA);
let boardReady = false;
let pendingPush = false;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function getIframe() {
  return $('#board-frame');
}

function pushToBoard() {
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
      iframe.contentWindow.renderBoard(state);
      boardReady = true;
      pendingPush = false;
      return;
    }
  } catch (e) {
    /* cross-origin or not loaded */
  }
  try {
    iframe.contentWindow.postMessage({ type: 'BOARD_DATA', payload: state }, '*');
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
  state = { date, interviews, roles };
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
  ivEditor.innerHTML = state.interviews.length
    ? state.interviews.map(ivCardHTML).join('')
    : '<p class="editor-empty">暂无面试，点击下方「添加面试」</p>';
  roleEditor.innerHTML = state.roles.length
    ? state.roles.map(roleCardHTML).join('')
    : '<p class="editor-empty">暂无岗位，点击下方「添加岗位」</p>';
  $('#field-date').value = state.date || '';
  $('#iv-count').textContent = String(state.interviews.length);
  $('#role-count').textContent = String(state.roles.length);
}

function syncFromFormAndPreview() {
  collectStateFromForm();
  $('#iv-count').textContent = String(state.interviews.length);
  $('#role-count').textContent = String(state.roles.length);
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

function exportJSON() {
  collectStateFromForm();
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  const stamp = (state.date || 'board').replace(/[^\d\w\u4e00-\u9fff-]+/g, '_');
  a.href = URL.createObjectURL(blob);
  a.download = `招聘看板_${stamp}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || typeof data !== 'object') throw new Error('格式不对');
      state = {
        date: data.date || '',
        interviews: Array.isArray(data.interviews) ? data.interviews : [],
        roles: Array.isArray(data.roles) ? data.roles : []
      };
      renderEditors();
      pushToBoard();
      setStatus('已导入 JSON');
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

  $('#btn-add-iv').addEventListener('click', addInterview);
  $('#btn-add-role').addEventListener('click', addRole);
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

window.BoardApp = {
  getState: getBoardState,
  pushToBoard,
  setStatus,
  getIframe
};

document.addEventListener('DOMContentLoaded', () => {
  state = structuredClone(DEFAULT_DATA);
  renderEditors();
  bindEvents();
  // Initial push after short delay in case iframe loads first
  setTimeout(pushToBoard, 100);
});
