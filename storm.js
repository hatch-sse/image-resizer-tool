document.addEventListener('DOMContentLoaded', () => {
  const tabBar = document.querySelector('.presetTabs');
  const sideInner = document.querySelector('.sideInner');
  const sseToggle = document.getElementById('sseToggle');
  const imageStage = document.getElementById('imageStage');

  if (!tabBar || !sideInner || !sseToggle || !imageStage) return;

  const stormPalettes = {
    red: { label: 'Red', background: '#A81E23', text: '#FFFFFF', contrast: 'light' },
    amber: { label: 'Amber', background: '#F6A400', text: '#000000', contrast: 'dark' },
    yellow: { label: 'Yellow', background: '#FFD400', text: '#000000', contrast: 'dark' },
    blue: { label: 'Blue', background: '#003E66', text: '#FFFFFF', contrast: 'light' }
  };

  const logo = new Image();
  logo.onload = () => renderStormGraphic();
  logo.src = './SSEN_Distribution.png';

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
            <option value="red" selected>Red</option>
            <option value="amber">Amber</option>
            <option value="yellow">Yellow</option>
            <option value="blue">Blue</option>
          </select>
        </div>

        <div class="stormField">
          <label for="stormFontSize">Font size</label>
          <input id="stormFontSize" type="range" min="80" max="180" value="136" />
          <div class="stormNote"><span id="stormFontSizeValue">136</span>px</div>
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

  function activateStormTab(){
    document.querySelectorAll('.presetTab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tabPanel').forEach(p => p.classList.remove('active'));
    stormTab.classList.add('active');
    panel.classList.add('active');
    document.body.classList.add('stormMode');
    renderStormGraphic();
  }

  function deactivateStormModeIfNeeded(tabKey){
    if(tabKey !== 'storm'){
      document.body.classList.remove('stormMode');
    }
  }

  tabBar.addEventListener('click', (e) => {
    const tab = e.target.closest('.presetTab');
    if(!tab) return;
    deactivateStormModeIfNeeded(tab.dataset.tab);
  });

  stormTab.addEventListener('click', (e) => {
    e.preventDefault();
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

  function drawLightning(ctx, colour){
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.moveTo(628, 205);
    ctx.lineTo(545, 560);
    ctx.lineTo(653, 560);
    ctx.lineTo(575, 906);
    ctx.lineTo(805, 452);
    ctx.lineTo(686, 452);
    ctx.closePath();
    ctx.fill();
  }

  function drawFixedAssets(ctx, palette){
    if(logo.complete && logo.naturalWidth){
      const logoW = 315;
      const logoH = logoW * (logo.naturalHeight / logo.naturalWidth);
      ctx.drawImage(logo, 700, 70, logoW, logoH);
    } else {
      ctx.fillStyle = palette.text;
      ctx.font = '700 34px Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('SSEN Distribution', 1010, 118);
    }

    ctx.fillStyle = palette.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '700 54px Arial, sans-serif';
    ctx.fillText('ssen.co.uk/storm', 540, 1244);
  }

  function renderStormGraphic(){
    const canvas = document.getElementById('stormCanvas');
    const backgroundField = document.getElementById('stormBackground');
    const fontSizeField = document.getElementById('stormFontSize');
    const fontSizeValue = document.getElementById('stormFontSizeValue');
    if(!canvas || !backgroundField || !fontSizeField || !stormEditableText) return;

    const ctx = canvas.getContext('2d');
    const palette = stormPalettes[backgroundField.value] || stormPalettes.red;
    const fontSize = Number(fontSizeField.value) || 136;
    const lines = normaliseEditableText();

    if(fontSizeValue) fontSizeValue.textContent = String(fontSize);
    stormEditableText.style.color = palette.text;
    stormEditableText.dataset.contrast = palette.contrast;
    stormEditableText.style.fontSize = `${Math.round(fontSize * 0.44)}px`;

    ctx.clearRect(0, 0, 1080, 1350);
    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, 1080, 1350);

    ctx.save();
    ctx.globalAlpha = 0.16;
    drawLightning(ctx, palette.text);
    ctx.restore();

    drawFixedAssets(ctx, palette);

    ctx.fillStyle = palette.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const lineGap = fontSize * 1.06;
    const totalHeight = (lines.length - 1) * lineGap;
    const startY = 675 - (totalHeight / 2);

    lines.forEach((line, index) => {
      fitAndFillText(ctx, line, 540, startY + (index * lineGap), 920, fontSize);
    });
  }

  function fitAndFillText(ctx, text, x, y, maxWidth, baseFontSize){
    let size = baseFontSize;
    while(size > 48){
      ctx.font = `900 ${size}px Arial Black, Arial, sans-serif`;
      if(ctx.measureText(text).width <= maxWidth) break;
      size -= 2;
    }
    ctx.fillText(text, x, y);
  }

  document.addEventListener('input', (e) => {
    if(e.target && ['stormBackground', 'stormFontSize'].includes(e.target.id)){
      renderStormGraphic();
    }
  });

  document.addEventListener('change', (e) => {
    if(e.target && ['stormBackground', 'stormFontSize'].includes(e.target.id)){
      renderStormGraphic();
    }
  });

  stormEditableText.addEventListener('input', () => {
    renderStormGraphic();
  });

  stormEditableText.addEventListener('blur', () => {
    setEditableTextLines(normaliseEditableText());
    renderStormGraphic();
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
      renderStormGraphic();
    }

    if(e.target && e.target.id === 'downloadStormGraphic'){
      renderStormGraphic();
      const canvas = document.getElementById('stormCanvas');
      const link = document.createElement('a');
      const background = document.getElementById('stormBackground').value || 'red';
      const slugText = normaliseEditableText().join('-').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') || 'storm-update';
      link.download = `${slugText}-${background}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  });

  function updateStormVisibility(){
    const isSseSkin = sseToggle.checked;
    stormTab.style.display = isSseSkin ? 'none' : 'inline-flex';

    if(isSseSkin && stormTab.classList.contains('active')){
      document.body.classList.remove('stormMode');
      document.querySelector('.presetTab[data-tab="article"]')?.click();
    }
  }

  sseToggle.addEventListener('change', updateStormVisibility);
  updateStormVisibility();
  renderStormGraphic();
});
