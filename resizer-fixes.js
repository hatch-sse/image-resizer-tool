(function(){
  const LIMITS = {
    maxOutputDimension: 8000,
    maxOutputPixels: 16000000
  };

  const el = {
    customW: document.getElementById("customW"),
    customH: document.getElementById("customH"),
    applyCustom: document.getElementById("applyCustom"),
    batchManual: document.getElementById("batchManualBtn"),
    batchModal: document.getElementById("batchModal"),
    batchStep: document.getElementById("batchStep"),
    batchFileName: document.getElementById("batchFileName"),
    batchCancel: document.getElementById("batchCancel"),
    batchPrev: document.getElementById("batchPrev"),
    batchSkipNext: document.getElementById("batchSkipNext"),
    batchAddNext: document.getElementById("batchAddNext"),
    batchFinish: document.getElementById("batchFinish"),
    batchProgWrap: document.getElementById("batchProgWrap"),
    batchProg: document.getElementById("batchProg"),
    batchProgText: document.getElementById("batchProgText"),
    batchSummary: document.getElementById("batchSummary")
  };

  const manual = {
    files: [],
    outputs: [],
    skipped: new Set(),
    failed: new Set(),
    index: 0,
    loading: false
  };

  function stop(e){
    e.preventDefault();
    e.stopImmediatePropagation();
  }

  function status(message){
    if (typeof setStatus === "function") setStatus(message);
  }

  function validateOutputSize(w, h){
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
      return "Please enter a valid width and height.";
    }
    if (w > LIMITS.maxOutputDimension || h > LIMITS.maxOutputDimension) {
      return `Please keep width and height at ${LIMITS.maxOutputDimension}px or below.`;
    }
    if (w * h > LIMITS.maxOutputPixels) {
      return `Please keep custom outputs under ${LIMITS.maxOutputPixels.toLocaleString()} total pixels.`;
    }
    return "";
  }

  function resetManual(){
    manual.files = [];
    manual.outputs = [];
    manual.skipped = new Set();
    manual.failed = new Set();
    manual.index = 0;
    manual.loading = false;
  }

  function setManualLoading(loading){
    manual.loading = loading;
    updateManualUI();
  }

  function updateManualUI(){
    if (!el.batchStep || !el.batchFileName) return;

    el.batchStep.textContent = `${manual.index + 1} / ${manual.files.length}`;
    const file = manual.files[manual.index];
    const fileLabel = file ? (file.name || `image-${manual.index + 1}`) : "-";
    let stateLabel = "";
    if (manual.outputs[manual.index]) stateLabel = " - added";
    else if (manual.skipped.has(manual.index)) stateLabel = " - skipped";
    else if (manual.failed.has(manual.index)) stateLabel = " - failed";
    el.batchFileName.textContent = `${fileLabel}${stateLabel}`;

    if (el.batchPrev) el.batchPrev.disabled = manual.loading || manual.index <= 0;
    if (el.batchSkipNext) el.batchSkipNext.disabled = manual.loading;
    if (el.batchAddNext) el.batchAddNext.disabled = manual.loading;
    if (el.batchFinish) el.batchFinish.disabled = manual.loading;
  }

  async function loadManualFile(index){
    setManualLoading(true);
    try {
      await loadFile(manual.files[index]);
    } finally {
      setManualLoading(false);
      setTimeout(() => { try { el.batchAddNext && el.batchAddNext.focus(); } catch(e) {} }, 0);
    }
  }

  async function openManualBatch(){
    if (!selectedFiles || selectedFiles.length < 2) {
      status("Select multiple images first.");
      return;
    }

    manual.files = selectedFiles.slice();
    manual.outputs = new Array(manual.files.length).fill(null);
    manual.skipped = new Set();
    manual.failed = new Set();
    manual.index = 0;
    manual.loading = false;
    el.batchModal && el.batchModal.classList.add("show");
    await loadManualFile(manual.index);
  }

  function closeManualBatch(){
    el.batchModal && el.batchModal.classList.remove("show");
    resetManual();
    status("Manual batch cancelled.");
  }

  async function addCurrent(){
    if (manual.loading || !cropper) return;

    const file = manual.files[manual.index];
    const base = makeSafeBaseName(file);
    const filename = `${base}_${targetWidth}x${targetHeight}.${getExt()}`;

    try {
      const canvas = cropRemoved || !cropper.cropped
        ? getFullFrameCanvas(targetWidth, targetHeight)
        : cropper.getCroppedCanvas({ width: targetWidth, height: targetHeight });

      if (!canvas) throw new Error("Could not create image.");
      applySharpenToCanvas(canvas);
      const blob = await canvasToBlob(canvas, getMime(), getQualityFloat());
      manual.outputs[manual.index] = {
        filename,
        arrayBuffer: await blob.arrayBuffer()
      };
      manual.skipped.delete(manual.index);
      manual.failed.delete(manual.index);
      updateManualUI();
      status(`Added: ${filename}`);
    } catch(e) {
      manual.outputs[manual.index] = null;
      manual.failed.add(manual.index);
      manual.skipped.delete(manual.index);
      updateManualUI();
      status(`Could not export: ${file.name || `image-${manual.index + 1}`}`);
    }
  }

  async function next(){
    if (manual.loading) return;
    if (manual.index < manual.files.length - 1) {
      manual.index++;
      await loadManualFile(manual.index);
    } else {
      status("End of manual batch. Finish to download ZIP.");
    }
  }

  async function back(){
    if (manual.loading || manual.index <= 0) return;
    manual.index--;
    await loadManualFile(manual.index);
  }

  async function skipNext(){
    if (manual.loading) return;
    manual.outputs[manual.index] = null;
    manual.skipped.add(manual.index);
    manual.failed.delete(manual.index);
    updateManualUI();
    await next();
  }

  async function addAndNext(){
    if (manual.loading) return;
    await addCurrent();
    if (manual.index >= manual.files.length - 1) {
      status("Last image added. Click Finish & Download ZIP when ready.");
    } else {
      await next();
    }
  }

  async function finish(){
    if (manual.loading || !manual.files.length) return;
    const outputs = manual.outputs
      .map((entry, index) => ({ entry, index }))
      .filter(item => item.entry);

    if (!outputs.length) {
      status("No images have been added to the manual batch yet.");
      return;
    }

    el.batchModal && el.batchModal.classList.remove("show");
    el.batchProgWrap && el.batchProgWrap.classList.add("show");
    if (el.batchProg) {
      el.batchProg.value = 1;
      el.batchProg.max = 1;
    }
    if (el.batchProgText) el.batchProgText.textContent = "Building ZIP...";

    const zip = new JSZip();
    const seen = new Set();
    outputs.forEach(({ entry }) => {
      zip.file(uniqueZipName(seen, entry.filename), entry.arrayBuffer);
    });

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `batch_manual_${targetWidth}x${targetHeight}.zip`;
    a.click();
    URL.revokeObjectURL(url);

    const addedCount = outputs.length;
    const failCount = manual.failed.size;
    const skippedCount = Math.max(0, manual.files.length - addedCount - failCount);
    if (el.batchSummary) {
      el.batchSummary.textContent = `${addedCount} added, ${skippedCount} skipped${failCount ? `, ${failCount} failed` : ""}`;
    }
    resetManual();
    status("Manual batch complete.");
  }

  if (el.applyCustom) {
    el.applyCustom.addEventListener("click", (e) => {
      const w = parseInt(el.customW && el.customW.value, 10);
      const h = parseInt(el.customH && el.customH.value, 10);
      const error = validateOutputSize(w, h);
      if (error) {
        stop(e);
        status(error);
      }
    }, true);
  }

  if (el.batchManual) el.batchManual.addEventListener("click", (e) => { stop(e); openManualBatch(); }, true);
  if (el.batchCancel) el.batchCancel.addEventListener("click", (e) => { stop(e); closeManualBatch(); }, true);
  if (el.batchPrev) el.batchPrev.addEventListener("click", (e) => { stop(e); back(); }, true);
  if (el.batchSkipNext) el.batchSkipNext.addEventListener("click", (e) => { stop(e); skipNext(); }, true);
  if (el.batchAddNext) el.batchAddNext.addEventListener("click", (e) => { stop(e); addAndNext(); }, true);
  if (el.batchFinish) el.batchFinish.addEventListener("click", (e) => { stop(e); finish(); }, true);
})();
