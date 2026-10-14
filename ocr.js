/* 招聘看板 — DeepSeek 识图填表（Key 仅存本机 localStorage） */

const OCR_STORAGE_KEY = 'efund_board_deepseek_settings';
const OCR_WARN_KEY = 'efund_board_deepseek_key_warned';

const DEFAULT_OCR_SETTINGS = {
  apiKey: '',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-flash'
};

let pendingParsed = null;
let pendingRunClient = null;
let uploadedRolesDataUrl = null;
let uploadedIvDataUrl = null;

function loadOcrSettings() {
  try {
    const raw = localStorage.getItem(OCR_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_OCR_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
      baseUrl: (parsed.baseUrl || DEFAULT_OCR_SETTINGS.baseUrl).replace(/\/+$/, ''),
      model: parsed.model || DEFAULT_OCR_SETTINGS.model
    };
  } catch {
    return { ...DEFAULT_OCR_SETTINGS };
  }
}

function saveOcrSettings(settings) {
  localStorage.setItem(OCR_STORAGE_KEY, JSON.stringify({
    apiKey: settings.apiKey || '',
    baseUrl: (settings.baseUrl || DEFAULT_OCR_SETTINGS.baseUrl).replace(/\/+$/, ''),
    model: settings.model || DEFAULT_OCR_SETTINGS.model
  }));
}

function maybeWarnAboutKey() {
  if (localStorage.getItem(OCR_WARN_KEY)) return;
  localStorage.setItem(OCR_WARN_KEY, '1');
  alert('提示：API Key 只保存在本机浏览器，勿在公共电脑上保存。');
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }
    if (file.size > 28 * 1024 * 1024) {
      reject(new Error('图片过大（建议小于 28MB）'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('读取图片失败'));
    reader.readAsDataURL(file);
  });
}

function buildOcrPrompt(hasRoles, hasIv) {
  const parts = [];
  parts.push('你是招聘看板信息提取助手。请从用户上传的招聘看板截图中提取内容，只返回 JSON，不要解释，不要用 markdown 代码块。');
  parts.push('不要编造；截图里没有的字段留空字符串或空数组。');
  parts.push('轮次只能是「一面」或「二面」。不要提取「需求人数」。');
  parts.push('JSON 结构必须严格为：');
  parts.push('{"date":"2026年10月14日或空字符串","interviews":[{"name":"","round":"一面|二面","when":""}],"roles":[{"title":"","team":"","note":"","progress":"","featured":false}]}');
  if (hasRoles) {
    parts.push('其中一张图是「优先岗位 / 招聘进度表」：把列映射为 title=岗位、team=团队、note=用人经理偏好（或备注要求）、progress=进展；若有重点/加急可设 featured=true，否则 false。请把该表填入 roles。');
  }
  if (hasIv) {
    parts.push('其中一张图是「今日面试跟进」：提取候选人姓名、一面/二面、时间（when），填入 interviews；若图中有日期也可填 date。');
  }
  if (hasRoles && !hasIv) {
    parts.push('本次只有岗位表，interviews 请返回空数组 []，date 可空。');
  }
  if (hasIv && !hasRoles) {
    parts.push('本次只有面试跟进图，roles 请返回空数组 []。');
  }
  return parts.join('\n');
}

function stripJsonFences(text) {
  let s = String(text || '').trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  return s;
}

// Post-process a card role from OCR: pull PM names into team, strip column-name prefixes and stray numeric columns
const PM_RE = /(?:项目经理|负责人|用人经理|PM)\s*[:：]\s*([^；;，,\n]+)/i;
function stripPrefix(t) {
  return String(t || '').replace(/^\s*(?:简历筛选方向|用人经理偏好|备注要求|备注|进展)\s*[:：]\s*/, '').trim();
}
function cleanCardRole(r) {
  const S = (v) => (v == null ? '' : String(v)).trim();
  const title = S(r?.title);
  let team = S(r?.team || r?.pm || r?.manager);
  let note = S(r?.note || r?.direction);
  let progress = S(r?.progress);
  // PM embedded in note/progress → team
  for (const field of ['note', 'progress']) {
    const v = field === 'note' ? note : progress;
    const m = v.match(PM_RE);
    if (m) {
      if (!team) team = m[1].trim();
      const cleaned = v.replace(PM_RE, '').replace(/^[；;，,\s]+|[；;，,\s]+$/g, '');
      if (field === 'note') note = cleaned; else progress = cleaned;
    }
  }
  team = team.replace(/^(?:项目经理|负责人|用人经理|PM)\s*[:：]\s*/i, '').trim();
  // collect the four columns from explicit fields, progress text, or note text
  const KEYS = ['每日可推', '已推荐', '紧急程度', '备注'];
  const vals = { 每日可推: S(r?.daily), 已推荐: S(r?.recommended), 紧急程度: S(r?.urgency), 备注: S(r?.remark) };
  const pull = (text) => {
    let rest = text;
    for (const k of KEYS) {
      const re = new RegExp(k + '\\s*[:：]\\s*([^；;]*)');
      const m = rest.match(re);
      if (m) { if (!vals[k]) vals[k] = m[1].trim(); rest = rest.replace(m[0], ''); }
    }
    return rest.replace(/^[；;，,\s]+|[；;，,\s]+$/g, '').replace(/[；;]\s*[；;]/g, '；');
  };
  note = stripPrefix(pull(note));
  const progRest = stripPrefix(pull(progress));
  const hasCols = KEYS.some((k) => vals[k]);
  if (hasCols) {
    if (progRest && !vals['备注']) vals['备注'] = progRest;
    progress = KEYS.filter((k) => vals[k]).map((k) => `${k}：${vals[k]}`).join('；');
  } else {
    progress = progRest;
  }
  const featured = !!r?.featured || /紧急|重点/.test(vals['紧急程度']);
  return { title, team, note, progress, featured };
}

function normalizeParsed(raw) {
  const out = {
    date: typeof raw.date === 'string' ? raw.date.trim() : '',
    interviews: [],
    roles: []
  };
  if (Array.isArray(raw.interviews)) {
    out.interviews = raw.interviews.map((iv) => ({
      name: String(iv?.name || '').trim(),
      round: iv?.round === '二面' ? '二面' : '一面',
      when: String(iv?.when || '').trim()
    })).filter((iv) => iv.name || iv.when);
  }
  if (Array.isArray(raw.roles)) {
    out.roles = raw.roles.map(cleanCardRole).filter((r) => r.title || r.team || r.note || r.progress);
  }
  return out;
}

async function callDeepSeekVision({ apiKey, baseUrl, model, dataUrls, hasRoles, hasIv, templateType }) {
  const tpl = getTemplate(templateType);
  const content = [
    { type: 'text', text: tpl.ocrPrompt(hasRoles, hasIv) }
  ];
  for (const url of dataUrls) {
    content.push({
      type: 'image_url',
      image_url: { url, detail: 'high' }
    });
  }

  const endpoint = `${baseUrl.replace(/\/+$/, '')}/v1/chat/completions`;
  let resp;
  try {
    resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content }],
        temperature: 0.1
      })
    });
  } catch (err) {
    const msg = String(err && err.message ? err.message : err);
    if (/Failed to fetch|NetworkError|CORS|cross-origin|Load failed/i.test(msg) || err.name === 'TypeError') {
      throw new Error('浏览器跨域被拦，请确认 Key 正确；若仍失败告诉我，我再加中转');
    }
    throw err;
  }

  if (!resp.ok) {
    let detail = '';
    try {
      const errBody = await resp.json();
      detail = errBody?.error?.message || JSON.stringify(errBody);
    } catch {
      detail = await resp.text().catch(() => '');
    }
    if (resp.status === 401 || resp.status === 403) {
      throw new Error('API Key 无效或无权限，请到设置里检查');
    }
    throw new Error(`DeepSeek 返回 ${resp.status}${detail ? '：' + detail.slice(0, 200) : ''}`);
  }

  const data = await resp.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('模型没有返回有效内容');
  let parsed;
  try {
    parsed = JSON.parse(stripJsonFences(text));
  } catch {
    throw new Error('模型返回不是合法 JSON，请重试或换更清晰的截图');
  }
  if (templateType === 'guoxin') {
    const gx = normalizeGuoxin(parsed);
    return { date: typeof parsed.date === 'string' ? parsed.date.trim() : '', title: typeof parsed.title === 'string' ? parsed.title.trim() : '', groups: gx.groups };
  }
  return normalizeParsed(parsed);
}

function setOcrStatus(msg, isError) {
  const el = document.getElementById('ocr-status');
  if (!el) return;
  el.textContent = msg || '';
  el.classList.toggle('error', !!isError);
  el.classList.toggle('ok', !isError && !!msg);
}

function showPreview(parsed, meta) {
  pendingParsed = { parsed, meta };
  const box = document.getElementById('ocr-preview');
  const pre = document.getElementById('ocr-preview-json');
  if (!box || !pre) return;
  pre.textContent = JSON.stringify(parsed, null, 2);
  const tgt = document.getElementById('ocr-target');
  if (tgt) tgt.textContent = `将写入客户：「${meta.client}」`;
  box.hidden = false;
  const cur = window.BoardApp.getClient();
  setOcrStatus(cur === meta.client ? '已识别，请核对后点「确认填入」' : `已识别，结果属于「${meta.client}」，确认后只写入该客户`);
}

function hidePreview() {
  pendingParsed = null;
  const box = document.getElementById('ocr-preview');
  if (box) box.hidden = true;
  const pre = document.getElementById('ocr-preview-json');
  if (pre) pre.textContent = '';
}

function applyPendingToForm() {
  if (!pendingParsed || !window.BoardApp || typeof window.BoardApp.applyOcrResult !== 'function') {
    setOcrStatus('无法写入表单', true);
    return;
  }
  const { parsed, meta } = pendingParsed;
  const res = window.BoardApp.applyOcrResult(parsed, meta);
  hidePreview();
  pendingRunClient = null;
  if (res && res.reason === 'template') {
    setOcrStatus(`客户「${meta.client}」的模板已更换，识别结果已丢弃，请重新识别`, true);
    return;
  }
  if (!res || !res.ok) {
    setOcrStatus(`客户「${meta.client}」已不存在，识别结果已丢弃`, true);
    return;
  }
  const msg = res.current ? `已填入「${res.client}」，可再微调` : `已写入「${res.client}」（当前显示的客户未改动）`;
  setOcrStatus(msg);
  window.BoardApp.setStatus(msg);
}


// ---- 截图槽：文件选择 / 粘贴 / 拖入 ----
const SLOTS = {
  a: { input: 'ocr-roles-file', get: () => uploadedRolesDataUrl, set: (v) => { uploadedRolesDataUrl = v; }, msg: '已添加截图 A' },
  b: { input: 'ocr-iv-file', get: () => uploadedIvDataUrl, set: (v) => { uploadedIvDataUrl = v; }, msg: '已添加截图 B' }
};
let lastFocusedSlot = null;
const pendingSlots = new Set();
function zoneOf(key) { return document.querySelector(`.paste-zone[data-slot="${key}"]`); }
function slotVisible(key) { const z = zoneOf(key); return !!z && !z.closest('.ocr-file-box')?.hidden; }
function renderSlot(key) {
  const z = zoneOf(key);
  if (!z) return;
  const url = SLOTS[key].get();
  z.querySelector('.pz-empty').hidden = !!url;
  const th = z.querySelector('.pz-thumb');
  th.hidden = !url;
  const img = th.querySelector('img');
  if (url) img.src = url; else img.removeAttribute('src');
}
async function setSlotFile(key, file) {
  const slot = SLOTS[key];
  if (!slot) return;
  if (file) file = asImageFile(file) || file;
  if (file && !/^image\//.test(file.type || '')) { notify('只支持图片（PNG / JPG / WebP / GIF）', true); return; }
  if (file) pendingSlots.add(key);
  try {
    slot.set(file ? await fileToDataUrl(file) : null);
    setOcrStatus(file ? slot.msg : '');
  } catch (err) {
    slot.set(null);
    setOcrStatus(err.message || '读取失败', true);
  } finally {
    pendingSlots.delete(key);
  }
  renderSlot(key);
  updateFileHints();
}
function clearSlot(key) {
  SLOTS[key].set(null);
  const inp = document.getElementById(SLOTS[key].input);
  if (inp) inp.value = '';
  renderSlot(key);
  updateFileHints();
  setOcrStatus('已移除截图');
}
function isTextTarget(el) {
  if (!el) return false;
  if (el.isContentEditable) return true;
  if (el.tagName === 'TEXTAREA') return true;
  if (el.tagName === 'INPUT') return !['file', 'checkbox', 'radio', 'button', 'submit'].includes((el.type || '').toLowerCase());
  return false;
}
function pickPasteTarget() {
  const active = document.activeElement;
  const z = active && active.closest && active.closest('.paste-zone');
  if (z) return z.dataset.slot;
  const keys = Object.keys(SLOTS).filter(slotVisible);
  if (!keys.length) return null;
  return keys.find((k) => !SLOTS[k].get() && !pendingSlots.has(k)) || (lastFocusedSlot && keys.includes(lastFocusedSlot) ? lastFocusedSlot : keys[0]);
}
const IMG_EXT = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', bmp: 'image/bmp' };
// Some sources (Windows Explorer copy, some apps) give files with an empty MIME type; fix it from the extension
function asImageFile(f) {
  if (!f) return null;
  if (/^image\//.test(f.type || '')) return f;
  const ext = String(f.name || '').toLowerCase().split('.').pop();
  if (IMG_EXT[ext]) return new File([f], f.name, { type: IMG_EXT[ext] });
  return null;
}
function imageFromClipboard(e) {
  const cd = e.clipboardData || window.clipboardData;
  if (!cd) return null;
  const items = cd.items ? Array.from(cd.items) : [];
  for (const it of items) {
    if (it.kind === 'file') {
      const f = asImageFile(it.getAsFile());
      if (f) return f;
    }
  }
  const files = cd.files ? Array.from(cd.files) : [];
  for (const f of files) {
    const img = asImageFile(f);
    if (img) return img;
  }
  return null;
}
function notify(msg, isError) {
  if (typeof toast === 'function') toast(msg);
  setOcrStatus(msg, !!isError);
}
function handlePaste(e, forcedKey) {
  if (e.__boardPasteHandled) return;
  e.__boardPasteHandled = true;
  const inZone = forcedKey || (document.activeElement && document.activeElement.closest && document.activeElement.closest('.paste-zone'));
  if (!inZone && isTextTarget(document.activeElement)) return; // don't hijack text fields
  const f = imageFromClipboard(e);
  if (!f) {
    // only complain when the user was clearly aiming at a slot or at no text field
    notify('剪贴板里没有图片，请先截图或复制图片', true);
    return;
  }
  const key = forcedKey || pickPasteTarget();
  if (!key) { notify('当前模板没有可用的截图位置', true); return; }
  e.preventDefault();
  setSlotFile(key, f);
}
async function pasteFromClipboardApi() {
  if (!navigator.clipboard || typeof navigator.clipboard.read !== 'function') {
    notify('这个浏览器不支持读取剪贴板，请点截图框后按 Ctrl+V', true);
    return;
  }
  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      const type = item.types.find((t) => /^image\//.test(t));
      if (type) {
        const blob = await item.getType(type);
        const key = pickPasteTarget();
        if (!key) { notify('当前模板没有可用的截图位置', true); return; }
        await setSlotFile(key, new File([blob], 'clipboard.' + (type.split('/')[1] || 'png'), { type }));
        if (typeof toast === 'function') toast('已从剪贴板粘贴截图');
        return;
      }
    }
    notify('剪贴板里没有图片，请先截图或复制图片', true);
  } catch (err) {
    notify(err && err.name === 'NotAllowedError' ? '没有剪贴板权限：请在地址栏允许，或点截图框后按 Ctrl+V' : '读取剪贴板失败，请点截图框后按 Ctrl+V', true);
  }
}
function bindPasteSlots() {
  Object.keys(SLOTS).forEach((key) => {
    const inp = document.getElementById(SLOTS[key].input);
    if (inp) inp.addEventListener('change', (e) => setSlotFile(key, e.target.files && e.target.files[0]));
    const z = zoneOf(key);
    if (!z) return;
    z.addEventListener('focus', () => { lastFocusedSlot = key; z.classList.add('focus'); });
    z.addEventListener('blur', () => z.classList.remove('focus'));
    z.addEventListener('mousedown', (e) => { if (!e.target.closest('.pz-remove')) { e.preventDefault(); z.focus(); } });
    z.addEventListener('paste', (e) => handlePaste(e, key));
    z.addEventListener('click', (e) => {
      if (e.target.closest('.pz-remove')) { e.stopPropagation(); clearSlot(key); return; }
      z.focus();
    });
    z.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp && inp.click(); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && SLOTS[key].get()) { e.preventDefault(); clearSlot(key); }
    });
    ['dragenter', 'dragover'].forEach((t) => z.addEventListener(t, (e) => { e.preventDefault(); z.classList.add('drag'); }));
    ['dragleave', 'dragend'].forEach((t) => z.addEventListener(t, () => z.classList.remove('drag')));
    z.addEventListener('drop', (e) => {
      e.preventDefault();
      z.classList.remove('drag');
      const f = [...((e.dataTransfer && e.dataTransfer.files) || [])].map(asImageFile).find(Boolean);
      if (f) setSlotFile(key, f); else setOcrStatus('请拖入图片文件', true);
    });
    renderSlot(key);
  });
  // stop the browser from opening images dropped outside the zones
  window.addEventListener('dragover', (e) => { if (!e.target.closest || !e.target.closest('.paste-zone')) e.preventDefault(); });
  window.addEventListener('drop', (e) => { if (!e.target.closest || !e.target.closest('.paste-zone')) e.preventDefault(); });
  document.addEventListener('paste', (e) => handlePaste(e), true); // capture phase
  document.getElementById('btn-ocr-clip')?.addEventListener('click', pasteFromClipboardApi);
}
window.addEventListener('template-changed', () => setTimeout(() => {
  // clear hidden slots so a hidden image is never sent (after labels/visibility update)
  Object.keys(SLOTS).forEach((k) => { if (!slotVisible(k) && SLOTS[k].get()) { SLOTS[k].set(null); renderSlot(k); } });
  updateFileHints();
}, 0));

function updateFileHints() {
  const rolesHint = document.getElementById('ocr-roles-hint');
  const ivHint = document.getElementById('ocr-iv-hint');
  if (rolesHint) {
    rolesHint.textContent = uploadedRolesDataUrl ? '已添加' : '未选择';
  }
  if (ivHint) {
    ivHint.textContent = uploadedIvDataUrl ? '已添加' : '未选择';
  }
}

async function onRecognize() {
  const settings = loadOcrSettings();
  // sync from form fields in case user typed without blur-save
  const keyEl = document.getElementById('ocr-api-key');
  const baseEl = document.getElementById('ocr-base-url');
  const modelEl = document.getElementById('ocr-model');
  if (keyEl && keyEl.value.trim()) settings.apiKey = keyEl.value.trim();
  if (baseEl) settings.baseUrl = (baseEl.value.trim() || DEFAULT_OCR_SETTINGS.baseUrl).replace(/\/+$/, '');
  if (modelEl) settings.model = modelEl.value.trim() || DEFAULT_OCR_SETTINGS.model;
  saveOcrSettings(settings);
  refreshKeyView();

  if (!settings.apiKey) {
    setOcrStatus('请先在「⚙ AI识别设置」里保存 API Key', true);
    const det = document.getElementById('ai-settings'); if (det) det.open = true;
    return;
  }
  if (!uploadedRolesDataUrl && !uploadedIvDataUrl) {
    setOcrStatus('请至少上传一张截图', true);
    return;
  }

  const hasRoles = !!uploadedRolesDataUrl;
  const startTemplate = window.BoardApp.getTemplateType();
  const hasIv = !!uploadedIvDataUrl && !!getTemplate(startTemplate).ocrUploads.b;
  const startClient = window.BoardApp.getClient();
  const dataUrls = [];
  if (hasRoles) dataUrls.push(uploadedRolesDataUrl);
  if (hasIv) dataUrls.push(uploadedIvDataUrl);
  if (!dataUrls.length) { setOcrStatus('请上传截图', true); return; }

  const btn = document.getElementById('btn-ocr-run');
  if (btn) btn.disabled = true;
  hidePreview();
  pendingRunClient = startClient;
  setOcrStatus(`正在识别（写入客户：${startClient}）…`);

  try {
    const parsed = await callDeepSeekVision({
      apiKey: settings.apiKey,
      baseUrl: settings.baseUrl,
      model: settings.model,
      dataUrls,
      hasRoles,
      hasIv,
      templateType: startTemplate
    });
    showPreview(parsed, { hasRoles, hasIv, templateType: startTemplate, client: pendingRunClient || startClient });
  } catch (err) {
    console.error(err);
    setOcrStatus(err.message || String(err), true);
  } finally {
    if (btn) btn.disabled = false;
  }
}

function refreshKeyView() {
  const has = !!loadOcrSettings().apiKey;
  const saved = document.getElementById('key-saved-view');
  const input = document.getElementById('key-input-view');
  if (saved) saved.hidden = !has;
  if (input) input.hidden = has;
  const keyEl = document.getElementById('ocr-api-key');
  if (keyEl) keyEl.value = '';
}

function bindOcrUi() {
  const settings = loadOcrSettings();
  const keyEl = document.getElementById('ocr-api-key');
  const baseEl = document.getElementById('ocr-base-url');
  const modelEl = document.getElementById('ocr-model');
  if (baseEl) baseEl.value = settings.baseUrl;
  if (modelEl) modelEl.value = settings.model;
  refreshKeyView();

  const persistMeta = () => {
    const cur = loadOcrSettings();
    saveOcrSettings({
      apiKey: cur.apiKey,
      baseUrl: baseEl ? baseEl.value.trim() : DEFAULT_OCR_SETTINGS.baseUrl,
      model: modelEl ? modelEl.value.trim() : DEFAULT_OCR_SETTINGS.model
    });
  };
  [baseEl, modelEl].forEach((el) => el && el.addEventListener('change', persistMeta));

  const saveKeyBtn = document.getElementById('btn-ocr-save-key');
  if (saveKeyBtn) saveKeyBtn.addEventListener('click', () => {
    const v = keyEl ? keyEl.value.trim() : '';
    if (!v) { setOcrStatus('请先粘贴 Key', true); return; }
    const cur = loadOcrSettings();
    cur.apiKey = v;
    saveOcrSettings(cur);
    maybeWarnAboutKey();
    refreshKeyView();
    setOcrStatus('Key 已保存');
  });
  const changeBtn = document.getElementById('btn-ocr-change-key');
  if (changeBtn) changeBtn.addEventListener('click', () => {
    document.getElementById('key-saved-view').hidden = true;
    document.getElementById('key-input-view').hidden = false;
    if (keyEl) { keyEl.value = ''; keyEl.focus(); }
  });
  const clearKeyBtn = document.getElementById('btn-ocr-clear-key');
  if (clearKeyBtn) clearKeyBtn.addEventListener('click', () => {
    if (!confirm('确定清除本机保存的 Key？')) return;
    const cur = loadOcrSettings();
    cur.apiKey = '';
    saveOcrSettings(cur);
    refreshKeyView();
    setOcrStatus('已清除本机 Key');
  });

  bindPasteSlots();

  const runBtn = document.getElementById('btn-ocr-run');
  if (runBtn) runBtn.addEventListener('click', onRecognize);

  const confirmBtn = document.getElementById('btn-ocr-confirm');
  if (confirmBtn) confirmBtn.addEventListener('click', applyPendingToForm);

  const cancelBtn = document.getElementById('btn-ocr-cancel');
  if (cancelBtn) cancelBtn.addEventListener('click', () => {
    hidePreview();
    setOcrStatus('已取消填入');
  });

  updateFileHints();
}

window.addEventListener('client-renamed', (e) => {
  const { from, to } = e.detail || {};
  if (pendingParsed && pendingParsed.meta.client === from) {
    pendingParsed.meta.client = to;
    const tgt = document.getElementById('ocr-target');
    if (tgt) tgt.textContent = `将写入客户：「${to}」`;
  }
  if (pendingRunClient === from) pendingRunClient = to;
});

function applyOcrUploadLabels(type) {
  const tpl = getTemplate(type);
  const boxes = document.querySelectorAll('.ocr-file-box');
  if (boxes[0]) boxes[0].querySelector('.file-title').textContent = tpl.ocrUploads.a;
  if (boxes[1]) {
    boxes[1].hidden = !tpl.ocrUploads.b;
    if (tpl.ocrUploads.b) boxes[1].querySelector('.file-title').textContent = tpl.ocrUploads.b;
  }
}
window.addEventListener('template-changed', (e) => applyOcrUploadLabels(e.detail.type));

document.addEventListener('DOMContentLoaded', bindOcrUi);
