const SAFE_LIMITS = {
  maxSingleBytes: 25 * 1024 * 1024,
  maxSinglePixels: 40000000,
  maxBatchFiles: 50,
  maxAiPixels2x: 3000000,
  maxAiPixels4x: 1500000
};

const PRESET_GROUP = {
  STANDARD: "standard",
  NEWSLETTER: "newsletter"
};

const skinToggle = document.getElementById("skinToggle");
const skinToggleLabel = document.getElementById("skinToggleLabel");
const imageStage = document.getElementById("imageStage");
const dropZoneUI = document.getElementById("dropZoneUI");
const selectImagesBtn = document.getElementById("selectImagesBtn");
const browseLink = document.getElementById("browseLink");
const imageEl = document.getElementById("image");
const headerGuide = document.getElementById("headerGuide");
const headerGuideToggle = document.getElementById("headerGuideToggle");
const headerGuideRow = document.getElementById("headerGuideRow");

const dimsPill = document.getElementById("dimsPill");
const origPill = document.getElementById("origPill");
const estimatePill = document.getElementById("estimatePill");
const statusLine = document.getElementById("statusLine");

const customW = document.getElementById("customW");
const customH = document.getElementById("customH");
const applyCustomBtn = document.getElementById("applyCustom");

const zoomSlider = document.getElementById("zoomSlider");
const zoomPill = document.getElementById("zoomPill");
const resetZoomBtn = document.getElementById("resetZoomBtn");

const rotSlider = document.getElementById("rotSlider");
const rotPill = document.getElementById("rotPill");
const resetRotBtn = document.getElementById("resetRotBtn");
const autoFaceBtn = document.getElementById("autoFaceBtn");
const flipBtn = document.getElementById("flipBtn");
const flipVerticalBtn = document.getElementById("flipVerticalBtn");
const rotate90Btn = document.getElementById("rotate90Btn");

const undoBtn = document.getElementById("undoBtn");
const resetCropBtn = document.getElementById("resetCropBtn");
const removeCropBtn = document.getElementById("removeCropBtn");
const resetViewBtn = document.getElementById("resetViewBtn");
const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");

const formatSelect = document.getElementById("formatSelect");
const formatLockNote = document.getElementById("formatLockNote");
const qualitySlider = document.getElementById("qualitySlider");
const qualityPill = document.getElementById("qualityPill");
const target1mb = document.getElementById("target1mb");
const target500kb = document.getElementById("target500kb");
const target250kb = document.getElementById("target250kb");
const sharpenToggle = document.getElementById("sharpenToggle");

const aiScaleSelect = document.getElementById("aiScaleSelect");
const aiDownloadBtn = document.getElementById("aiDownloadBtn");

const batchFastBtn = document.getElementById("batchFastBtn");
const batchManualBtn = document.getElementById("batchManualBtn");
const batchProgWrap = document.getElementById("batchProgWrap");
const batchProg = document.getElementById("batchProg");
const batchProgText = document.getElementById("batchProgText");
const batchSummary = document.getElementById("batchSummary");

const batchModal = document.getElementById("batchModal");
const batchStep = document.getElementById("batchStep");
const batchFileName = document.getElementById("batchFileName");
const batchCancel = document.getElementById("batchCancel");
const batchPrev = document.getElementById("batchPrev");
const batchSkipNext = document.getElementById("batchSkipNext");
const batchAddNext = document.getElementById("batchAddNext");
const batchFinish = document.getElementById("batchFinish");

const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = "image/*,.heic,.heif";
fileInput.multiple = true;
fileInput.style.cssText = "position:fixed;opacity:0;pointer-events:none;width:0;height:0;";
document.body.appendChild(fileInput);

let cropper = null;
let targetWidth = 400;
let targetHeight = 250;
let selectedFiles = [];
let originalBaseName = "image";
let originalBytes = 0;
let originalDims = { w: 0, h: 0 };
let currentPresetGroup = PRESET_GROUP.STANDARD;

let history = [];
const HISTORY_LIMIT = 40;
let isApplyingUndo = false;
let estimateTimer = null;

let baseZoomRatio = 1;
let currentZoomRatio = 1;
let currentRotation = 0;
let currentScaleX = 1;
let currentScaleY = 1;
let zoomRafPending = false;
let rotRafPending = false;
let pendingZoomValue = 100;
let pendingRotValue = 0;

let manualZip = null;
let manualSeen = null;
let manualFiles = [];
let manualIndex = 0;
let manualAdded = 0;
let manualSkipped = 0;
let manualFailed = [];

let faceDetector = null;
let faceDetectorInitPromise = null;
let heic2anyReadyPromise = null;
let upscaler = null;

let cropRemoved = false;

const presetCards = document.querySelectorAll(".presetCard");
const presetTabs = document.querySelectorAll(".presetTab");
const tabPanels = document.querySelectorAll(".tabPanel");

const PRESET_DEFINITIONS = [
  { id: "presetArticleCard", w: 400, h: 250, group: PRESET_GROUP.STANDARD, tab: "article" },
  { id: "presetHeaderCard", w: 1630, h: 580, group: PRESET_GROUP.STANDARD, tab: "article" },
  { id: "preset916Card", w: 1080, h: 1920, group: PRESET_GROUP.STANDARD, tab: "social" },
  { id: "preset54Card", w: 1080, h: 1350, group: PRESET_GROUP.STANDARD, tab: "social" },
  { id: "preset11Card", w: 1080, h: 1080, group: PRESET_GROUP.STANDARD, tab: "social" },
  { id: "presetNewsBannerCard", w: 2400, h: 600, group: PRESET_GROUP.NEWSLETTER, tab: "newsletter" },
  { id: "presetNewsFeaturedCard", w: 1000, h: 600, group: PRESET_GROUP.NEWSLETTER, tab: "newsletter" },
  { id: "presetNewsCollageSideCard", w: 1200, h: 1200, group: PRESET_GROUP.NEWSLETTER, tab: "newsletter" },
  { id: "presetNewsCollageGridCard", w: 1400, h: 800, group: PRESET_GROUP.NEWSLETTER, tab: "newsletter" },
  { id: "presetNewsInlineCard", w: 1200, h: 800, group: PRESET_GROUP.NEWSLETTER, tab: "newsletter" },
  { id: "presetIconBlockCard", w: 200, h: 200, group: PRESET_GROUP.STANDARD, tab: "website" },
  { id: "presetWebsiteHeaderBannerDesktopCard", w: 1400, h: 700, group: PRESET_GROUP.STANDARD, tab: "website" },
  { id: "presetWebsiteHeaderBannerMobileCard", w: 800, h: 400, group: PRESET_GROUP.STANDARD, tab: "website" },
  { id: "presetDistributorSearchCard", w: 600, h: 400, group: PRESET_GROUP.STANDARD, tab: "website" },
  { id: "presetSupplierSearchCard", w: 600, h: 400, group: PRESET_GROUP.STANDARD, tab: "website" },
  { id: "presetFeatureBlockCard", w: 600, h: 400, group: PRESET_GROUP.STANDARD, tab: "website" },
  { id: "presetPowerTrackCard", w: 600, h: 400, group: PRESET_GROUP.STANDARD, tab: "website" },
  { id: "presetCard360Card", w: 360, h: 240, group: PRESET_GROUP.STANDARD, tab: "website" },
  { id: "presetAuthorCardCard", w: 120, h: 150, group: PRESET_GROUP.STANDARD, tab: "website" },
  { id: "presetArticleCardWebsite", w: 280, h: 200, group: PRESET_GROUP.STANDARD, tab: "website" },
  { id: "presetIframeCard", w: 1920, h: 1080, group: PRESET_GROUP.STANDARD, tab: "website" }
];

function setStatus(text){
  statusLine.textContent = text || "";
}

function setSkinUI(){
  const isMac = document.body.classList.contains("mac9");
  skinToggle.checked = isMac;
  skinToggleLabel.textContent = isMac ? "SSEN" : "MAC OS9";
  skinToggle.setAttribute("aria-label", isMac ? "Switch to SSEN skin" : "Switch to Mac OS9 skin");
}

function isHeaderPreset(){
  return targetWidth === 1630 && targetHeight === 580;
}

function updateFormatLockUI(){
  const locked = currentPresetGroup === PRESET_GROUP.NEWSLETTER;
  formatSelect.disabled = locked;
  formatLockNote.classList.toggle("show", locked);
  qualitySlider.disabled = locked;
  target1mb.disabled = locked;
  target500kb.disabled = locked;
  target250kb.disabled = locked;
  if (locked) {
    qualityPill.textContent = "PNG";
  } else {
    qualityPill.textContent = `${qualitySlider.value}%`;
  }
}

function updateHeaderGuidePosition(){
  if (!cropper || cropRemoved || !cropper.cropped) return;

  const cropBox = cropper.getCropBoxData();
  if (!cropBox) return;

  headerGuide.style.left = `${cropBox.left}px`;
  headerGuide.style.top = `${cropBox.top}px`;
  headerGuide.style.width = `${cropBox.width}px`;
  headerGuide.style.height = `${cropBox.height}px`;

  const title = headerGuide.querySelector(".headerGuide-title");
  const button = headerGuide.querySelector(".headerGuide-button");
  const panel = headerGuide.querySelector(".headerGuide-panel");
  const lines = headerGuide.querySelectorAll(".headerGuide-line");

  const scale = cropBox.width / 1630;

  if (panel){
    panel.style.padding = `${Math.max(8, 24 * scale)}px ${Math.max(8, 26 * scale)}px ${Math.max(8, 22 * scale)}px`;
  }
  if (title){
    title.style.fontSize = `${Math.max(9, 19 * scale)}px`;
    title.style.marginBottom = `${Math.max(6, 18 * scale)}px`;
  }
  if (button){
    button.style.width = `${Math.max(60, 128 * scale)}px`;
    button.style.height = `${Math.max(20, 36 * scale)}px`;
    button.style.fontSize = `${Math.max(8, 13 * scale)}px`;
    button.style.marginTop = `${Math.max(8, 18 * scale)}px`;
  }
  lines.forEach(line => {
    line.style.height = `${Math.max(4, 10 * scale)}px`;
    line.style.marginBottom = `${Math.max(4, 10 * scale)}px`;
  });
}

function updateHeaderGuideVisibility(){
  const showRow = isHeaderPreset();
  headerGuideRow.style.display = showRow ? "flex" : "none";

  const shouldShow = showRow && headerGuideToggle.checked && !cropRemoved && cropper && cropper.cropped;
  headerGuide.classList.toggle("visible", shouldShow);

  if (shouldShow) updateHeaderGuidePosition();
}

function humanFileSize(bytes){
  if (!bytes && bytes !== 0) return "—";
  const kb = bytes / 1024;
  return kb < 1024 ? `${kb < 100 ? kb.toFixed(1) : Math.round(kb)}KB` : `${(kb / 1024).toFixed(2)}MB`;
}

function updateDimsPill(){
  dimsPill.textContent = `Output: ${targetWidth} × ${targetHeight}`;
}

function setOrigPill(){
  origPill.textContent = (!originalBytes || !originalDims.w)
    ? "Original: —"
    : `Original: ${originalDims.w}×${originalDims.h} · ${humanFileSize(originalBytes)}`;
}

function getMime(){
  return currentPresetGroup === PRESET_GROUP.NEWSLETTER
    ? "image/png"
    : (formatSelect.value === "webp" ? "image/webp" : "image/jpeg");
}

function getExt(){
  return currentPresetGroup === PRESET_GROUP.NEWSLETTER
    ? "png"
    : (formatSelect.value === "webp" ? "webp" : "jpg");
}

function getQualityFloat(){ return parseInt(qualitySlider.value,10) / 100; }
function filenameFor(base){ return `${base}_${targetWidth}x${targetHeight}.${getExt()}`; }
function filenameForAi(base, width, height, scale){ return `${base}_${width}x${height}_AIx${scale}.${getExt()}`; }
function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }
function normalizeRotation(deg){
  if (!Number.isFinite(deg)) return 0;
  let value = ((deg % 360) + 360) % 360;
  if (value > 180) value -= 360;
  return value;
}
function showDropUI(show){ dropZoneUI.classList.toggle("hidden", !show); }

function getActualZoomRatio(){
  if (!cropper) return 1;
  const imageData = cropper.getImageData();
  if (!imageData || !imageData.naturalWidth) return 1;
  return imageData.width / imageData.naturalWidth;
}

function canvasToBlob(canvas, mime, quality){
  return new Promise((resolve, reject) => {
    if (mime === "image/png") {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("blob")), mime);
    } else {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("blob")), mime, quality);
    }
  });
}

function dataUrlToImage(dataUrl){
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode AI output."));
    img.src = dataUrl;
  });
}

function clearEstimate(){
  estimatePill.textContent = "Expected: —";
  estimatePill.classList.remove("good","warn","bad");
}

function setEstimatePill(bytes){
  const kb = bytes / 1024;
  estimatePill.classList.remove("good","warn","bad");
  if (kb <= 500) estimatePill.classList.add("good");
  else if (kb <= 1024) estimatePill.classList.add("warn");
  else estimatePill.classList.add("bad");
  estimatePill.textContent = `Expected: ~${humanFileSize(bytes)}`;
}

function applySharpenToCanvas(canvas){
  if (!canvas || !sharpenToggle.checked) return canvas;

  const pixelCount = canvas.width * canvas.height;
  if (pixelCount > 4000000) {
    setStatus("Sharpen skipped on very large image to keep things responsive.");
    return canvas;
  }

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;

  const w = canvas.width;
  const h = canvas.height;
  if (!w || !h) return canvas;

  const src = ctx.getImageData(0, 0, w, h);
  const out = ctx.createImageData(w, h);
  const s = src.data;
  const d = out.data;
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0;
      const a = s[(y * w + x) * 4 + 3];
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const px = Math.min(w - 1, Math.max(0, x + kx));
          const py = Math.min(h - 1, Math.max(0, y + ky));
          const i = (py * w + px) * 4;
          const k = kernel[(ky + 1) * 3 + (kx + 1)];
          r += s[i] * k;
          g += s[i + 1] * k;
          b += s[i + 2] * k;
        }
      }
      const o = (y * w + x) * 4;
      d[o] = Math.max(0, Math.min(255, r));
      d[o + 1] = Math.max(0, Math.min(255, g));
      d[o + 2] = Math.max(0, Math.min(255, b));
      d[o + 3] = a;
    }
  }

  ctx.putImageData(out, 0, 0);
  return canvas;
}

async function ensureUpscaler(){
  if (upscaler) return upscaler;

  if (typeof window.Upscaler === "undefined" || typeof window.DefaultUpscalerJSModel === "undefined") {
    throw new Error("AI upscale libraries did not load. Your network may be blocking the CDN files.");
  }

  upscaler = new window.Upscaler({
    model: window.DefaultUpscalerJSModel
  });

  return upscaler;
}

function getFullFrameCanvas(width, height){
  if (!cropper) return null;

  const imageData = cropper.getImageData();
  if (!imageData || !imageData.naturalWidth || !imageData.naturalHeight) return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const source = imageEl;
  const srcW = imageData.naturalWidth;
  const srcH = imageData.naturalHeight;
  const targetAR = width / height;
  const srcAR = srcW / srcH;

  let sx, sy, sw, sh;

  if (srcAR > targetAR){
    sh = srcH;
    sw = Math.round(srcH * targetAR);
    sx = Math.round((srcW - sw) / 2);
    sy = 0;
  } else {
    sw = srcW;
    sh = Math.round(srcW / targetAR);
    sx = 0;
    sy = Math.round((srcH - sh) / 2);
  }

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.translate(width / 2, height / 2);
  ctx.scale(currentScaleX, currentScaleY);
  ctx.rotate((normalizeRotation(currentRotation) * Math.PI) / 180);
  ctx.drawImage(source, sx, sy, sw, sh, -width / 2, -height / 2, width, height);
  ctx.restore();
  return canvas;
}

async function getCurrentExportBlob(){
  if (!cropper) return null;

  let canvas;

  if (cropRemoved || !cropper.cropped) {
    canvas = getFullFrameCanvas(targetWidth, targetHeight);
  } else {
    canvas = cropper.getCroppedCanvas({ width: targetWidth, height: targetHeight });
  }

  if (!canvas) return null;

  applySharpenToCanvas(canvas);
  return await canvasToBlob(canvas, getMime(), getQualityFloat());
}

function scheduleEstimate(){
  if (!cropper || cropRemoved || !cropper.cropped) {
    clearEstimate();
    return;
  }
  if (estimateTimer) clearTimeout(estimateTimer);
  estimateTimer = setTimeout(async () => {
    try{
      const blob = await getCurrentExportBlob();
      if (blob) setEstimatePill(blob.size);
    }catch(e){}
  }, 250);
}

function safeDestroyCropper(){
  if (cropper){ cropper.destroy(); cropper = null; }
}

function uniqueZipName(seen, name){
  if (!seen.has(name)){ seen.add(name); return name; }
  const dot = name.lastIndexOf(".");
  const base = dot >= 0 ? name.slice(0, dot) : name;
  const ext = dot >= 0 ? name.slice(dot) : "";
  let n = 2;
  let candidate = `${base}_${n}${ext}`;
  while (seen.has(candidate)){ n++; candidate = `${base}_${n}${ext}`; }
  seen.add(candidate);
  return candidate;
}

function pushHistory(){
  if (!cropper || !cropper.cropped || cropRemoved) return;
  const data = cropper.getData(true);
  history.push({
    data,
    cropBox: cropper.getCropBoxData(),
    canvas: cropper.getCanvasData(),
    baseZoomRatio,
    zoomRatio: currentZoomRatio,
    rotate: (typeof data.rotate === "number") ? normalizeRotation(data.rotate) : currentRotation,
    scaleX: currentScaleX,
    scaleY: currentScaleY
  });
  if (history.length > HISTORY_LIMIT) history.shift();
  undoBtn.disabled = history.length < 2;
}

function restoreSnapshot(snap){
  if (!cropper || !snap) return;
  cropper.setCanvasData(snap.canvas);
  cropper.setCropBoxData(snap.cropBox);
  cropper.setData(snap.data);
  cropRemoved = false;
  baseZoomRatio = snap.baseZoomRatio || baseZoomRatio;

  currentScaleX = typeof snap.scaleX === "number" ? snap.scaleX : 1;
  currentScaleY = typeof snap.scaleY === "number" ? snap.scaleY : 1;
  cropper.scaleX(currentScaleX);
  cropper.scaleY(currentScaleY);

  if (typeof snap.rotate === "number"){
    currentRotation = normalizeRotation(snap.rotate);
    cropper.rotateTo(currentRotation);
  } else {
    currentRotation = 0;
    cropper.rotateTo(0);
  }

  if (typeof snap.zoomRatio === "number"){
    cropper.zoomTo(snap.zoomRatio);
    currentZoomRatio = snap.zoomRatio;
  }
  updateTransformUI();
  updateHeaderGuideVisibility();
}

function captureBaseZoomRatio(){
  if (!cropper) return;
  baseZoomRatio = getActualZoomRatio();
  currentZoomRatio = baseZoomRatio;
}

function updateTransformUI(){
  const pct = Math.round((currentZoomRatio / baseZoomRatio) * 100);
  zoomSlider.value = clamp(pct, parseInt(zoomSlider.min,10), parseInt(zoomSlider.max,10));
  zoomPill.textContent = `${zoomSlider.value}%`;
  rotSlider.value = clamp(currentRotation, parseFloat(rotSlider.min), parseFloat(rotSlider.max));
  rotPill.textContent = `${Number(rotSlider.value).toFixed(1)}°`;
}

function applyZoomPct(pct){
  if (!cropper) return;
  const desiredRatio = baseZoomRatio * (pct/100);
  const cb = cropper.getCropBoxData();
  const center = cb && cropper.cropped
    ? { x: cb.left + cb.width/2, y: cb.top + cb.height/2 }
    : undefined;
  cropper.zoomTo(desiredRatio, center);
  currentZoomRatio = getActualZoomRatio();
  updateTransformUI();
  if (!cropRemoved) scheduleEstimate();
  updateHeaderGuideVisibility();
}

function applyRotationDeg(deg){
  if (!cropper) return;
  currentRotation = normalizeRotation(deg);
  cropper.rotateTo(currentRotation);
  updateTransformUI();
  if (!cropRemoved) scheduleEstimate();
  updateHeaderGuideVisibility();
}

function toggleFlip(){
  if (!cropper){
    setStatus("Please choose an image first.");
    return;
  }

  currentScaleX = currentScaleX === -1 ? 1 : -1;
  cropper.scaleX(currentScaleX);

  if (!cropRemoved) {
    pushHistory();
    scheduleEstimate();
  }

  updateHeaderGuideVisibility();
  setStatus(currentScaleX === -1 ? "Image flipped horizontally." : "Horizontal flip removed.");
}

function toggleFlipVertical(){
  if (!cropper){
    setStatus("Please choose an image first.");
    return;
  }

  currentScaleY = currentScaleY === -1 ? 1 : -1;
  cropper.scaleY(currentScaleY);

  if (!cropRemoved) {
    pushHistory();
    scheduleEstimate();
  }

  updateHeaderGuideVisibility();
  setStatus(currentScaleY === -1 ? "Image flipped vertically." : "Vertical flip removed.");
}

function rotateNinety(){
  if (!cropper){
    setStatus("Please choose an image first.");
    return;
  }

  applyRotationDeg(currentRotation + 90);

  if (!cropRemoved) {
    pushHistory();
  }

  setStatus(`Rotated to ${Math.round(currentRotation)}°.`);
}

function resetZoom(){
  if (!cropper) return;
  cropper.zoomTo(baseZoomRatio);
  currentZoomRatio = baseZoomRatio;
  updateTransformUI();
  if (!cropRemoved) scheduleEstimate();
  updateHeaderGuideVisibility();
  setStatus("Zoom reset.");
  if (!cropRemoved) pushHistory();
}

function resetRotation(){
  if (!cropper) return;
  currentRotation = 0;
  cropper.rotateTo(0);
  updateTransformUI();
  if (!cropRemoved) scheduleEstimate();
  updateHeaderGuideVisibility();
  setStatus("Rotation reset.");
  if (!cropRemoved) pushHistory();
}

function initCropper(){
  safeDestroyCropper();
  if (typeof Cropper === "undefined"){
    setStatus("Cropper library could not load. Your network may be blocking the CDN.");
    return;
  }

  cropper = new Cropper(imageEl, {
    aspectRatio: targetWidth / targetHeight,
    viewMode: 0,
    autoCrop: true,
    autoCropArea: 0.85,
    dragMode: "move",
    background: true,
    movable: true,
    zoomable: true,
    rotatable: true,
    scalable: true,
    responsive: true,
    ready(){
      history = [];
      currentRotation = 0;
      currentScaleX = 1;
      currentScaleY = 1;
      cropRemoved = !(cropper && cropper.cropped);
      captureBaseZoomRatio();
      updateTransformUI();
      undoBtn.disabled = true;

      if (!cropRemoved && cropper && cropper.cropped){
        pushHistory();
        scheduleEstimate();
        setStatus("Image loaded. Crop ready.");
      } else {
        clearEstimate();
        setStatus("Image loaded.");
      }

      updateHeaderGuideVisibility();
    },
    crop(){
      updateHeaderGuideVisibility();
    },
    cropmove(){
      updateHeaderGuideVisibility();
    },
    cropend(){
      if (!isApplyingUndo && cropper && cropper.cropped){
        cropRemoved = false;
        currentZoomRatio = getActualZoomRatio();
        const d = cropper.getData(true);
        if (d && typeof d.rotate === "number") currentRotation = d.rotate;
        updateTransformUI();
        pushHistory();
        scheduleEstimate();
      }
      updateHeaderGuideVisibility();
    },
    zoom(){
      if (!isApplyingUndo){
        currentZoomRatio = getActualZoomRatio();
        updateTransformUI();
        if (!cropRemoved) scheduleEstimate();
      }
      updateHeaderGuideVisibility();
    }
  });
}

function clearActivePresetCards(){
  presetCards.forEach(card => card.classList.remove("activePreset"));
}

function activatePresetCard(cardId){
  clearActivePresetCards();
  const card = document.getElementById(cardId);
  if (card) card.classList.add("activePreset");
}

function activateTab(tabKey){
  presetTabs.forEach(tab => {
    tab.classList.toggle("active", tab.dataset.tab === tabKey);
  });
  tabPanels.forEach(panel => {
    panel.classList.toggle("active", panel.id === `panel-${tabKey}`);
  });
}

function setPreset(w, h, group = PRESET_GROUP.STANDARD, cardId = null, tabKey = null){
  targetWidth = w;
  targetHeight = h;
  currentPresetGroup = group;

  if (tabKey) activateTab(tabKey);
  if (cardId) activatePresetCard(cardId);

  const header = (w === 1630 && h === 580);
  headerGuideToggle.checked = header;

  updateDimsPill();
  updateFormatLockUI();

  if (cropper){
    cropper.setAspectRatio(w / h);
    cropper.reset();
    cropper.crop();
    cropRemoved = false;
    cropper.rotateTo(0);
    cropper.scaleX(1);
    cropper.scaleY(1);
    currentRotation = 0;
    currentScaleX = 1;
    currentScaleY = 1;
    captureBaseZoomRatio();
    updateTransformUI();
    history = [];
    pushHistory();
    scheduleEstimate();
  }

  updateHeaderGuideVisibility();
}

function applyCustom(){
  const w = parseInt(customW.value, 10);
  const h = parseInt(customH.value, 10);

  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0){
    setStatus("Please enter a valid width and height.");
    return;
  }

  clearActivePresetCards();
  setPreset(w, h, PRESET_GROUP.STANDARD, null, null);
}

function resetCrop(){
  if (!cropper) return;
  cropper.clear();
  cropper.setAspectRatio(targetWidth / targetHeight);
  cropper.crop();
  cropper.reset();
  cropper.scaleX(1);
  cropper.scaleY(1);
  cropRemoved = false;
  currentRotation = 0;
  currentScaleX = 1;
  currentScaleY = 1;
  captureBaseZoomRatio();
  updateTransformUI();
  history = [];
  pushHistory();
  scheduleEstimate();
  updateHeaderGuideVisibility();
  setStatus("Crop reset.");
}

function removeCrop(){
  if (!cropper) return;
  cropper.clear();
  cropRemoved = true;
  history = [];
  undoBtn.disabled = true;
  clearEstimate();
  updateHeaderGuideVisibility();
  setStatus("Crop removed.");
}

function resetView(){
  if (!cropper) return;
  cropper.reset();
  cropper.scaleX(1);
  cropper.scaleY(1);
  currentRotation = 0;
  currentScaleX = 1;
  currentScaleY = 1;
  captureBaseZoomRatio();
  updateTransformUI();
  history = [];
  if (!cropRemoved && cropper.cropped){
    pushHistory();
    scheduleEstimate();
  } else {
    undoBtn.disabled = true;
    clearEstimate();
  }
  updateHeaderGuideVisibility();
  setStatus("View reset.");
}

function undo(){
  if (!cropper || history.length < 2) return;
  isApplyingUndo = true;
  history.pop();
  restoreSnapshot(history[history.length-1]);
  isApplyingUndo = false;
  scheduleEstimate();
  undoBtn.disabled = history.length < 2;
}

function isHeicLike(file){
  const name = (file && file.name ? file.name : "").toLowerCase();
  const type = (file && file.type ? file.type : "").toLowerCase();
  return type === "image/heic" || type === "image/heif" || name.endsWith(".heic") || name.endsWith(".heif");
}

function loadScript(src){
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

async function ensureHeic2AnyLoaded(){
  if (window.heic2any) return;
  if (!heic2anyReadyPromise){
    heic2anyReadyPromise = loadScript("https://unpkg.com/heic2any@0.0.4/dist/heic2any.min.js");
  }
  try{
    await heic2anyReadyPromise;
  }catch(e){
    throw new Error("HEIC conversion files could not load. Your network may be blocking the external library.");
  }
  if (!window.heic2any){
    throw new Error("HEIC conversion is unavailable in this browser.");
  }
}

async function normaliseIncomingFile(file){
  if (!file) return null;
  if (!isHeicLike(file)) return file;

  setStatus(`Converting HEIC: ${file.name}`);
  await ensureHeic2AnyLoaded();

  let converted;
  try{
    converted = await window.heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
  }catch(e){
    throw new Error("HEIC conversion failed. The file may be unsupported or the converter may be blocked.");
  }

  const blob = Array.isArray(converted) ? converted[0] : converted;
  const safeName = (file.name || "image.heic").replace(/\.(heic|heif)$/i, ".jpg");
  return new File([blob], safeName, { type: "image/jpeg", lastModified: Date.now() });
}

async function ensureFaceDetector(){
  if (faceDetector) return faceDetector;
  if (!faceDetectorInitPromise){
    faceDetectorInitPromise = (async () => {
      try{
        let visionModule;
        try{
          visionModule = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm");
        }catch(e){
          throw new Error("Face detection files could not load. Your network may be blocking MediaPipe.");
        }

        let vision;
        try{
          vision = await visionModule.FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
          );
        }catch(e){
          throw new Error("Face detection runtime could not start.");
        }

        try{
          faceDetector = await visionModule.FaceDetector.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite"
            },
            runningMode: "IMAGE",
            minDetectionConfidence: 0.35
          });
        }catch(e){
          throw new Error("Face detection model could not be created.");
        }

        return faceDetector;
      }catch(e){
        faceDetectorInitPromise = null;
        throw e;
      }
    })();
  }
  return await faceDetectorInitPromise;
}

function pickBestDetection(detections){
  if (!detections || !detections.length) return null;
  return detections
    .map(d => {
      const box = d.boundingBox || {};
      const score = d.categories && d.categories[0] ? d.categories[0].score || 0 : 0;
      const area = (box.width || 0) * (box.height || 0);
      return { detection: d, rank: area * (0.7 + score) };
    })
    .sort((a,b) => b.rank - a.rank)[0].detection;
}

async function autoFocusFace(){
  if (!cropper || !imageEl.src){
    setStatus("Please choose an image first.");
    return;
  }

  try{
    setStatus("Detecting face…");
    autoFaceBtn.disabled = true;
    const detector = await ensureFaceDetector();
    const result = await detector.detect(imageEl);
    const best = pickBestDetection(result && result.detections ? result.detections : []);
    if (!best || !best.boundingBox){
      setStatus("No face found in this image.");
      return;
    }

    const imgW = imageEl.naturalWidth || 0;
    const imgH = imageEl.naturalHeight || 0;
    const box = best.boundingBox;
    const cx = (box.originX || 0) + (box.width || 0) / 2;
    const cy = (box.originY || 0) + (box.height || 0) / 2;
    const targetAR = targetWidth / targetHeight;

    let cropW = Math.max((box.width || 0) * 2.4, imgW * 0.22);
    let cropH = Math.max((box.height || 0) * 3.0, imgH * 0.22);

    if ((cropW / cropH) > targetAR) cropH = cropW / targetAR;
    else cropW = cropH * targetAR;

    cropW = Math.min(cropW, imgW);
    cropH = Math.min(cropH, imgH);

    let x = cx - cropW / 2;
    let y = cy - cropH * 0.38;

    x = clamp(x, 0, Math.max(0, imgW - cropW));
    y = clamp(y, 0, Math.max(0, imgH - cropH));

    cropper.setData({
      x,
      y,
      width: cropW,
      height: cropH,
      rotate: currentRotation,
      scaleX: currentScaleX,
      scaleY: currentScaleY
    });
    cropper.crop();
    cropRemoved = false;
    currentZoomRatio = getActualZoomRatio();
    pushHistory();
    scheduleEstimate();
    updateHeaderGuideVisibility();
    setStatus("Face-focused crop applied.");
  }catch(e){
    console.error(e);
    setStatus(e.message || "Face detection could not start in this browser/environment.");
  }finally{
    autoFaceBtn.disabled = false;
  }
}

async function inspectImageLimits(file){
  if (file.size > SAFE_LIMITS.maxSingleBytes){
    throw new Error(`"${file.name}" is larger than ${humanFileSize(SAFE_LIMITS.maxSingleBytes)}. Please resize or compress it first.`);
  }

  const dataUrl = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("Could not inspect file."));
    r.onload = () => resolve(r.result);
    r.readAsDataURL(file);
  });

  const dims = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({
      w: img.naturalWidth || 0,
      h: img.naturalHeight || 0
    });
    img.onerror = () => reject(new Error("Could not inspect image dimensions."));
    img.src = dataUrl;
  });

  const isVeryLarge = (dims.w * dims.h) > SAFE_LIMITS.maxSinglePixels;

  return {
    dims,
    warning: isVeryLarge
      ? `Loaded with warning: "${file.name}" is very large (${dims.w}×${dims.h}) and may be slow in the browser.`
      : ""
  };
}

function makeSafeBaseName(file){
  const raw = String((file && file.name) || "image");
  return raw.replace(/\.[^/.]+$/, "") || "image";
}

async function loadFile(file){
  if (!file) return;
  try{
    const readyFile = await normaliseIncomingFile(file);
    await inspectImageLimits(readyFile);
    originalBytes = readyFile.size || 0;
    originalBaseName = makeSafeBaseName(readyFile);
    setStatus(`Loaded: ${readyFile.name}`);
    const reader = new FileReader();
    reader.onerror = () => setStatus(`Could not read: ${readyFile.name}`);
    reader.onload = () => { imageEl.src = reader.result; };
    reader.readAsDataURL(readyFile);
  }catch(e){
    console.error(e);
    setStatus(e.message || `Could not process: ${file.name}`);
  }
}

imageEl.onerror = () => {
  setStatus("This image couldn’t be loaded (corrupt/unsupported).");
  safeDestroyCropper();
  showDropUI(true);
  clearEstimate();
  origPill.textContent = "Original: —";
  updateHeaderGuideVisibility();
};

imageEl.onload = () => {
  showDropUI(false);
  originalDims = { w: imageEl.naturalWidth || 0, h: imageEl.naturalHeight || 0 };
  setOrigPill();
  updateDimsPill();
  initCropper();
  updateHeaderGuideVisibility();
};

async function downloadCurrent(){
  if (!cropper){
    setStatus("Please choose an image first.");
    return;
  }
  const blob = await getCurrentExportBlob();
  if (!blob){
    setStatus("Could not create image.");
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filenameFor(originalBaseName);
  a.click();
  URL.revokeObjectURL(url);
  setStatus(`Downloaded: ${filenameFor(originalBaseName)}`);
}

async function copyImage(){
  if (!cropper){
    setStatus("Please choose an image first.");
    return;
  }
  setStatus("Copying…");
  const blob = await getCurrentExportBlob();
  if (!blob){
    setStatus("Could not create image.");
    return;
  }
  try{
    if (!navigator.clipboard || !window.ClipboardItem){
      setStatus("Copy isn’t supported in this browser. Use Download instead.");
      return;
    }
    const item = new ClipboardItem({ [blob.type]: blob });
    await navigator.clipboard.write([item]);
    setStatus("Copied.");
  }catch(e){
    setStatus("Could not copy. Use Download instead.");
  }
}

async function upscaleCanvas2x(inputCanvas){
  const engine = await ensureUpscaler();
  const result = await engine.upscale(inputCanvas);
  if (typeof result === "string") {
    const img = await dataUrlToImage(result);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext("2d").drawImage(img, 0, 0);
    return canvas;
  }
  if (result instanceof HTMLCanvasElement) {
    return result;
  }
  if (result instanceof HTMLImageElement) {
    const canvas = document.createElement("canvas");
    canvas.width = result.naturalWidth || result.width;
    canvas.height = result.naturalHeight || result.height;
    canvas.getContext("2d").drawImage(result, 0, 0);
    return canvas;
  }
  throw new Error("Unsupported AI upscale result.");
}

async function aiUpscaleAndDownload(){
  if (!cropper){
    setStatus("Please choose an image first.");
    return;
  }

  const scale = parseInt(aiScaleSelect.value, 10) || 2;

  let baseCanvas;
  if (cropRemoved || !cropper.cropped) {
    baseCanvas = getFullFrameCanvas(targetWidth, targetHeight);
  } else {
    baseCanvas = cropper.getCroppedCanvas({ width: targetWidth, height: targetHeight });
  }

  if (!baseCanvas){
    setStatus("Could not create image.");
    return;
  }

  applySharpenToCanvas(baseCanvas);

  const basePixels = baseCanvas.width * baseCanvas.height;
  const limit = scale === 4 ? SAFE_LIMITS.maxAiPixels4x : SAFE_LIMITS.maxAiPixels2x;
  if (basePixels > limit){
    setStatus(`AI upscale cancelled. ${scale}x is too heavy for this image size in-browser.`);
    return;
  }

  try{
    aiDownloadBtn.disabled = true;
    setStatus(`Running AI upscale (${scale}x)…`);

    let outputCanvas = await upscaleCanvas2x(baseCanvas);

    if (scale === 4){
      setStatus("Running AI upscale (4x)… second pass");
      outputCanvas = await upscaleCanvas2x(outputCanvas);
    }

    const blob = await canvasToBlob(outputCanvas, getMime(), getQualityFloat());
    const finalWidth = outputCanvas.width;
    const finalHeight = outputCanvas.height;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filenameForAi(originalBaseName, finalWidth, finalHeight, scale);
    a.click();
    URL.revokeObjectURL(url);

    setStatus(`AI upscale complete: ${finalWidth}×${finalHeight}`);
  }catch(e){
    console.error(e);
    setStatus(e.message || "AI upscale failed.");
  }finally{
    aiDownloadBtn.disabled = false;
  }
}

async function setQualityForTargetBytes(targetBytes){
  if (!cropper || currentPresetGroup === PRESET_GROUP.NEWSLETTER) return;

  let lo = 0.60, hi = 0.95;
  let bestQ = hi;
  let bestSize = Infinity;
  const canvas = cropRemoved || !cropper.cropped
    ? getFullFrameCanvas(targetWidth, targetHeight)
    : cropper.getCroppedCanvas({ width: targetWidth, height: targetHeight });

  if (!canvas) return;
  applySharpenToCanvas(canvas);
  const mime = getMime();

  for (let i=0;i<8;i++){
    const mid = (lo + hi) / 2;
    const blob = await canvasToBlob(canvas, mime, mid);
    const size = blob ? blob.size : Infinity;
    if (Math.abs(size-targetBytes) < Math.abs(bestSize-targetBytes)){
      bestSize = size;
      bestQ = mid;
    }
    if (size > targetBytes) hi = mid; else lo = mid;
  }

  const pct = Math.round(bestQ*100);
  qualitySlider.value = Math.min(95, Math.max(60, pct));
  qualityPill.textContent = `${qualitySlider.value}%`;
  setEstimatePill(bestSize);
  setStatus("Quality adjusted (estimate).");
}

async function handleFiles(files){
  const rawFiles = Array.from(files || []);
  if (!rawFiles.length) return;

  if (rawFiles.length > SAFE_LIMITS.maxBatchFiles){
    setStatus(`Please use ${SAFE_LIMITS.maxBatchFiles} files or fewer at a time.`);
    return;
  }

  const accepted = rawFiles.filter(f => {
    const type = String(f.type || "").trim().toLowerCase();
    return type.startsWith("image/") || isHeicLike(f);
  });

  if (!accepted.length){
    setStatus("No supported image files found.");
    return;
  }

  selectedFiles = [];
  const rejected = [];

  for (const file of accepted){
    try{
      const ready = await normaliseIncomingFile(file);
      await inspectImageLimits(ready);
      selectedFiles.push(ready);
    }catch(e){
      console.error(e);
      rejected.push(`${file.name}: ${e.message}`);
    }
  }

  if (!selectedFiles.length){
    setStatus(rejected[0] || "No supported image files were ready to load.");
    return;
  }

  await loadFile(selectedFiles[0]);
  if (selectedFiles.length > 1){
    setStatus(`Loaded ${selectedFiles.length} images.${rejected.length ? ` ${rejected.length} skipped.` : ""}`);
  } else if (rejected.length){
    setStatus(`${rejected.length} file(s) skipped. First issue: ${rejected[0]}`);
  }
}

imageStage.addEventListener("dragover", (e) => {
  e.preventDefault();
  imageStage.classList.add("dragover");
});

imageStage.addEventListener("dragleave", () => imageStage.classList.remove("dragover"));

imageStage.addEventListener("drop", async (e) => {
  e.preventDefault();
  imageStage.classList.remove("dragover");
  if (!e.dataTransfer || !e.dataTransfer.files) return;
  await handleFiles(e.dataTransfer.files);
});

window.addEventListener("paste", async (e) => {
  const items = (e.clipboardData && e.clipboardData.items) ? Array.from(e.clipboardData.items) : [];
  const imgItem = items.find(it => it.type && it.type.startsWith("image/"));
  if (!imgItem) return;

  const pastedFile = imgItem.getAsFile();
  if (pastedFile){
    const safeType = pastedFile.type || "image/png";
    const extension = safeType.includes("png") ? "png" : safeType.includes("webp") ? "webp" : "jpg";
    const namedFile = new File([pastedFile], `pasted-image.${extension}`, {
      type: safeType,
      lastModified: Date.now()
    });

    selectedFiles = [namedFile];
    await loadFile(namedFile);
    setStatus("Pasted image.");
  }
});

function readFileAsDataURL(file){
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("read"));
    r.onload = () => resolve(r.result);
    r.readAsDataURL(file);
  });
}

function imageFromDataURL(dataURL){
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("decode"));
    img.src = dataURL;
  });
}

async function batchFast(){
  if (!selectedFiles || selectedFiles.length < 2){
    setStatus("Select multiple images first.");
    return;
  }

  batchSummary.textContent = "";
  batchProgWrap.classList.add("show");
  batchProg.value = 0;
  batchProg.max = selectedFiles.length;
  batchProgText.textContent = `0 / ${selectedFiles.length}`;

  const zip = new JSZip();
  const seen = new Set();
  const mime = getMime();
  const quality = getQualityFloat();
  const ext = getExt();
  const targetAR = targetWidth / targetHeight;
  let exported = 0;
  const skipped = [];

  for (let i=0;i<selectedFiles.length;i++){
    const file = selectedFiles[i];
    const base = makeSafeBaseName(file);
    try{
      const dataURL = await readFileAsDataURL(file);
      const tmpImg = await imageFromDataURL(dataURL);
      const srcW = tmpImg.naturalWidth;
      const srcH = tmpImg.naturalHeight;
      const srcAR = srcW / srcH;

      let cropW, cropH, sx, sy;
      if (srcAR > targetAR){
        cropH = srcH;
        cropW = Math.round(srcH * targetAR);
        sx = Math.round((srcW - cropW) / 2);
        sy = 0;
      } else {
        cropW = srcW;
        cropH = Math.round(srcW / targetAR);
        sx = 0;
        sy = Math.round((srcH - cropH) / 2);
      }

      const canv = document.createElement("canvas");
      canv.width = targetWidth;
      canv.height = targetHeight;
      const ctx = canv.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.save();
      ctx.translate(targetWidth / 2, targetHeight / 2);
      ctx.scale(currentScaleX, currentScaleY);
      ctx.rotate((normalizeRotation(currentRotation) * Math.PI) / 180);
      ctx.drawImage(tmpImg, sx, sy, cropW, cropH, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
      ctx.restore();
      applySharpenToCanvas(canv);

      const blob = await canvasToBlob(canv, mime, quality);
      const filename = uniqueZipName(seen, `${base}_${targetWidth}x${targetHeight}.${ext}`);
      zip.file(filename, await blob.arrayBuffer());
      exported++;
    }catch(err){
      skipped.push(file.name || `image-${i+1}`);
    }

    batchProg.value = i+1;
    batchProgText.textContent = `${i+1} / ${selectedFiles.length}`;
  }

  const skippedCount = skipped.length;
  batchProgWrap.classList.remove("show");

  if (exported === 0){
    batchSummary.textContent = `No images could be exported.${skippedCount ? ` ${skippedCount} failed.` : ""}`;
    setStatus("Batch failed — no images exported.");
    return;
  }

  const zipBlob = await zip.generateAsync({ type:"blob" });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `batch_${targetWidth}x${targetHeight}.zip`;
  a.click();
  URL.revokeObjectURL(url);

  batchSummary.textContent = `${exported} exported, ${skippedCount} skipped${skippedCount ? ` (e.g. ${skipped.slice(0,3).join(", ")}${skippedCount>3?"…":""})` : ""}`;
  setStatus("Batch complete.");
}

function openManualBatch(){
  if (!selectedFiles || selectedFiles.length < 2){
    setStatus("Select multiple images first.");
    return;
  }
  manualZip = new JSZip();
  manualSeen = new Set();
  manualFiles = selectedFiles.slice();
  manualIndex = 0;
  manualAdded = 0;
  manualSkipped = 0;
  manualFailed = [];
  batchModal.classList.add("show");
  updateManualUI();
  loadFile(manualFiles[manualIndex]);
  setTimeout(() => { try{ batchAddNext.focus(); }catch(e){} }, 0);
}

function closeManualBatch(){
  batchModal.classList.remove("show");
  manualZip = null;
  manualSeen = null;
  manualFiles = [];
  manualIndex = 0;
  manualAdded = 0;
  manualSkipped = 0;
  manualFailed = [];
  setStatus("Manual batch cancelled.");
}

function updateManualUI(){
  batchStep.textContent = `${manualIndex+1} / ${manualFiles.length}`;
  batchFileName.textContent = manualFiles[manualIndex] ? (manualFiles[manualIndex].name || `image-${manualIndex+1}`) : "—";
  batchPrev.disabled = manualIndex <= 0;
}

async function manualAddCurrent(){
  if (!cropper || !manualZip) return;
  const file = manualFiles[manualIndex];
  const base = makeSafeBaseName(file);
  const filename = uniqueZipName(manualSeen, `${base}_${targetWidth}x${targetHeight}.${getExt()}`);
  try{
    const canvas = cropRemoved || !cropper.cropped
      ? getFullFrameCanvas(targetWidth, targetHeight)
      : cropper.getCroppedCanvas({ width: targetWidth, height: targetHeight });
    applySharpenToCanvas(canvas);
    const blob = await canvasToBlob(canvas, getMime(), getQualityFloat());
    manualZip.file(filename, await blob.arrayBuffer());
    manualAdded++;
    setStatus(`Added: ${filename}`);
  }catch(e){
    manualFailed.push(file.name || `image-${manualIndex+1}`);
    setStatus(`Could not export: ${file.name || `image-${manualIndex+1}`}`);
  }
}

function manualNext(){
  if (manualIndex < manualFiles.length-1){
    manualIndex++;
    updateManualUI();
    loadFile(manualFiles[manualIndex]);
    setTimeout(() => { try{ batchAddNext.focus(); }catch(e){} }, 0);
  } else {
    setStatus("End of manual batch. Finish to download ZIP.");
  }
}

async function manualAddAndNext(){
  await manualAddCurrent();
  if (manualIndex >= manualFiles.length - 1){
    setStatus("Last image added. Click Finish & Download ZIP when ready.");
  } else {
    manualNext();
  }
}
function manualSkipNext(){ manualSkipped++; manualNext(); }

function manualBack(){
  if (manualIndex <= 0) return;
  manualIndex--;
  updateManualUI();
  loadFile(manualFiles[manualIndex]);
  setTimeout(() => { try{ batchAddNext.focus(); }catch(e){} }, 0);
}

async function manualFinish(){
  if (!manualZip) return;
  batchModal.classList.remove("show");
  batchProgWrap.classList.add("show");
  batchProg.value = 1;
  batchProg.max = 1;
  batchProgText.textContent = "Building ZIP…";
  const zipBlob = await manualZip.generateAsync({ type:"blob" });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `batch_manual_${targetWidth}x${targetHeight}.zip`;
  a.click();
  URL.revokeObjectURL(url);
  const failCount = manualFailed.length;
  batchSummary.textContent = `${manualAdded} added, ${manualSkipped} skipped${failCount ? `, ${failCount} failed` : ""}`;
  manualZip = null;
  manualSeen = null;
  manualFiles = [];
  manualIndex = 0;
  setStatus("Manual batch complete.");
}

skinToggle.addEventListener("change", () => {
  document.body.classList.toggle("mac9", skinToggle.checked);
  setSkinUI();
});

headerGuideToggle.addEventListener("change", updateHeaderGuideVisibility);

selectImagesBtn.addEventListener("click", () => fileInput.click());
browseLink.addEventListener("click", () => fileInput.click());
browseLink.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fileInput.click();
  }
});

fileInput.addEventListener("change", async () => {
  if (!fileInput.files || !fileInput.files.length) return;
  await handleFiles(fileInput.files);
  fileInput.value = "";
});

presetTabs.forEach(tab => {
  tab.addEventListener("click", () => activateTab(tab.dataset.tab));
});

PRESET_DEFINITIONS.forEach(({ id, w, h, group, tab }) => {
  const presetEl = document.getElementById(id);
  if (!presetEl) return;
  presetEl.addEventListener("click", () => setPreset(w, h, group, id, tab));
});

applyCustomBtn.addEventListener("click", applyCustom);
undoBtn.addEventListener("click", undo);
resetCropBtn.addEventListener("click", resetCrop);
removeCropBtn.addEventListener("click", removeCrop);
resetViewBtn.addEventListener("click", resetView);
copyBtn.addEventListener("click", copyImage);
downloadBtn.addEventListener("click", downloadCurrent);
autoFaceBtn.addEventListener("click", autoFocusFace);
if (flipBtn) flipBtn.addEventListener("click", toggleFlip);
if (flipVerticalBtn) flipVerticalBtn.addEventListener("click", toggleFlipVertical);
if (rotate90Btn) rotate90Btn.addEventListener("click", rotateNinety);
aiDownloadBtn.addEventListener("click", aiUpscaleAndDownload);

zoomSlider.addEventListener("input", () => {
  pendingZoomValue = parseInt(zoomSlider.value, 10);
  zoomPill.textContent = `${pendingZoomValue}%`;
  if (!zoomRafPending){
    zoomRafPending = true;
    requestAnimationFrame(() => {
      zoomRafPending = false;
      applyZoomPct(pendingZoomValue);
      if (!cropRemoved) pushHistory();
    });
  }
});

rotSlider.addEventListener("input", () => {
  pendingRotValue = parseFloat(rotSlider.value);
  rotPill.textContent = `${pendingRotValue.toFixed(1)}°`;
  if (!rotRafPending){
    rotRafPending = true;
    requestAnimationFrame(() => {
      rotRafPending = false;
      applyRotationDeg(pendingRotValue);
      if (!cropRemoved) pushHistory();
    });
  }
});

resetZoomBtn.addEventListener("click", resetZoom);
resetRotBtn.addEventListener("click", resetRotation);

qualitySlider.addEventListener("input", () => {
  if (currentPresetGroup === PRESET_GROUP.NEWSLETTER) return;
  qualityPill.textContent = `${qualitySlider.value}%`;
  scheduleEstimate();
});

sharpenToggle.addEventListener("change", scheduleEstimate);

formatSelect.addEventListener("change", () => {
  if (currentPresetGroup === PRESET_GROUP.NEWSLETTER) return;
  scheduleEstimate();
  setStatus(`Format: ${formatSelect.value.toUpperCase()}`);
});

target1mb.addEventListener("click", () => setQualityForTargetBytes(1024*1024));
target500kb.addEventListener("click", () => setQualityForTargetBytes(500*1024));
target250kb.addEventListener("click", () => setQualityForTargetBytes(250*1024));

batchFastBtn.addEventListener("click", batchFast);
batchManualBtn.addEventListener("click", openManualBatch);
batchCancel.addEventListener("click", closeManualBatch);
batchPrev.addEventListener("click", manualBack);
batchSkipNext.addEventListener("click", manualSkipNext);
batchAddNext.addEventListener("click", manualAddAndNext);
batchFinish.addEventListener("click", manualFinish);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && batchModal.classList.contains("show")) {
    closeManualBatch();
  }
});

updateDimsPill();
updateFormatLockUI();
zoomPill.textContent = "100%";
rotPill.textContent = "0°";
clearEstimate();
setOrigPill();
showDropUI(true);
undoBtn.disabled = true;
setSkinUI();
activateTab("article");
activatePresetCard("presetArticleCard");
updateHeaderGuideVisibility();
setStatus("");

// ===== ALT TEXT =====
const altTextSection = document.getElementById("altTextSection");
const altTextInput = document.getElementById("altTextInput");
const generateAltBtn = document.getElementById("generateAltBtn");
const copyAltBtn = document.getElementById("copyAltBtn");
const altStatusLine = document.getElementById("altStatusLine");

function setAltStatus(msg) {
  if (altStatusLine) altStatusLine.textContent = msg || "";
}

function showAltTextSection(show) {
  if (altTextSection) altTextSection.style.display = show ? "" : "none";
}

function getAltPreviewBase64() {
  if (!cropper) return null;
  const MAX = 512;
  let sourceCanvas;
  if (cropRemoved || !cropper.cropped) {
    const iw = imageEl.naturalWidth || 0;
    const ih = imageEl.naturalHeight || 0;
    if (!iw || !ih) return null;
    const scale = Math.min(1, MAX / Math.max(iw, ih));
    sourceCanvas = getFullFrameCanvas(Math.round(iw * scale), Math.round(ih * scale));
  } else {
    const scale = Math.min(1, MAX / Math.max(targetWidth, targetHeight));
    sourceCanvas = cropper.getCroppedCanvas({
      width: Math.round(targetWidth * scale),
      height: Math.round(targetHeight * scale)
    });
  }
  if (!sourceCanvas) return null;
  return sourceCanvas.toDataURL("image/jpeg", 0.8).split(",")[1];
}

generateAltBtn.addEventListener("click", async () => {
  if (!cropper) {
    setAltStatus("Please load an image first.");
    return;
  }
  generateAltBtn.disabled = true;
  setAltStatus("Generating…");
  try {
    const imageData = getAltPreviewBase64();
    if (!imageData) {
      setAltStatus("Could not process image.");
      return;
    }
    const response = await fetch("https://image-resizer-tool-3n2supkya-hatch-sses-projects.vercel.app/api/alt-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageData, mimeType: "image/jpeg" })
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      setAltStatus(err.error || "Generation failed. Check your Vercel setup.");
      return;
    }
    const { altText } = await response.json();
    if (altTextInput) altTextInput.value = altText || "";
    setAltStatus("Generated. Review and edit before use.");
  } catch (e) {
    console.error(e);
    setAltStatus("Could not reach the AI service.");
  } finally {
    generateAltBtn.disabled = false;
  }
});

copyAltBtn.addEventListener("click", async () => {
  const text = altTextInput ? altTextInput.value.trim() : "";
  if (!text) {
    setAltStatus("Nothing to copy.");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    setAltStatus("Copied to clipboard.");
  } catch (e) {
    setAltStatus("Could not copy — please select and copy manually.");
  }
});

imageEl.addEventListener("load", () => {
  showAltTextSection(true);
  if (altTextInput) altTextInput.value = "";
  setAltStatus("");
});
