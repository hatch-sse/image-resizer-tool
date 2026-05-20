document.addEventListener('DOMContentLoaded', () => {
  const tabBar = document.querySelector('.presetTabs');
  const sideInner = document.querySelector('.sideInner');
  const sseToggle = document.getElementById('sseToggle');
  const imageStage = document.getElementById('imageStage');
  const dimsPill = document.getElementById('dimsPill');
  const origPill = document.getElementById('origPill');
  const estimatePill = document.getElementById('estimatePill');
  if (!tabBar || !sideInner || !sseToggle || !imageStage) return;

  const stormLogoSrc = './105%20min.png?v=1';
  const stormLogo = new Image();
  let stormLogoReady = false;
  stormLogo.onload = () => { stormLogoReady = true; renderStormGraphic(false); };
  stormLogo.onerror = () => { stormLogoReady = false; renderStormGraphic(false); };
  stormLogo.src = stormLogoSrc;

  let customBackground = null;
  let customBackgroundReady = false;
  let customBackgroundUrl = null;
  let bgOffsetX = 0;
  let bgOffsetY = 0;
  let bgDragActive = false;
  let bgDragStartX = 0;
  let bgDragStartY = 0;
  let bgDragStartOffsetX = 0;
  let bgDragStartOffsetY = 0;

  const normalPillState = {
    dims: dimsPill ? dimsPill.textContent : '',
    orig: origPill ? origPill.textContent : '',
    estimate: estimatePill ? estimatePill.textContent : ''
  };

  const stormPalettes = {
    blue: { background: '#003E66', text: '#FFFFFF', contrast: 'light' },
    yellow: { background: '#FFE816', text: '#000000', contrast: 'dark' },
    amber: { background: '#FF9700', text: '#000000', contrast: 'dark' },
    red: { background: '#A42828', text: '#FFFFFF', contrast: 'light' }
  };

  let stormTextTopRatio = 0.36;
  let isDraggingStormText = false;
  let dragStartY = 0;
  let dragStartTop = stormTextTopRatio;
  let suppressEditClick = false;

  const stormTab = document.createElement('button');
  stormTab.className = 'presetTab stormOnly';
  stormTab.type = 'button';
  stormTab.dataset.tab = 'storm';
  stormTab.textContent = 'Storm';
  tabBar.appendChild(stormTab);

  const stageEditor = document.createElement('div');
  stageEditor.className = 'stormStageEditor';
  stageEditor.innerHTML = `
    <div class="stormCanvasWrap">
      <canvas id="stormCanvas" class="stormCanvas" width="1080" height="1350"></canvas>
      <img id="stormBadgeOverlay" class="stormBadgeOverlay" src="${stormLogoSrc}" alt="Power cut? Call 105" aria-hidden="true" />
      <div id="stormEditableText" class="stormEditableText" contenteditable="true" spellcheck="false" aria-label="Edit storm update text">STORM<br>XXX<br>UPDATE</div>
    </div>`;
  imageStage.appendChild(stageEditor);

  const panel = document.createElement('div');
  panel.className = 'tabPanel';
  panel.id = 'panel-storm';
  panel.innerHTML = `
    <p class="stormIntro">Create a 1080×1350 storm update graphic based on the SSEN storm PSD template.</p>
    <div class="stormBuilder">
      <div class="stormControls">
        <div class="stormField">
          <label for="stormBackground">Background colour</label>
          <select id="stormBackground">
            <option value="blue" selected>Blue</option>
            <option value="yellow">Yellow</option>
            <option value="amber">Amber</option>
            <option value="red">Red</option>
          </select>
        </div>
        <div class="stormField">
          <label for="stormCustomBackground">Custom background image</label>
          <input id="stormCustomBackground" type="file" accept="image/*" />
          <button class="btn ghost" type="button" id="stormRemoveBackground">Remove custom background</button>
        </div>
        <div class="stormField">
          <label for="stormOverlayOpacity">Tint overlay</label>
          <input id="stormOverlayOpacity" type="range" min="0" max="90" value="35" />
          <div class="stormNote"><span id="stormOverlayValue">35</span>% opacity</div>
        </div>
        <div class="stormField">
          <label for="stormTextColour">Text colour</label>
          <select id="stormTextColour">
            <option value="auto" selected>Automatic</option>
            <option value="white">White</option>
            <option value="black">Black</option>
          </select>
        </div>
        <div class="stormField">
          <label for="stormFontSize">Font size</label>
          <input id="stormFontSize" type="range" min="70" max="170" value="138" />
          <div class="stormNote"><span id="stormFontSizeValue">138</span>px</div>
        </div>
        <div class="stormActions">
          <button class="btn primary" type="button" id="downloadStormGraphic">Download storm graphic</button>
          <button class="btn ghost" type="button" id="resetStormGraphic">Reset text</button>
        </div>
        <div class="stormNote">Click the text to edit it. Drag the text up or down. When using a custom background, drag the image area to reposition it.</div>
      </div>
    </div>`;
  sideInner.appendChild(panel);

  const stormEditableText = document.getElementById('stormEditableText');
  const stormCanvas = document.getElementById('stormCanvas');

  function setStormPills(){
    if(dimsPill) dimsPill.textContent = 'Output: 1080 × 1350';
    if(origPill) origPill.textContent = customBackgroundReady ? 'Original: Custom background' : 'Original: Storm template';
    if(estimatePill) estimatePill.textContent = 'Expected: JPG';
  }

  function restoreNormalPills(){
    if(dimsPill && normalPillState.dims) dimsPill.textContent = normalPillState.dims;
    if(origPill && normalPillState.orig) origPill.textContent = normalPillState.orig;
    if(estimatePill && normalPillState.estimate) estimatePill.textContent = normalPillState.estimate;
  }

  function activateStormTab(){
    document.querySelectorAll('.presetTab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tabPanel').forEach(p => p.classList.remove('active'));
    stormTab.classList.add('active');
    panel.classList.add('active');
    document.body.classList.add('stormMode');
    setStormPills();
    renderStormGraphic(false);
  }

  function deactivateStormModeIfNeeded(tabKey){
    if(tabKey !== 'storm'){
      stormTab.classList.remove('active');
      panel.classList.remove('active');
      document.body.classList.remove('stormMode');
      restoreNormalPills();
    }
  }

  tabBar.addEventListener('click', e => {
    const tab = e.target.closest('.presetTab');
    if(tab) deactivateStormModeIfNeeded(tab.dataset.tab);
  });

  stormTab.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    activateStormTab();
  });

  function normaliseEditableText(){
    const lines = stormEditableText.innerText.replace(/\r/g, '').split('\n')
      .map(line => line.trim().toUpperCase()).filter(Boolean).slice(0, 5);
    return lines.length ? lines : ['STORM', 'XXX', 'UPDATE'];
  }

  function setEditableTextLines(lines){
    stormEditableText.innerHTML = lines.map(line => String(line).replace(/[&<>"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]))).join('<br>');
  }

  function drawStormLogo(ctx){
    if(!stormLogoReady || !stormLogo.naturalWidth) return;
    const w = 250;
    const h = Math.round(w * (stormLogo.naturalHeight / stormLogo.naturalWidth));
    ctx.drawImage(stormLogo, 690, 115, w, h);
  }

  function getCoverRect(image){
    const canvasRatio = 1080 / 1350;
    const imageRatio = image.naturalWidth / image.naturalHeight;
    let drawW, drawH;
    if(imageRatio > canvasRatio){
      drawH = 1350;
      drawW = drawH * imageRatio;
    } else {
      drawW = 1080;
      drawH = drawW / imageRatio;
    }
    const minX = Math.min(0, 1080 - drawW);
    const maxX = 0;
    const minY = Math.min(0, 1350 - drawH);
    const maxY = 0;
    bgOffsetX = Math.min(maxX, Math.max(minX, bgOffsetX));
    bgOffsetY = Math.min(maxY, Math.max(minY, bgOffsetY));
    return { x: bgOffsetX, y: bgOffsetY, w: drawW, h: drawH };
  }

  function drawCoverImage(ctx, image){
    const r = getCoverRect(image);
    ctx.drawImage(image, r.x, r.y, r.w, r.h);
  }

  function getPaletteAndText(){
    const backgroundField = document.getElementById('stormBackground');
    const textColourField = document.getElementById('stormTextColour');
    const palette = stormPalettes[backgroundField?.value || 'blue'] || stormPalettes.blue;
    let text = palette.text;
    let contrast = palette.contrast;
    if(textColourField?.value === 'white'){
      text = '#FFFFFF';
      contrast = 'light';
    }
    if(textColourField?.value === 'black'){
      text = '#000000';
      contrast = 'dark';
    }
    return { ...palette, text, contrast };
  }

  function drawUrl(ctx, palette){
    ctx.fillStyle = palette.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '300 68px "Museo Sans", Arial, Helvetica, sans-serif';
    ctx.fillText('ssen.co.uk/storm', 540, 1188);
  }

  function renderStormGraphic(includeText = false){
    const canvas = document.getElementById('stormCanvas');
    const fontSizeField = document.getElementById('stormFontSize');
    const fontSizeValue = document.getElementById('stormFontSizeValue');
    const overlayField = document.getElementById('stormOverlayOpacity');
    const overlayValue = document.getElementById('stormOverlayValue');
    if(!canvas || !fontSizeField || !stormEditableText) return;
    const ctx = canvas.getContext('2d');
    const palette = getPaletteAndText();
    const fontSize = Number(fontSizeField.value) || 138;
    const overlayOpacity = Number(overlayField?.value || 0) / 100;
    const lines = normaliseEditableText();
    if(fontSizeValue) fontSizeValue.textContent = String(fontSize);
    if(overlayValue) overlayValue.textContent = String(Math.round(overlayOpacity * 100));
    stormEditableText.style.color = palette.text;
    stormEditableText.dataset.contrast = palette.contrast;
    stormEditableText.style.fontSize = `${Math.round(fontSize * 0.44)}px`;
    stormEditableText.style.top = `${stormTextTopRatio * 100}%`;
    setStormPills();
    ctx.clearRect(0, 0, 1080, 1350);
    if(customBackgroundReady && customBackground){
      drawCoverImage(ctx, customBackground);
      if(overlayOpacity > 0){
        ctx.fillStyle = palette.text === '#000000' ? `rgba(255,255,255,${overlayOpacity})` : `rgba(0,0,0,${overlayOpacity})`;
        ctx.fillRect(0, 0, 1080, 1350);
      }
    } else {
      ctx.fillStyle = palette.background;
      ctx.fillRect(0, 0, 1080, 1350);
    }
    drawUrl(ctx, palette);
    if(includeText){
      drawStormLogo(ctx);
      drawMainText(ctx, palette, lines, fontSize);
    }
  }

  function revokeCustomBackgroundUrl(){
    if(customBackgroundUrl){
      URL.revokeObjectURL(customBackgroundUrl);
      customBackgroundUrl = null;
    }
  }

  function drawMainText(ctx, palette, lines, fontSize){
    ctx.fillStyle = palette.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lineGap = fontSize * 1.02;
    const totalHeight = (lines.length - 1) * lineGap;
    const startY = (stormTextTopRatio * 1350) + 180 - (totalHeight / 2);
    lines.forEach((line, index) => fitAndFillText(ctx, line, 540, startY + (index * lineGap), 920, fontSize));
  }

  function fitAndFillText(ctx, text, x, y, maxWidth, baseFontSize){
    let size = baseFontSize;
    while(size > 42){
      ctx.font = `900 ${size}px Arial Black, Arial, sans-serif`;
      if(ctx.measureText(text).width <= maxWidth) break;
      size -= 2;
    }
    ctx.fillText(text, x, y);
  }

  function clamp(value, min, max){
    return Math.min(max, Math.max(min, value));
  }

  stormEditableText.addEventListener('pointerdown', e => {
    if(!document.body.classList.contains('stormMode')) return;
    isDraggingStormText = true;
    suppressEditClick = false;
    dragStartY = e.clientY;
    dragStartTop = stormTextTopRatio;
    stormEditableText.setPointerCapture?.(e.pointerId);
  });

  stormEditableText.addEventListener('pointermove', e => {
    if(!isDraggingStormText) return;
    const wrap = stormEditableText.closest('.stormCanvasWrap');
    if(!wrap) return;
    const delta = (e.clientY - dragStartY) / wrap.getBoundingClientRect().height;
    if(Math.abs(delta) > 0.004) suppressEditClick = true;
    stormTextTopRatio = clamp(dragStartTop + delta, 0.18, 0.58);
    renderStormGraphic(false);
  });

  stormEditableText.addEventListener('pointerup', e => {
    isDraggingStormText = false;
    stormEditableText.releasePointerCapture?.(e.pointerId);
  });

  stormEditableText.addEventListener('click', e => {
    if(suppressEditClick){
      e.preventDefault();
      suppressEditClick = false;
      stormEditableText.blur();
    }
  });

  stormCanvas.addEventListener('pointerdown', e => {
    if(!customBackgroundReady || !customBackground || !document.body.classList.contains('stormMode')) return;
    bgDragActive = true;
    bgDragStartX = e.clientX;
    bgDragStartY = e.clientY;
    bgDragStartOffsetX = bgOffsetX;
    bgDragStartOffsetY = bgOffsetY;
    stormCanvas.setPointerCapture?.(e.pointerId);
  });

  stormCanvas.addEventListener('pointermove', e => {
    if(!bgDragActive || !customBackgroundReady || !customBackground) return;
    const rect = stormCanvas.getBoundingClientRect();
    const scaleX = 1080 / rect.width;
    const scaleY = 1350 / rect.height;
    bgOffsetX = bgDragStartOffsetX + ((e.clientX - bgDragStartX) * scaleX);
    bgOffsetY = bgDragStartOffsetY + ((e.clientY - bgDragStartY) * scaleY);
    getCoverRect(customBackground);
    renderStormGraphic(false);
  });

  stormCanvas.addEventListener('pointerup', e => {
    bgDragActive = false;
    stormCanvas.releasePointerCapture?.(e.pointerId);
  });

  stormCanvas.addEventListener('pointercancel', () => {
    bgDragActive = false;
  });

  document.addEventListener('input', e => {
    if(e.target && ['stormBackground', 'stormFontSize', 'stormOverlayOpacity', 'stormTextColour'].includes(e.target.id)) renderStormGraphic(false);
  });

  document.addEventListener('change', e => {
    if(e.target && ['stormBackground', 'stormFontSize', 'stormOverlayOpacity', 'stormTextColour'].includes(e.target.id)) renderStormGraphic(false);
    if(e.target && e.target.id === 'stormCustomBackground'){
      const file = e.target.files?.[0];
      if(!file) return;
      revokeCustomBackgroundUrl();
      const img = new Image();
      img.onload = () => {
        customBackground = img;
        customBackgroundReady = true;
        bgOffsetX = 0;
        bgOffsetY = 0;
        getCoverRect(customBackground);
        renderStormGraphic(false);
      };
      img.onerror = () => {
        customBackground = null;
        customBackgroundReady = false;
        revokeCustomBackgroundUrl();
        renderStormGraphic(false);
      };
      customBackgroundUrl = URL.createObjectURL(file);
      img.src = customBackgroundUrl;
    }
  });

  stormEditableText.addEventListener('input', () => renderStormGraphic(false));
  stormEditableText.addEventListener('blur', () => {
    setEditableTextLines(normaliseEditableText());
    renderStormGraphic(false);
  });

  stormEditableText.addEventListener('keydown', e => {
    if(e.key === 'Enter' && normaliseEditableText().length >= 5) e.preventDefault();
  });

  document.addEventListener('click', e => {
    if(e.target && e.target.id === 'stormRemoveBackground'){
      customBackground = null;
      customBackgroundReady = false;
      revokeCustomBackgroundUrl();
      bgOffsetX = 0;
      bgOffsetY = 0;
      const fileInput = document.getElementById('stormCustomBackground');
      if(fileInput) fileInput.value = '';
      renderStormGraphic(false);
    }
    if(e.target && e.target.id === 'resetStormGraphic'){
      setEditableTextLines(['STORM', 'XXX', 'UPDATE']);
      stormTextTopRatio = 0.36;
      const fontSizeField = document.getElementById('stormFontSize');
      if(fontSizeField) fontSizeField.value = '138';
      renderStormGraphic(false);
    }
    if(e.target && e.target.id === 'downloadStormGraphic'){
      renderStormGraphic(true);
      const canvas = document.getElementById('stormCanvas');
      const link = document.createElement('a');
      const background = document.getElementById('stormBackground').value || 'blue';
      const slugText = normaliseEditableText().join('-').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') || 'storm-update';
      link.download = `${slugText}-${background}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.92);
      link.click();
      setTimeout(() => renderStormGraphic(false), 50);
    }
  });

  function updateStormVisibility(){
    const isSseSkin = sseToggle.checked;
    stormTab.style.display = isSseSkin ? 'none' : 'inline-flex';
    if(isSseSkin && stormTab.classList.contains('active')){
      stormTab.classList.remove('active');
      panel.classList.remove('active');
      document.body.classList.remove('stormMode');
      restoreNormalPills();
      document.querySelector('.presetTab[data-tab="article"]')?.click();
    }
  }

  sseToggle.addEventListener('change', updateStormVisibility);
  updateStormVisibility();
  renderStormGraphic(false);
});
