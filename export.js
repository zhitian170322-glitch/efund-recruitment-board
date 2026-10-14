/* 客户端导出：超清 PNG + JPG */

const PNG_TARGET_WIDTH = 9000;
const JPG_TARGET_WIDTH = 4000;

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function stampName(dateStr, ext) {
  const client = (window.BoardApp && window.BoardApp.getClient && window.BoardApp.getClient()) || '';
  const m = String(dateStr || '').match(/(\d{1,2})\s*月\s*(\d{1,2})/);
  const stamp = m ? m[1].padStart(2, '0') + m[2].padStart(2, '0') : (dateStr || 'board').replace(/[^\d\w\u4e00-\u9fff-]+/g, '_');
  const safeClient = client.replace(/[\\/:*?"<>|]+/g, '_');
  const kind = (window.BoardApp && window.BoardApp.getTemplateType && window.BoardApp.getTemplateType() === 'demandTable') ? '招聘需求表' : '招聘看板';
  return `${safeClient}${kind}-${stamp}.${ext}`;
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function dataUrlToBlob(dataUrl) {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)[1];
  const bin = atob(parts[1]);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function getBoardDocument() {
  const iframe = window.BoardApp.getIframe();
  if (!iframe || !iframe.contentDocument) {
    throw new Error('看板预览未就绪，请先点击「刷新预览」');
  }
  return iframe.contentDocument;
}

function getCaptureRoot(doc) {
  return doc.getElementById('board') || doc.body;
}

const EXPORT_PAD = 56; // CSS px breathing room on every side

async function captureWithScale(root, pixelRatio, backgroundColor) {
  if (typeof htmlToImage === 'undefined') {
    throw new Error('导出库未加载，请检查网络或改用本地服务打开');
  }
  // Use the real layout size (unaffected by the preview's scale transform on the iframe)
  const contentW = Math.ceil(Math.max(root.scrollWidth, root.offsetWidth));
  const contentH = Math.ceil(Math.max(root.scrollHeight, root.offsetHeight));
  const opts = {
    pixelRatio,
    width: contentW + EXPORT_PAD * 2,
    height: contentH + EXPORT_PAD * 2,
    style: {
      boxSizing: 'content-box',
      width: contentW + 'px',
      maxWidth: 'none',
      margin: '0',
      padding: EXPORT_PAD + 'px',
      background: backgroundColor || '#f5f5f7',
      transform: 'none'
    },
    backgroundColor: backgroundColor || '#f5f5f7',
    cacheBust: true,
    // Skip external fonts issues on file://
    skipFonts: false
  };
  return htmlToImage.toPng(root, opts);
}

async function tryCapture(root, preferredScale) {
  const scales = [preferredScale, 4, 3, 2].filter((v, i, a) => a.indexOf(v) === i && v >= 1);
  let lastErr = null;
  for (const scale of scales) {
    try {
      window.BoardApp.setStatus(`正在渲染（${scale}×）…`);
      // Give UI a tick to paint status
      await delay(30);
      const dataUrl = await captureWithScale(root, scale, '#f5f5f7');
      return { dataUrl, scale };
    } catch (e) {
      lastErr = e;
      console.warn('capture scale failed', scale, e);
      // GC hint
      await delay(100);
    }
  }
  throw lastErr || new Error('渲染失败');
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

async function resizeToWidth(dataUrl, targetWidth, mime, quality) {
  const img = await loadImage(dataUrl);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) throw new Error('图片尺寸无效');

  const outW = targetWidth;
  const outH = Math.round((h / w) * outW);
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f5f5f7';
  ctx.fillRect(0, 0, outW, outH);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, outW, outH);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob 失败'))),
      mime,
      quality
    );
  });
}

async function exportPNG() {
  const btn = document.getElementById('btn-png');
  try {
    if (btn) btn.disabled = true;
    window.BoardApp.getState();
    window.BoardApp.pushToBoard();
    await delay(80);

    const doc = getBoardDocument();
    const root = getCaptureRoot(doc);
    // Prefer scale that yields ~9000w from ~1400–1800 content
    const cssW = (root.scrollWidth || 1400) + EXPORT_PAD * 2;
    let preferred = Math.min(5, Math.max(2, Math.round(PNG_TARGET_WIDTH / cssW)));
    if (preferred < 5 && cssW * 5 <= 12000) preferred = 5;

    const { dataUrl, scale } = await tryCapture(root, preferred);
    const img = await loadImage(dataUrl);
    let blob;
    let finalW = img.naturalWidth;

    if (img.naturalWidth >= PNG_TARGET_WIDTH * 0.85) {
      // Close enough or larger — if much larger, downscale to ~9000
      if (img.naturalWidth > PNG_TARGET_WIDTH * 1.15) {
        blob = await resizeToWidth(dataUrl, PNG_TARGET_WIDTH, 'image/png', 1);
        finalW = PNG_TARGET_WIDTH;
      } else {
        blob = dataUrlToBlob(dataUrl);
      }
    } else {
      // Upscale gently to target (note: not true optical HD)
      blob = await resizeToWidth(dataUrl, PNG_TARGET_WIDTH, 'image/png', 1);
      finalW = PNG_TARGET_WIDTH;
    }

    const state = window.BoardApp.getState();
    downloadBlob(blob, stampName(state.date, 'png'));
    window.BoardApp.setStatus(`超清 PNG 已下载（渲染 ${scale}×，宽约 ${finalW}px）`);
  } catch (e) {
    console.error(e);
    window.BoardApp.setStatus('PNG 导出失败：' + (e.message || e), true);
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function exportJPG() {
  const btn = document.getElementById('btn-jpg');
  try {
    if (btn) btn.disabled = true;
    window.BoardApp.getState();
    window.BoardApp.pushToBoard();
    await delay(80);

    const doc = getBoardDocument();
    const root = getCaptureRoot(doc);
    const cssW = (root.scrollWidth || 1400) + EXPORT_PAD * 2;
    const preferred = Math.min(3, Math.max(2, Math.round(JPG_TARGET_WIDTH / cssW)));

    const { dataUrl, scale } = await tryCapture(root, preferred);
    const blob = await resizeToWidth(dataUrl, JPG_TARGET_WIDTH, 'image/jpeg', 0.92);
    const state = window.BoardApp.getState();
    downloadBlob(blob, stampName(state.date, 'jpg'));
    window.BoardApp.setStatus(`JPG 已下载（渲染 ${scale}×，宽 ${JPG_TARGET_WIDTH}px）`);
  } catch (e) {
    console.error(e);
    window.BoardApp.setStatus('JPG 导出失败：' + (e.message || e), true);
  } finally {
    if (btn) btn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-png')?.addEventListener('click', exportPNG);
  document.getElementById('btn-jpg')?.addEventListener('click', exportJPG);
});
