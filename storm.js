document.addEventListener('DOMContentLoaded', () => {
  const tabBar = document.querySelector('.presetTabs');
  const sideInner = document.querySelector('.sideInner');
  const sseToggle = document.getElementById('sseToggle');
  const imageStage = document.getElementById('imageStage');
  const dimsPill = document.getElementById('dimsPill');
  const origPill = document.getElementById('origPill');
  const estimatePill = document.getElementById('estimatePill');

  if (!tabBar || !sideInner || !sseToggle || !imageStage) return;

  const normalPillState = {
    dims: dimsPill ? dimsPill.textContent : '',
    orig: origPill ? origPill.textContent : '',
    estimate: estimatePill ? estimatePill.textContent : ''
  };

  const stormPalettes = {
    blue: { label: 'Blue', background: '#003E66', text: '#FFFFFF', contrast: 'light' },
    yellow: { label: 'Yellow', background: '#FFE816', text: '#000000', contrast: 'dark' },
    amber: { label: 'Amber', background: '#FF9700', text: '#000000', contrast: 'dark' },
    red: { label: 'Red', background: '#A42828', text: '#FFFFFF', contrast: 'light' }
  };

  const powerCutBadge = new Image();
  let powerCutBadgeReady = false;
  powerCutBadge.onload = () => {
    powerCutBadgeReady = true;
    renderStormGraphic(false);
  };
  powerCutBadge.onerror = () => {
    powerCutBadgeReady = false;
    renderStormGraphic(false);
  };
  powerCutBadge.src = './powercut-105.png?v=4';

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
      <img id="stormBadgeOverlay" class="stormBadgeOverlay" src="./powercut-105.png?v=4" alt="Power cut? Call 105" aria-hidden="true" />
      <div id="stormEditableText" class="stormEditableText" contenteditable="true" spellcheck="false" aria-label="Edit storm update text">STORM<br>XXX<br>UPDATE</div>
    </div>
  `;
  imageStage.appendChild(stageEditor);

  const panel = document.createElement('div');
  panel.className = 'tabPanel';
  panel.id = 'panel-storm';
  panel.innerHTML = `
    <p class="stormIntro">Create a 1080×1350 storm update graphic based on the SSEN storm PSD template.</p>

    <div class="stormBuilder">
      <div class="stormControls">
        <div class="stormField">
          <label for="stormBackground">Background</label>
          <select id="stormBackground">
            <option value="blue" selected>Blue</option>
            <option value="yellow">Yellow</option>
            <option value="amber">Amber</option>
            <option value="red">Red</option>
          </select>
        </div>

        <div class="stormField">
          <label for="stormFontSize">Font size</label>
          <input id="stormFontSize" type="range" min="70" max="170" value="122" />
          <div class="stormNote"><span id="stormFontSizeValue">122</span>px</div>
        </div>

        <div class="stormActions">
          <button class="btn primary" type="button" id="downloadStormGraphic">Download storm graphic</button>
          <button class="btn ghost" type="button" id="resetStormGraphic">Reset text</button>
        </div>

        <div class="stormNote">Click the text on the graphic to edit it. Text colour is automatic: white on red/blue, black on amber/yellow.</div>
      </div>
    </div>
  `;
  sideInner.appendChild(panel);

  const stormEditableText = document.getElementById('stormEditableText');
  const stormBadgeOverlay = document.getElementById('stormBadgeOverlay');
  if(stormBadgeOverlay){
    stormBadgeOverlay.onerror = () => {
      stormBadgeOverlay.style.display = 'none';
    };
  }

  function setStormPills(){
    if(dimsPill) dimsPill.textContent = 'Output: 1080 × 1350';
    if(origPill) origPill.textContent = 'Original: Storm template';
    if(estimatePill) estimatePill.textContent = 'Expected: PNG';
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

  tabBar.addEventListener('click', (e) => {
    const tab = e.target.closest('.presetTab');
    if(!tab) return;
    deactivateStormModeIfNeeded(tab.dataset.tab);
  });

  stormTab.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    activateStormTab();
  });

  function normaliseEditableText(){
    const plain = stormEditableText.innerText
      .replace(/\r/g, '')
      .split('\n')
      .map(line => line.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 5);

    return plain.length ? plain : ['STORM', 'XXX', 'UPDATE'];
  }

  function setEditableTextLines(lines){
    stormEditableText.innerHTML = lines.map(line => escapeHtml(line)).join('<br>');
  }

  function escapeHtml(value){
    return String(value).replace(/[&<>"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[char]));
  }

  function roundedRect(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawFallbackPowerCutBadge(ctx){
    const yellow = '#FFD400';
    const black = '#000000';
    const x = 642;
    const y = 74;
    const w = 370;
    const h = 250;
    const r = 18;

    ctx.save();
    ctx.fillStyle = yellow;
    roundedRect(ctx, x, y, w, h, r);
    ctx.fill();

    ctx.fillStyle = black;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 60px Impact, Arial Black, Arial, sans-serif';
    ctx.fillText('POWER CUT?', x + w / 2, y + 70);
    ctx.font = '900 92px Impact, Arial Black, Arial, sans-serif';
    ctx.fillText('CALL 105', x + w / 2, y + 170);

    ctx.fillStyle = yellow;
    ctx.beginPath();
    ctx.moveTo(x + 168, y + h - 1);
    ctx.lineTo(x + 128, y + h + 118);
    ctx.lineTo(x + 190, y + h + 118);
    ctx.lineTo(x + 148, y + h + 250);
    ctx.lineTo(x + 274, y + h + 46);
    ctx.lineTo(x + 214, y + h + 46);
    ctx.lineTo(x + 238, y + h - 1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawPowerCutBadge(ctx){
    if(powerCutBadgeReady && powerCutBadge.naturalWidth){
      const w = 370;
      const h = Math.round(w * (powerCutBadge.naturalHeight / powerCutBadge.naturalWidth));
      ctx.drawImage(powerCutBadge, 642, 74, w, h);
      return;
    }

    drawFallbackPowerCutBadge(ctx);
  }

  function drawFixedAssets(ctx, palette){
    drawPowerCutBadge(ctx);

    ctx.fillStyle = palette.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '300 54px "Museo Sans", Arial, Helvetica, sans-serif';
    ctx.fillText('ssen.co.uk/storm', 540, 1228);
  }

  function renderStormGraphic(includeText = false){
    const canvas = document.getElementById('stormCanvas');
    const backgroundField = document.getElementById('stormBackground');
    const fontSizeField = document.getElementById('stormFontSize');
    const fontSizeValue = document.getElementById('stormFontSizeValue');
    if(!canvas || !backgroundField || !fontSizeField || !stormEditableText) return;

    const ctx = canvas.getContext('2d');
    const palette = stormPalettes[backgroundField.value] || stormPalettes.blue;
    const fontSize = Number(fontSizeField.value) || 122;
    const lines = normaliseEditableText();

    if(fontSizeValue) fontSizeValue.textContent = String(fontSize);
    stormEditableText.style.color = palette.text;
    stormEditableText.dataset.contrast = palette.contrast;
    stormEditableText.style.fontSize = `${Math.round(fontSize * 0.44)}px`;

    ctx.clearRect(0, 0, 1080, 1350);
    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, 1080, 1350);

    drawFixedAssets(ctx, palette);

    if(includeText){
      drawMainText(ctx, palette, lines, fontSize);
    }
  }

  function drawMainText(ctx, palette, lines, fontSize){
    ctx.fillStyle = palette.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const lineGap = fontSize * 1.02;
    const totalHeight = (lines.length - 1) * lineGap;
    const startY = 675 - (totalHeight / 2);

    lines.forEach((line, index) => {
      fitAndFillText(ctx, line, 540, startY + (index * lineGap), 920, fontSize);
    });
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

  document.addEventListener('input', (e) => {
    if(e.target && ['stormBackground', 'stormFontSize'].includes(e.target.id)) renderStormGraphic(false);
  });

  document.addEventListener('change', (e) => {
    if(e.target && ['stormBackground', 'stormFontSize'].includes(e.target.id)) renderStormGraphic(false);
  });

  stormEditableText.addEventListener('input', () => renderStormGraphic(false));

  stormEditableText.addEventListener('blur', () => {
    setEditableTextLines(normaliseEditableText());
    renderStormGraphic(false);
  });

  stormEditableText.addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){
      const lines = normaliseEditableText();
      if(lines.length >= 5) e.preventDefault();
    }
  });

  document.addEventListener('click', (e) => {
    if(e.target && e.target.id === 'resetStormGraphic'){
      setEditableTextLines(['STORM', 'XXX', 'UPDATE']);
      renderStormGraphic(false);
    }

    if(e.target && e.target.id === 'downloadStormGraphic'){
      renderStormGraphic(true);
      const canvas = document.getElementById('stormCanvas');
      const link = document.createElement('a');
      const background = document.getElementById('stormBackground').value || 'blue';
      const slugText = normaliseEditableText().join('-').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') || 'storm-update';
      link.download = `${slugText}-${background}.png`;
      link.href = canvas.toDataURL('image/png');
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
