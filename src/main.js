import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import './style.css';

const HISTORY_KEY = 'barcode-pwa-history-v1';
const SCAN_INTERVAL_MS = 110;
const DEDUPE_MS = 1800;

const state = {
  running: false,
  mode: null,
  stream: null,
  track: null,
  detector: null,
  fallback: null,
  rafId: null,
  lastFrameAt: 0,
  lastValue: '',
  lastDetectedAt: 0,
  torch: false,
};

document.querySelector('#app').innerHTML = `
  <main class="app">
    <header class="header">
      <div>
        <h1>Lector EAN-13</h1>
        <p>PWA · cámara trasera · lectura local</p>
      </div>
      <div id="status-dot" class="status-dot" aria-label="Estado de la cámara"></div>
    </header>

    <section class="scanner-card">
      <div class="video-wrap">
        <video id="video" playsinline muted></video>
        <div id="fallback-reader" class="hidden"></div>
        <div class="scan-guide"><div class="scan-line"></div></div>
      </div>
      <div class="controls">
        <div class="row">
          <button id="start" class="btn">Abrir cámara</button>
          <button id="stop" class="btn danger" disabled>Detener</button>
        </div>
        <div class="row">
          <button id="torch" class="btn secondary hidden">Linterna</button>
          <button id="copy" class="btn secondary" disabled>Copiar código</button>
        </div>
        <label id="zoom-wrap" class="zoom-row hidden">
          <span>Zoom</span>
          <input id="zoom" type="range" step="0.1" />
          <output id="zoom-value"></output>
        </label>
        <p id="message" class="message">Pulsa “Abrir cámara” y apunta al código.</p>
        <span id="engine" class="engine-badge"></span>
      </div>
    </section>

    <section class="result-card">
      <h2 class="card-title">Último código</h2>
      <output id="result" class="code">—</output>
      <p id="result-meta" class="meta">Todavía no se ha leído ningún código.</p>
    </section>

    <section class="history-card">
      <div class="row" style="align-items:center; justify-content:space-between">
        <h2 class="card-title" style="margin:0">Historial local</h2>
        <button id="clear" class="btn secondary" style="flex:0 0 auto; min-width:auto; padding:8px 10px">Vaciar</button>
      </div>
      <ul id="history" class="history-list" style="margin-top:10px"></ul>
    </section>
  </main>
`;

const el = {
  video: document.querySelector('#video'),
  fallbackReader: document.querySelector('#fallback-reader'),
  start: document.querySelector('#start'),
  stop: document.querySelector('#stop'),
  torch: document.querySelector('#torch'),
  copy: document.querySelector('#copy'),
  clear: document.querySelector('#clear'),
  zoomWrap: document.querySelector('#zoom-wrap'),
  zoom: document.querySelector('#zoom'),
  zoomValue: document.querySelector('#zoom-value'),
  statusDot: document.querySelector('#status-dot'),
  message: document.querySelector('#message'),
  engine: document.querySelector('#engine'),
  result: document.querySelector('#result'),
  resultMeta: document.querySelector('#result-meta'),
  history: document.querySelector('#history'),
};

function setMessage(text, error = false) {
  el.message.textContent = text;
  el.message.classList.toggle('error', error);
}

function setRunning(running) {
  state.running = running;
  el.start.disabled = running;
  el.stop.disabled = !running;
  el.statusDot.classList.toggle('live', running);
}

function readHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch { return []; }
}

function renderHistory() {
  const items = readHistory();
  el.history.innerHTML = items.length
    ? items.map(({ value, at }) => `<li class="history-item"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(new Date(at).toLocaleString())}</span></li>`).join('')
    : '<li><p class="empty">No hay lecturas guardadas.</p></li>';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

function saveHistory(value) {
  const items = readHistory();
  items.unshift({ value, at: new Date().toISOString() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 15)));
  renderHistory();
}

async function copyResult() {
  const value = el.result.textContent;
  if (!value || value === '—') return;
  try {
    await navigator.clipboard.writeText(value);
    setMessage('Código copiado al portapapeles.');
  } catch {
    setMessage('No se pudo copiar automáticamente. Mantén pulsado el código para copiarlo.', true);
  }
}

function acceptResult(rawValue, format = 'EAN-13') {
  const value = String(rawValue || '').trim();
  const now = Date.now();
  if (!/^\d{13}$/.test(value)) return;
  if (value === state.lastValue && now - state.lastDetectedAt < DEDUPE_MS) return;

  state.lastValue = value;
  state.lastDetectedAt = now;
  el.result.textContent = value;
  el.resultMeta.textContent = `${format} · ${new Date().toLocaleString()}`;
  el.copy.disabled = false;
  saveHistory(value);
  setMessage(`Código leído: ${value}`);
  navigator.vibrate?.(80);
  copyResult();
}

async function supportsNativeEan13() {
  if (!('BarcodeDetector' in window)) return false;
  try {
    const formats = await window.BarcodeDetector.getSupportedFormats();
    return formats.includes('ean_13');
  } catch { return false; }
}

async function startNative() {
  state.stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  });
  state.track = state.stream.getVideoTracks()[0];
  el.video.srcObject = state.stream;
  await el.video.play();
  state.detector = new window.BarcodeDetector({ formats: ['ean_13'] });
  state.mode = 'native';
  el.engine.textContent = 'Motor: BarcodeDetector nativo';
  setupCameraControls(state.track);
  state.rafId = requestAnimationFrame(detectNativeFrame);
}

async function detectNativeFrame(timestamp) {
  if (!state.running || state.mode !== 'native') return;
  if (timestamp - state.lastFrameAt >= SCAN_INTERVAL_MS && el.video.readyState >= 2) {
    state.lastFrameAt = timestamp;
    try {
      const codes = await state.detector.detect(el.video);
      const code = codes.find((item) => item.format === 'ean_13') || codes[0];
      if (code?.rawValue) acceptResult(code.rawValue, code.format || 'EAN-13');
    } catch (error) {
      console.warn('BarcodeDetector:', error);
    }
  }
  state.rafId = requestAnimationFrame(detectNativeFrame);
}

function pickPreferredRearCamera(cameras = []) {
  if (!cameras.length) return null;
  const rearPattern = /(back|rear|environment|trasera|arrière|ruck|rück)/i;
  const avoidPattern = /(ultra|wide|tele|macro|0\.5|0,5)/i;
  const rearCameras = cameras.filter((camera) => rearPattern.test(camera.label || ''));
  return rearCameras.find((camera) => !avoidPattern.test(camera.label || ''))
    || rearCameras[0]
    || cameras[cameras.length - 1];
}

async function startFallbackWithCamera(cameraConfig) {
  return state.fallback.start(
    cameraConfig,
    {
      fps: 10,
      aspectRatio: 4 / 3,
      qrbox: (width, height) => ({
        width: Math.floor(width * 0.92),
        height: Math.floor(height * 0.28),
      }),
      disableFlip: true,
    },
    (decodedText) => acceptResult(decodedText, 'EAN-13'),
    () => {}
  );
}

async function startFallback() {
  el.video.classList.add('hidden');
  el.fallbackReader.classList.remove('hidden');
  state.fallback = new Html5Qrcode('fallback-reader', {
    formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13],
    experimentalFeatures: { useBarCodeDetectorIfSupported: false },
    verbose: false,
  });

  let cameras = [];
  try { cameras = await Html5Qrcode.getCameras(); } catch {}
  const preferredCamera = pickPreferredRearCamera(cameras);

  try {
    await startFallbackWithCamera(
      preferredCamera?.id
        ? { deviceId: { exact: preferredCamera.id } }
        : { facingMode: { exact: 'environment' } }
    );
  } catch (error) {
    console.warn('No se pudo forzar la cámara trasera exacta:', error);
    await startFallbackWithCamera({ facingMode: 'environment' });
  }

  state.mode = 'fallback';
  const cameraLabel = preferredCamera?.label ? ` · ${preferredCamera.label}` : '';
  el.engine.textContent = `Motor: html5-qrcode (fallback)${cameraLabel}`;
  const capabilities = state.fallback.getRunningTrackCapabilities?.();
  const settings = state.fallback.getRunningTrackSettings?.();
  setupFallbackControls(capabilities, settings);
}

async function startScanner() {
  if (state.running) return;
  setMessage('Solicitando permiso para usar la cámara…');
  setRunning(true);
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('La cámara web requiere HTTPS o localhost.');
    if (await supportsNativeEan13()) await startNative();
    else await startFallback();
    setMessage('Cámara activa. Acerca el EAN-13 al recuadro y evita reflejos.');
  } catch (error) {
    console.error(error);
    await stopScanner();
    setMessage(error?.message || 'No se pudo abrir la cámara.', true);
  }
}

function resetCameraControls() {
  el.torch.classList.add('hidden');
  el.zoomWrap.classList.add('hidden');
  state.torch = false;
  el.torch.textContent = 'Linterna';
}

function setupCameraControls(track) {
  resetCameraControls();
  const capabilities = track?.getCapabilities?.() || {};
  const settings = track?.getSettings?.() || {};
  if (capabilities.torch) el.torch.classList.remove('hidden');
  if (capabilities.zoom) setupZoom(capabilities.zoom, settings.zoom, (zoom) => track.applyConstraints({ advanced: [{ zoom }] }));
}

function setupFallbackControls(capabilities = {}, settings = {}) {
  resetCameraControls();
  if (capabilities.torchFeature?.isSupported || capabilities.torch) el.torch.classList.remove('hidden');
  if (capabilities.zoomFeature?.isSupported) {
    setupZoom(
      { min: capabilities.zoomFeature.min, max: capabilities.zoomFeature.max, step: capabilities.zoomFeature.step },
      settings.zoom,
      (zoom) => state.fallback.applyVideoConstraints({ advanced: [{ zoom }] })
    );
  }
}

function setupZoom(range, current, apply) {
  el.zoom.min = range.min;
  el.zoom.max = range.max;
  el.zoom.step = range.step || 0.1;
  el.zoom.value = current ?? range.min;
  el.zoomValue.textContent = `${Number(el.zoom.value).toFixed(1)}×`;
  el.zoomWrap.classList.remove('hidden');
  el.zoom.oninput = async () => {
    const zoom = Number(el.zoom.value);
    el.zoomValue.textContent = `${zoom.toFixed(1)}×`;
    try { await apply(zoom); } catch { setMessage('Este navegador no ha podido aplicar el zoom.', true); }
  };
}

async function toggleTorch() {
  state.torch = !state.torch;
  try {
    if (state.mode === 'native') await state.track.applyConstraints({ advanced: [{ torch: state.torch }] });
    if (state.mode === 'fallback') await state.fallback.applyVideoConstraints({ advanced: [{ torch: state.torch }] });
    el.torch.textContent = state.torch ? 'Apagar linterna' : 'Linterna';
  } catch {
    state.torch = false;
    setMessage('La linterna no está disponible en este dispositivo o navegador.', true);
  }
}

async function stopScanner() {
  if (state.rafId) cancelAnimationFrame(state.rafId);
  state.rafId = null;
  if (state.fallback) {
    try { await state.fallback.stop(); } catch {}
    try { state.fallback.clear(); } catch {}
  }
  state.fallback = null;
  if (state.stream) state.stream.getTracks().forEach((track) => track.stop());
  state.stream = null;
  state.track = null;
  state.detector = null;
  state.mode = null;
  el.video.srcObject = null;
  el.video.classList.remove('hidden');
  el.fallbackReader.classList.add('hidden');
  el.fallbackReader.innerHTML = '';
  resetCameraControls();
  setRunning(false);
}

el.start.addEventListener('click', startScanner);
el.stop.addEventListener('click', async () => { await stopScanner(); setMessage('Cámara detenida.'); });
el.torch.addEventListener('click', toggleTorch);
el.copy.addEventListener('click', copyResult);
el.clear.addEventListener('click', () => { localStorage.removeItem(HISTORY_KEY); renderHistory(); });
window.addEventListener('pagehide', stopScanner);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(console.warn));
}
renderHistory();
