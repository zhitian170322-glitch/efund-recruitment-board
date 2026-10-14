/* 招聘看板 — DeepSeek 识图填表（Key 仅存本机 localStorage） */

const OCR_STORAGE_KEY = 'efund_board_deepseek_settings';
const OCR_WARN_KEY = 'efund_board_deepseek_key_warned';

const DEFAULT_OCR_SETTINGS = {
  apiKey: '',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-flash'
};

let pendingParsed = null;
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
    out.roles = raw.roles.map((r) => ({
      title: String(r?.title || '').trim(),
      team: String(r?.team || '').trim(),
      note: String(r?.note || '').trim(),
      progress: String(r?.progress || '').trim(),
      featured: !!r?.featured
    })).filter((r) => r.title || r.team || r.note || r.progress);
  }
  return out;
}

async function callDeepSeekVision({ apiKey, baseUrl, model, dataUrls, hasRoles, hasIv }) {
  const content = [
    { type: 'text', text: buildOcrPrompt(hasRoles, hasIv) }
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
  box.hidden = false;
  setOcrStatus('已识别，请核对后点「确认填入」');
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
  window.BoardApp.applyOcrResult(parsed, meta);
  hidePreview();
  setOcrStatus('已填入表单，可再微调');
  if (window.BoardApp.setStatus) {
    window.BoardApp.setStatus('识图结果已填入');
  }
}

function updateFileHints() {
  const rolesHint = document.getElementById('ocr-roles-hint');
  const ivHint = document.getElementById('ocr-iv-hint');
  if (rolesHint) {
    rolesHint.textContent = uploadedRolesDataUrl ? '已选岗位截图' : '未选择';
  }
  if (ivHint) {
    ivHint.textContent = uploadedIvDataUrl ? '已选面试截图' : '未选择';
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
  const hasIv = !!uploadedIvDataUrl;
  const dataUrls = [];
  if (hasRoles) dataUrls.push(uploadedRolesDataUrl);
  if (hasIv) dataUrls.push(uploadedIvDataUrl);

  const btn = document.getElementById('btn-ocr-run');
  if (btn) btn.disabled = true;
  hidePreview();
  setOcrStatus('正在识别，请稍候…');

  try {
    const parsed = await callDeepSeekVision({
      apiKey: settings.apiKey,
      baseUrl: settings.baseUrl,
      model: settings.model,
      dataUrls,
      hasRoles,
      hasIv
    });
    showPreview(parsed, { hasRoles, hasIv });
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

  const rolesInput = document.getElementById('ocr-roles-file');
  const ivInput = document.getElementById('ocr-iv-file');

  if (rolesInput) {
    rolesInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      try {
        uploadedRolesDataUrl = file ? await fileToDataUrl(file) : null;
        updateFileHints();
        setOcrStatus(file ? '已选岗位截图' : '');
      } catch (err) {
        uploadedRolesDataUrl = null;
        updateFileHints();
        setOcrStatus(err.message || '读取失败', true);
        e.target.value = '';
      }
    });
  }

  if (ivInput) {
    ivInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      try {
        uploadedIvDataUrl = file ? await fileToDataUrl(file) : null;
        updateFileHints();
        setOcrStatus(file ? '已选面试截图' : '');
      } catch (err) {
        uploadedIvDataUrl = null;
        updateFileHints();
        setOcrStatus(err.message || '读取失败', true);
        e.target.value = '';
      }
    });
  }

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

document.addEventListener('DOMContentLoaded', bindOcrUi);
